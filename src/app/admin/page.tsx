import React from 'react';
import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { readAbsences, calculateAbsenceStats } from '@/lib/absencesStore';
import { getEventsAction } from '@/app/actions/calendar';
import { getAdminsAction } from '@/app/actions/admins';
import { isUserAdmin } from '@/lib/adminAuth';
import AdminDashboard from '@/components/admin/AdminDashboard';
import AdminClaimCard from '@/components/admin/AdminClaimCard';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Panel de Administración · Horario DM2A',
  description: 'Control de asistencia, faltas y calendario protegidos por Clerk',
};

export default async function AdminPage() {
  const { userId } = await auth();

  // Si no está autenticado, redirigir a inicio de sesión
  if (!userId) {
    redirect('/sign-in');
  }

  const user = await currentUser();
  const userEmail = user?.primaryEmailAddress?.emailAddress?.toLowerCase();

  // Verificación dinámica de Administrador (Base de datos + ENV fallback)
  const isAdmin = await isUserAdmin(userEmail);

  if (!isAdmin) {
    return <AdminClaimCard userEmail={userEmail} userId={userId} />;
  }

  const initialRecords = await readAbsences();
  const initialStats = await calculateAbsenceStats();
  const eventsRes = await getEventsAction();
  const initialEvents = eventsRes.success && eventsRes.data ? eventsRes.data : [];
  const adminsRes = await getAdminsAction();
  const initialAdmins = adminsRes.success && adminsRes.data ? adminsRes.data : [];

  return (
    <AdminDashboard
      initialRecords={initialRecords}
      initialStats={initialStats}
      initialEvents={initialEvents}
      initialAdmins={initialAdmins}
      userEmail={userEmail}
    />
  );
}
