'use server';

import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import {
  createAbsence,
  deleteAbsenceById,
  readAbsences,
  calculateAbsenceStats,
  getStudentSummaries,
} from '@/lib/absencesStore';
import { prisma } from '@/lib/prisma';
import { getCurrentUserAuth, isUserAdmin, verifyAdminAuth } from '@/lib/adminAuth';
import {
  AbsenceRecord,
  ModuleAbsenceStats,
  StudentAbsenceSummary,
} from '@/types/absence';

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
 * Server action para registrar una falta.
 * Si es admin y envía targetUser, puede registrar la falta para un alumno concreto.
 * Si es alumno normal, se registra forzosamente para sí mismo.
 */
export async function addAbsenceAction(
  formData: unknown,
  targetUser?: {
    userId?: string;
    userName?: string;
    userEmail?: string;
  }
): Promise<ActionResponse<AbsenceRecord>> {
  try {
    const { userId, userName, userEmail, isAdmin } = await getCurrentUserAuth();
    const validatedData = createAbsenceSchema.parse(formData);

    let finalUserId = userId;
    let finalUserName = userName;
    let finalUserEmail = userEmail;

    if (isAdmin && targetUser && (targetUser.userId || targetUser.userEmail)) {
      finalUserId = targetUser.userId || userId;
      finalUserName = targetUser.userName || userName;
      finalUserEmail = targetUser.userEmail || userEmail;
    }

    const record = await createAbsence(
      validatedData,
      finalUserId,
      finalUserName,
      finalUserEmail
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

/**
 * Server action para obtener datos del panel de administración organizados por alumno.
 */
export async function getAdminDataAction(
  targetUserId?: string | null
): Promise<
  ActionResponse<{
    records: AbsenceRecord[];
    stats: ModuleAbsenceStats[];
    summaries: StudentAbsenceSummary[];
    selectedUserId: string | null;
  }>
> {
  try {
    const { userId: adminUserId } = await verifyAdminAuth();
    const summaries = await getStudentSummaries();

    let selectedUserId: string | null = targetUserId ?? null;
    let records: AbsenceRecord[] = [];
    let stats: ModuleAbsenceStats[] = [];

    if (!selectedUserId || selectedUserId === 'all') {
      records = await readAbsences();
      // Si no hay alumno seleccionado, las estadísticas de módulo son las personales del admin
      stats = await calculateAbsenceStats(adminUserId);
    } else {
      records = await readAbsences(selectedUserId);
      stats = await calculateAbsenceStats(selectedUserId);
    }

    return {
      success: true,
      data: {
        records,
        stats,
        summaries,
        selectedUserId,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al cargar los datos del panel',
    };
  }
}

/**
 * Server action para consultar los resúmenes consolidados de todos los alumnos (Solo Admin)
 */
export async function getStudentSummariesAction(): Promise<
  ActionResponse<StudentAbsenceSummary[]>
> {
  try {
    await verifyAdminAuth();
    const summaries = await getStudentSummaries();
    return { success: true, data: summaries };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al consultar resúmenes de alumnos',
    };
  }
}

/**
 * Server action para obtener las faltas personales del usuario actual junto con sus estadísticas
 */
export async function getMyAbsencesAction(): Promise<
  ActionResponse<{
    records: AbsenceRecord[];
    stats: ModuleAbsenceStats[];
    totalHours: number;
    justifiedHours: number;
    unjustifiedHours: number;
  }>
> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return {
        success: true,
        data: {
          records: [],
          stats: await calculateAbsenceStats(null),
          totalHours: 0,
          justifiedHours: 0,
          unjustifiedHours: 0,
        },
      };
    }
    const records = await readAbsences(userId);
    const stats = await calculateAbsenceStats(userId);
    const totalHours = Number(records.reduce((sum, r) => sum + r.hours, 0).toFixed(2));
    const justifiedHours = Number(
      records.filter((r) => r.justified).reduce((sum, r) => sum + r.hours, 0).toFixed(2)
    );
    const unjustifiedHours = Number((totalHours - justifiedHours).toFixed(2));

    return {
      success: true,
      data: {
        records,
        stats,
        totalHours,
        justifiedHours,
        unjustifiedHours,
      },
    };
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


