'use server';

import { auth, currentUser } from '@clerk/nextjs/server';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import {
  isUserAdmin,
  verifyAdminAuth,
  ADMIN_INVITE_CODE,
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
});

export type AdminItem = {
  id: string;
  email: string;
  name: string | null;
  addedBy: string | null;
  createdAt: string;
  isEnvSuperadmin?: boolean;
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
 * Permite a cualquier usuario autenticado auto-activarse como administrador
 * mediante un código de invitación (proceso rápido y directo).
 */
export async function claimAdminWithCodeAction(
  code: string
): Promise<AdminActionResponse<boolean>> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return {
        success: false,
        error: 'Debes iniciar sesión con tu cuenta antes de activar el código.',
      };
    }

    const user = await currentUser();
    const userEmail = user?.primaryEmailAddress?.emailAddress?.toLowerCase();
    const userName =
      user?.fullName ||
      (user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : null) ||
      userEmail?.split('@')[0] ||
      'Administrador';

    if (!userEmail) {
      return { success: false, error: 'Tu cuenta de Clerk no tiene un email válido asociado.' };
    }

    const normalizedCode = code?.trim();
    if (!normalizedCode || normalizedCode.toUpperCase() !== ADMIN_INVITE_CODE.toUpperCase()) {
      return {
        success: false,
        error: 'Código de invitación incorrecto. Solicítalo al delegado o profesor.',
      };
    }

    // Verificar si ya era admin
    const alreadyAdmin = await isUserAdmin(userEmail);
    if (!alreadyAdmin) {
      await prisma.appAdmin.upsert({
        where: { email: userEmail },
        update: {},
        create: {
          email: userEmail,
          name: userName,
          addedBy: 'Código de Invitación Directo',
        },
      });
    }

    revalidatePath('/admin');
    revalidatePath('/');

    return {
      success: true,
      data: true,
      message: '¡Permisos de administrador concedidos con éxito!',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al procesar el código',
    };
  }
}

/**
 * Comprueba si el usuario autenticado actual tiene permisos de administrador.
 */
export async function checkIsAdminAction(): Promise<{
  isAdmin: boolean;
  userEmail?: string;
}> {
  try {
    const user = await currentUser();
    const email = user?.primaryEmailAddress?.emailAddress?.toLowerCase();
    if (!email) return { isAdmin: false };
    const isAdmin = await isUserAdmin(email);
    return { isAdmin, userEmail: email };
  } catch {
    return { isAdmin: false };
  }
}
