import { auth, currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

/**
 * Comprueba de forma asíncrona si un correo electrónico tiene permisos de administrador.
 * Revisa:
 * 1. Lista en variable de entorno ADMIN_EMAILS (superadmin fallback).
 * 2. Tabla AppAdmin en Supabase PostgreSQL.
 * 3. Si la base de datos no tiene administradores y no hay variable de entorno, permite el primer acceso como admin.
 */
export async function isUserAdmin(email?: string | null): Promise<boolean> {
  if (!email) return false;
  const normalizedEmail = email.trim().toLowerCase();

  // 1. Revisión de variable de entorno (ADMIN_EMAILS)
  const envAdmins = process.env.ADMIN_EMAILS;
  if (envAdmins && envAdmins.trim().length > 0) {
    const list = envAdmins
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
    if (list.includes(normalizedEmail)) {
      return true;
    }
  }

  // 2. Revisión en base de datos PostgreSQL (Tabla AppAdmin)
  try {
    const dbAdmin = await prisma.appAdmin.findUnique({
      where: { email: normalizedEmail },
    });
    if (dbAdmin) {
      return true;
    }

    // 3. Si no hay administradores definidos en BD ni en ENV, el primer usuario que ingrese puede auto-registrarse
    const totalAdminsInDb = await prisma.appAdmin.count();
    const hasEnvAdmins = Boolean(envAdmins && envAdmins.trim().length > 0);
    if (totalAdminsInDb === 0 && !hasEnvAdmins) {
      // Registrar automáticamente al primer usuario como superadministrador inicial
      await prisma.appAdmin.create({
        data: {
          email: normalizedEmail,
          name: 'Primer Superadministrador (Automático)',
          addedBy: 'Sistema Inicial',
          isSuper: true,
        },
      });
      return true;
    }
  } catch (error) {
    console.error('Error verificando administrador en base de datos:', error);
  }

  return false;
}

/**
 * Comprueba si un correo tiene rango de Superadministrador (puede aceptar o rechazar solicitudes).
 */
export async function isUserSuperAdmin(email?: string | null): Promise<boolean> {
  if (!email) return false;
  const normalizedEmail = email.trim().toLowerCase();

  // 1. Variable de entorno ADMIN_EMAILS
  const envAdmins = process.env.ADMIN_EMAILS;
  if (envAdmins && envAdmins.trim().length > 0) {
    const list = envAdmins
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
    if (list.includes(normalizedEmail)) {
      return true;
    }
  }

  // 2. Campo isSuper en AppAdmin
  try {
    const admin = await prisma.appAdmin.findUnique({
      where: { email: normalizedEmail },
    });
    if (admin?.isSuper) {
      return true;
    }

    // 3. Si la base de datos solo tiene 1 admin, promoverlo a superadmin inicial
    const totalAdmins = await prisma.appAdmin.count();
    if (totalAdmins === 1 && admin) {
      await prisma.appAdmin.update({
        where: { id: admin.id },
        data: { isSuper: true },
      });
      return true;
    }
  } catch (error) {
    console.error('Error comprobando superadministrador:', error);
  }

  return false;
}


/**
 * Valida que el usuario actual tenga sesión activa y privilegios de administrador.
 * Lanza un error si no está autorizado.
 */
export async function verifyAdminAuth(): Promise<{
  userId: string;
  userEmail: string;
  userName: string;
}> {
  const { userId } = await auth();
  if (!userId) {
    throw new Error('No autorizado: Debes iniciar sesión.');
  }

  const user = await currentUser();
  const userEmail = user?.primaryEmailAddress?.emailAddress?.toLowerCase();
  const userName =
    user?.fullName ||
    (user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : null) ||
    userEmail?.split('@')[0] ||
    'Administrador';

  if (!userEmail) {
    throw new Error('Acceso denegado: Tu cuenta no tiene un correo electrónico válido asociado.');
  }

  const isAdmin = await isUserAdmin(userEmail);
  if (!isAdmin) {
    throw new Error(`Acceso denegado: El usuario ${userEmail} no tiene permisos de administrador.`);
  }

  return { userId, userEmail, userName };
}

/**
 * Valida que el usuario actual tenga rango de Superadministrador.
 */
export async function verifySuperAdminAuth(): Promise<{
  userId: string;
  userEmail: string;
  userName: string;
}> {
  const { userId, userEmail, userName } = await verifyAdminAuth();
  const isSuper = await isUserSuperAdmin(userEmail);

  if (!isSuper) {
    throw new Error(
      'Acceso denegado: Solo los Superadministradores pueden aceptar o rechazar solicitudes de acceso.'
    );
  }

  return { userId, userEmail, userName };
}


/**
 * Obtiene la información del usuario autenticado actual y su rol (sin exigir ser admin).
 */
export async function getCurrentUserAuth(): Promise<{
  userId: string;
  userEmail: string;
  userName: string;
  isAdmin: boolean;
}> {
  const { userId } = await auth();
  if (!userId) {
    throw new Error('Debes iniciar sesión para realizar esta acción.');
  }

  const user = await currentUser();
  const userEmail = user?.primaryEmailAddress?.emailAddress?.toLowerCase() || '';
  const userName =
    user?.fullName ||
    (user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : null) ||
    userEmail?.split('@')[0] ||
    'Compañero';

  const isAdmin = await isUserAdmin(userEmail);

  return { userId, userEmail, userName, isAdmin };
}
