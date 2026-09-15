'use server';

import { auth, currentUser } from '@clerk/nextjs/server';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import {
  createAbsence,
  deleteAbsenceById,
  readAbsences,
  calculateAbsenceStats,
} from '@/lib/absencesStore';
import { prisma } from '@/lib/prisma';
import { getCurrentUserAuth, isUserAdmin, verifyAdminAuth } from '@/lib/adminAuth';
import { AbsenceRecord, ModuleAbsenceStats } from '@/types/absence';

// Esquema Zod para validación estricta en servidor
const createAbsenceSchema = z.object({
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
  ], {
    message: 'Asignatura inválida',
  }),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (AAAA-MM-DD)'),
  hours: z.number().min(0.5, 'Mínimo 0.5 horas').max(8, 'Máximo 8 horas por falta'),
  justified: z.boolean(),
  notes: z
    .string()
    .max(200, 'El motivo no puede exceder 200 caracteres')
    .optional()
    .transform((val) => val?.trim().replace(/[<>]/g, '')), // Sanitización básica anti-XSS
});



export type ActionResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

/**
 * Server action para registrar una falta (Accesible para cualquier estudiante/usuario autenticado)
 */
export async function addAbsenceAction(
  formData: unknown
): Promise<ActionResponse<AbsenceRecord>> {
  try {
    const { userId, userName, userEmail } = await getCurrentUserAuth();
    const validatedData = createAbsenceSchema.parse(formData);

    const record = await createAbsence(
      validatedData,
      userId,
      userName,
      userEmail
    );

    revalidatePath('/admin');
    revalidatePath('/');

    return { success: true, data: record };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0]?.message || 'Datos inválidos' };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido al registrar la falta',
    };
  }
}

/**
 * Server action para eliminar una falta (Permitido para el creador de la falta o administradores)
 */
export async function deleteAbsenceAction(id: string): Promise<ActionResponse<boolean>> {
  try {
    const { userId, userEmail } = await getCurrentUserAuth();

    if (!id || typeof id !== 'string') {
      return { success: false, error: 'ID de falta inválido' };
    }

    const isAdmin = await isUserAdmin(userEmail);

    if (!isAdmin) {
      // Si no es admin, verificar que la falta haya sido creada por este usuario
      const existing = await prisma.absence.findUnique({ where: { id } });
      if (!existing) {
        return { success: false, error: 'Falta no encontrada' };
      }
      if (existing.userId !== userId) {
        return {
          success: false,
          error: 'Solo puedes eliminar las faltas que hayas registrado tú o un administrador.',
        };
      }
    }

    const deleted = await deleteAbsenceById(id);
    if (!deleted) {
      return { success: false, error: 'Falta no encontrada' };
    }

    revalidatePath('/admin');
    revalidatePath('/');

    return { success: true, data: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al eliminar la falta',
    };
  }
}

export async function getAdminDataAction(
  onlyMine = false
): Promise<
  ActionResponse<{
    records: AbsenceRecord[];
    stats: ModuleAbsenceStats[];
  }>
> {
  try {
    const { userId } = await verifyAdminAuth();
    const records = onlyMine ? await readAbsences(userId) : await readAbsences();
    const stats = onlyMine
      ? await calculateAbsenceStats(userId)
      : await calculateAbsenceStats(null, true);

    return {
      success: true,
      data: { records, stats },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al cargar los datos del panel',
    };
  }
}

/**
 * Server action para obtener las faltas personales del usuario actual
 */
export async function getMyAbsencesAction(): Promise<ActionResponse<AbsenceRecord[]>> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: true, data: [] };
    }
    const records = await readAbsences(userId);
    return { success: true, data: records };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al consultar faltas personales',
    };
  }
}

/**
 * Server action para obtener estadísticas individuales del usuario actual (Límite 12% personal)
 */
export async function getPublicStatsAction(): Promise<ActionResponse<ModuleAbsenceStats[]>> {
  try {
    const { userId } = await auth();
    // Si el usuario está autenticado, calcula únicamente sus faltas personales
    // Si no está autenticado, devuelve 0h consumidas (safe)
    const stats = await calculateAbsenceStats(userId);
    return { success: true, data: stats };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al consultar estadísticas',
    };
  }
}

