'use server';

import { auth, currentUser } from '@clerk/nextjs/server';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import {
  isUserAdmin,
  isUserSuperAdmin,
  verifyAdminAuth,
  verifySuperAdminAuth,
} from '@/lib/adminAuth';

const addAdminSchema = z.object({
  email: z
    .string()
    .email('Introduce un correo electrónico válido')
    .transform((e) => e.trim().toLowerCase()),
  name: z
    .string()
    .max(60, 'El nombre no puede exceder 60 caracteres')
    .optional()
    .transform((n) => n?.trim().replace(/[<>]/g, '')),
  isSuper: z.boolean().optional(),
});

export type AdminItem = {
  id: string;
  email: string;
  name: string | null;
  addedBy: string | null;
  createdAt: string;
  isSuper?: boolean;
  isEnvSuperadmin?: boolean;
};

export type AdminRequestItem = {
  id: string;
  userId: string;
  userEmail: string;
  userName: string | null;
  reason: string | null;
  status: string;
  reviewedBy: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminActionResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};

/**
 * Consulta la lista completa de administradores del sistema.
 */
export async function getAdminsAction(): Promise<AdminActionResponse<AdminItem[]>> {
  try {
    await verifyAdminAuth();

    const dbAdmins = await prisma.appAdmin.findMany({
      orderBy: { createdAt: 'desc' },
    });

    // Mapear administradores desde la base de datos
    const list: AdminItem[] = dbAdmins.map((a) => ({
      id: a.id,
      email: a.email,
      name: a.name,
      addedBy: a.addedBy,
      createdAt: a.createdAt.toISOString(),
      isSuper: a.isSuper,
      isEnvSuperadmin: false,
    }));

    // Añadir emails de la variable de entorno si existen y no están en la lista
    const envAdmins = process.env.ADMIN_EMAILS;
    if (envAdmins && envAdmins.trim().length > 0) {
      const envList = envAdmins
        .split(',')
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean);

      for (const envEmail of envList) {
        if (!list.some((a) => a.email === envEmail)) {
          list.unshift({
            id: `env-${envEmail}`,
            email: envEmail,
            name: 'Superadministrador (.env)',
            addedBy: 'Archivo .env.local',
            createdAt: new Date().toISOString(),
            isEnvSuperadmin: true,
          });
        }
      }
    }

    return { success: true, data: list };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al obtener administradores',
    };
  }
}

/**
 * Da de alta a un nuevo administrador introduciendo su email.
 */
export async function addAdminAction(
  formData: unknown
): Promise<AdminActionResponse<AdminItem>> {
  try {
    const { userName, userEmail } = await verifyAdminAuth();
    const validated = addAdminSchema.parse(formData);

    const existing = await prisma.appAdmin.findUnique({
      where: { email: validated.email },
    });

    if (existing) {
      return {
        success: false,
        error: `El usuario ${validated.email} ya figura como administrador.`,
      };
    }

    const created = await prisma.appAdmin.create({
      data: {
        email: validated.email,
        name: validated.name || null,
        addedBy: `${userName} (${userEmail})`,
      },
    });

    revalidatePath('/admin');
    revalidatePath('/');

    return {
      success: true,
      data: {
        id: created.id,
        email: created.email,
        name: created.name,
        addedBy: created.addedBy,
        createdAt: created.createdAt.toISOString(),
      },
      message: `¡${validated.email} ha sido añadido como administrador!`,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0]?.message || 'Datos inválidos' };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al añadir administrador',
    };
  }
}

/**
 * Revoca el rol de administrador a un usuario.
 */
export async function removeAdminAction(
  id: string
): Promise<AdminActionResponse<boolean>> {
  try {
    const { userEmail } = await verifyAdminAuth();

    if (id.startsWith('env-')) {
      return {
        success: false,
        error: 'No se puede eliminar un superadministrador configurado en el archivo .env.local',
      };
    }

    const target = await prisma.appAdmin.findUnique({ where: { id } });
    if (!target) {
      return { success: false, error: 'Administrador no encontrado.' };
    }

    if (target.email === userEmail) {
      return {
        success: false,
        error: 'Por seguridad, no puedes revocar tus propios permisos de administrador.',
      };
    }

    await prisma.appAdmin.delete({ where: { id } });

    revalidatePath('/admin');
    revalidatePath('/');

    return {
      success: true,
      data: true,
      message: `Se revocaron los permisos de ${target.email}`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al eliminar administrador',
    };
  }
}

/**
 * Permite a un usuario autenticado enviar una solicitud para ser Administrador.
 */
