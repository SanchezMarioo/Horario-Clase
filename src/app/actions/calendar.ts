'use server';

import { auth, currentUser } from '@clerk/nextjs/server';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { AcademicEvent, CalendarEventType, EventPriority } from '@/types/calendar';
import { SubjectId } from '@/types/schedule';
import { isUserAdmin, verifyAdminAuth } from '@/lib/adminAuth';

const createEventSchema = z.object({
  title: z
    .string()
    .min(3, 'El título debe tener al menos 3 caracteres')
    .max(100, 'El título no puede superar 100 caracteres')
    .transform((val) => val.trim().replace(/[<>]/g, '')),
  type: z.enum(['exam', 'assignment', 'project', 'reminder'], {
    message: 'Tipo de evento inválido',
  }),
  subjectId: z.enum([
    'sub-multimedia',
    'sub-datos',
    'sub-interfaces',
    'sub-gestion',
    'sub-servicios',
    'sub-ipe',
    'sub-nube',
    'sub-digitalizacion',
    'sub-sostenibilidad',
    'general',
  ]),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (AAAA-MM-DD)'),
  time: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Formato de hora inválido (HH:mm)')
    .optional()
    .or(z.literal('')),
  description: z
    .string()
    .max(500, 'La descripción no puede superar 500 caracteres')
    .optional()
    .transform((val) => val?.trim().replace(/[<>]/g, '')),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  isOfficial: z.boolean().optional(),
});

export type CalendarActionResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

/**
 * Obtener todos los eventos académicos (Acceso público de solo lectura)
 */
export async function getEventsAction(): Promise<CalendarActionResponse<AcademicEvent[]>> {
  try {
    const events = await prisma.academicEvent.findMany({
      orderBy: [{ date: 'asc' }, { time: 'asc' }],
    });

    const mapped: AcademicEvent[] = events.map((e) => ({
      id: e.id,
      title: e.title,
      type: e.type as CalendarEventType,
      subjectId: e.subjectId as SubjectId | 'general',
      date: e.date,
      time: e.time ?? undefined,
      description: e.description ?? undefined,
      priority: e.priority as EventPriority,
      completed: e.completed,
      isOfficial: e.isOfficial,
      authorId: e.authorId ?? undefined,
      authorName: e.authorName ?? undefined,
      authorEmail: e.authorEmail ?? undefined,
      createdAt: e.createdAt.toISOString(),
      updatedAt: e.updatedAt.toISOString(),
    }));

    return { success: true, data: mapped };
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    return { success: false, error: 'Error al consultar el calendario' };
  }
}

/**
 * Obtener los próximos eventos pendientes ordenados por fecha
 */
export async function getUpcomingEventsAction(
  limit = 5
): Promise<CalendarActionResponse<AcademicEvent[]>> {
  try {
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
      now.getDate()
    ).padStart(2, '0')}`;
    const events = await prisma.academicEvent.findMany({
      where: {
        date: { gte: today },
        completed: false,
      },
      orderBy: [{ date: 'asc' }, { time: 'asc' }],
      take: limit,
    });

    const mapped: AcademicEvent[] = events.map((e) => ({
      id: e.id,
      title: e.title,
      type: e.type as CalendarEventType,
      subjectId: e.subjectId as SubjectId | 'general',
      date: e.date,
      time: e.time ?? undefined,
      description: e.description ?? undefined,
      priority: e.priority as EventPriority,
      completed: e.completed,
      isOfficial: e.isOfficial,
      authorId: e.authorId ?? undefined,
      authorName: e.authorName ?? undefined,
      authorEmail: e.authorEmail ?? undefined,
      createdAt: e.createdAt.toISOString(),
      updatedAt: e.updatedAt.toISOString(),
    }));

    return { success: true, data: mapped };
  } catch (error) {
    console.error('Error fetching upcoming events:', error);
    return { success: false, error: 'Error al consultar próximos eventos' };
  }
}

/**
 * Crear un evento académico (Restringido exclusivamente a Administradores)
 */
export async function createEventAction(
  input: unknown
): Promise<CalendarActionResponse<AcademicEvent>> {
  try {
    const { userId, userEmail, userName } = await verifyAdminAuth();
    const validated = createEventSchema.parse(input);

    const created = await prisma.academicEvent.create({
      data: {
        title: validated.title,
        type: validated.type,
        subjectId: validated.subjectId,
        date: validated.date,
        time: validated.time && validated.time.length > 0 ? validated.time : null,
        description: validated.description ?? null,
        priority: validated.priority,
        completed: false,
        isOfficial: Boolean(validated.isOfficial),
        authorId: userId,
        authorName: userName,
        authorEmail: userEmail ?? null,
      },
    });

    revalidatePath('/');
    revalidatePath('/admin');

    return {
      success: true,
      data: {
        id: created.id,
        title: created.title,
        type: created.type as CalendarEventType,
        subjectId: created.subjectId as SubjectId | 'general',
        date: created.date,
        time: created.time ?? undefined,
        description: created.description ?? undefined,
        priority: created.priority as EventPriority,
        completed: created.completed,
        isOfficial: created.isOfficial,
        authorId: created.authorId ?? undefined,
        authorName: created.authorName ?? undefined,
        authorEmail: created.authorEmail ?? undefined,
        createdAt: created.createdAt.toISOString(),
        updatedAt: created.updatedAt.toISOString(),
      },
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0]?.message || 'Datos no válidos' };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al guardar el evento',
    };
  }
}

/**
 * Eliminar un evento (Restringido a Administradores)
 */
export async function deleteEventAction(id: string): Promise<CalendarActionResponse<boolean>> {
  try {
    await verifyAdminAuth();

    const event = await prisma.academicEvent.findUnique({ where: { id } });
    if (!event) {
      return { success: false, error: 'Evento no encontrado' };
    }

    await prisma.academicEvent.delete({ where: { id } });

    revalidatePath('/');
    revalidatePath('/admin');

    return { success: true, data: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al eliminar el evento',
    };
  }
}

/**
 * Alternar estado completado / pendiente de una tarea (Restringido a Administradores)
 */
export async function toggleEventCompleteAction(
  id: string
): Promise<CalendarActionResponse<boolean>> {
  try {
    await verifyAdminAuth();

    const event = await prisma.academicEvent.findUnique({ where: { id } });
    if (!event) {
      return { success: false, error: 'Evento no encontrado' };
    }

    const updated = await prisma.academicEvent.update({
      where: { id },
      data: { completed: !event.completed },
    });

    revalidatePath('/');
    revalidatePath('/admin');

    return { success: true, data: updated.completed };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al actualizar el estado',
    };
  }
}
