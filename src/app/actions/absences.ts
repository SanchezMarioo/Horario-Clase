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

/**
 * Función de seguridad para validar sesión y permisos de administrador en el servidor
 */
async function verifyAdminAuth() {
  const { userId } = await auth();

  if (!userId) {
    throw new Error('No autorizado: Debes iniciar sesión para realizar esta acción.');
  }

  // Si se ha configurado una lista blanca de administradores por email en variables de entorno
  const adminEmailsEnv = process.env.ADMIN_EMAILS;
  if (adminEmailsEnv && adminEmailsEnv.trim().length > 0) {
    const adminEmails = adminEmailsEnv
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

    if (adminEmails.length > 0) {
      const user = await currentUser();
      const userEmail = user?.primaryEmailAddress?.emailAddress?.toLowerCase();

      if (!userEmail || !adminEmails.includes(userEmail)) {
        throw new Error(
          `Acceso denegado: El usuario ${userEmail || userId} no tiene permisos de administrador.`
        );
      }
    }
  }

  return userId;
}

export type ActionResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

/**
 * Server action para registrar una falta (Protegido para administradores)
 */
export async function addAbsenceAction(
  formData: unknown
): Promise<ActionResponse<AbsenceRecord>> {
  try {
    const userId = await verifyAdminAuth();
    const validatedData = createAbsenceSchema.parse(formData);

    const record = await createAbsence(validatedData, userId);
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
 * Server action para eliminar una falta (Protegido para administradores)
 */
export async function deleteAbsenceAction(id: string): Promise<ActionResponse<boolean>> {
  try {
    await verifyAdminAuth();

    if (!id || typeof id !== 'string') {
      return { success: false, error: 'ID de falta inválido' };
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
 * Server action para obtener faltas completas y estadísticas (Protegido)
 */
export async function getAdminDataAction(): Promise<
  ActionResponse<{
    records: AbsenceRecord[];
    stats: ModuleAbsenceStats[];
  }>
> {
  try {
    await verifyAdminAuth();
    const records = await readAbsences();
    const stats = await calculateAbsenceStats();

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
 * Server action para obtener estadísticas agregadas públicas (Solo totales, sin notas privadas)
 */
export async function getPublicStatsAction(): Promise<ActionResponse<ModuleAbsenceStats[]>> {
  try {
    const stats = await calculateAbsenceStats();
    return { success: true, data: stats };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al consultar estadísticas',
    };
  }
}