export async function requestAdminAccessAction(
  reason?: string
): Promise<AdminActionResponse<AdminRequestItem>> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: 'Debes iniciar sesión con tu cuenta de Clerk.' };
    }

    const user = await currentUser();
    const userEmail = user?.primaryEmailAddress?.emailAddress?.toLowerCase();
    const userName =
      user?.fullName ||
      (user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : null) ||
      userEmail?.split('@')[0] ||
      'Alumno';

    if (!userEmail) {
      return { success: false, error: 'Tu cuenta no tiene un correo electrónico válido asociado.' };
    }

    const alreadyAdmin = await isUserAdmin(userEmail);
    if (alreadyAdmin) {
      return { success: false, error: 'Ya tienes permisos de administrador activos.' };
    }

    const sanitizedReason = reason?.trim().replace(/[<>]/g, '').slice(0, 250) || null;

    const request = await prisma.adminRequest.upsert({
      where: { userId },
      update: {
        userEmail,
        userName,
        reason: sanitizedReason,
        status: 'pending',
        reviewedBy: null,
      },
      create: {
        userId,
        userEmail,
        userName,
        reason: sanitizedReason,
        status: 'pending',
      },
    });

    revalidatePath('/admin');

    return {
      success: true,
      data: {
        id: request.id,
        userId: request.userId,
        userEmail: request.userEmail,
        userName: request.userName,
        reason: request.reason,
        status: request.status,
        reviewedBy: request.reviewedBy,
        createdAt: request.createdAt.toISOString(),
        updatedAt: request.updatedAt.toISOString(),
      },
      message: '¡Solicitud enviada! Un superadministrador revisará y aprobará tu acceso.',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al enviar la solicitud',
    };
  }
}

/**
 * Consulta el estado de la solicitud de administrador del usuario autenticado actual.
 */
export async function getMyAdminRequestStatusAction(): Promise<
  AdminActionResponse<AdminRequestItem | null>
> {
  try {
    const { userId } = await auth();
    if (!userId) return { success: true, data: null };

    const req = await prisma.adminRequest.findUnique({
      where: { userId },
    });

    if (!req) return { success: true, data: null };

    return {
      success: true,
      data: {
        id: req.id,
        userId: req.userId,
        userEmail: req.userEmail,
        userName: req.userName,
        reason: req.reason,
        status: req.status,
        reviewedBy: req.reviewedBy,
        createdAt: req.createdAt.toISOString(),
        updatedAt: req.updatedAt.toISOString(),
      },
    };
  } catch (error) {
    return { success: false, error: 'Error al consultar estado de solicitud' };
  }
}

/**
 * Consulta la lista de solicitudes de acceso pendientes (Para Superadministradores y Administradores).
 */
export async function getPendingAdminRequestsAction(): Promise<
  AdminActionResponse<AdminRequestItem[]>
> {
  try {
    await verifyAdminAuth();
    const requests = await prisma.adminRequest.findMany({
      where: { status: 'pending' },
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      data: requests.map((r) => ({
        id: r.id,
        userId: r.userId,
        userEmail: r.userEmail,
        userName: r.userName,
        reason: r.reason,
        status: r.status,
        reviewedBy: r.reviewedBy,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      })),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al obtener solicitudes',
    };
  }
}

/**
 * Acepta una solicitud de acceso dando de alta al usuario como Administrador (Solo Superadministradores).
 */
export async function approveAdminRequestAction(
  requestId: string
): Promise<AdminActionResponse<boolean>> {
  try {
    const { userEmail: superAdminEmail, userName: superAdminName } =
      await verifySuperAdminAuth();

    const request = await prisma.adminRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      return { success: false, error: 'Solicitud no encontrada.' };
    }

    // 1. Dar de alta en AppAdmin
    await prisma.appAdmin.upsert({
      where: { email: request.userEmail },
      update: {
        name: request.userName,
      },
      create: {
        email: request.userEmail,
        name: request.userName,
        addedBy: `${superAdminName} (${superAdminEmail})`,
        isSuper: false,
      },
    });

    // 2. Marcar solicitud como aprobada
    await prisma.adminRequest.update({
      where: { id: requestId },
      data: {
        status: 'approved',
        reviewedBy: superAdminEmail,
      },
    });

    revalidatePath('/admin');
    revalidatePath('/');

    return {
      success: true,
      data: true,
      message: `¡${request.userEmail} ha sido aceptado como Administrador!`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al aprobar solicitud',
    };
  }
}

/**
 * Rechaza una solicitud de acceso (Solo Superadministradores).
 */
export async function rejectAdminRequestAction(
  requestId: string
): Promise<AdminActionResponse<boolean>> {
  try {
    const { userEmail: superAdminEmail } = await verifySuperAdminAuth();

    const request = await prisma.adminRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      return { success: false, error: 'Solicitud no encontrada.' };
    }

    await prisma.adminRequest.update({
      where: { id: requestId },
      data: {
        status: 'rejected',
        reviewedBy: superAdminEmail,
      },
    });

    revalidatePath('/admin');

    return {
      success: true,
      data: true,
      message: `Solicitud de ${request.userEmail} rechazada.`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al rechazar solicitud',
    };
  }
}

/**
 * Comprueba si el usuario autenticado actual tiene permisos de administrador y su rol superadmin.
 */
export async function checkIsAdminAction(): Promise<{
  isAdmin: boolean;
  isSuper: boolean;
  userEmail?: string;
}> {
  try {
    const user = await currentUser();
    const email = user?.primaryEmailAddress?.emailAddress?.toLowerCase();
    if (!email) return { isAdmin: false, isSuper: false };
    const isAdmin = await isUserAdmin(email);
    const isSuper = isAdmin ? await isUserSuperAdmin(email) : false;
    return { isAdmin, isSuper, userEmail: email };
  } catch {
    return { isAdmin: false, isSuper: false };
  }
}

