import React from 'react';
import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { readAbsences, calculateAbsenceStats } from '@/lib/absencesStore';
import { getEventsAction } from '@/app/actions/calendar';
import AdminDashboard from '@/components/admin/AdminDashboard';

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
  const userEmail = user?.primaryEmailAddress?.emailAddress;

  // Verificación de Lista Blanca de Administradores (Defensa en profundidad)
  const adminEmailsEnv = process.env.ADMIN_EMAILS;
  if (adminEmailsEnv && adminEmailsEnv.trim().length > 0) {
    const adminEmails = adminEmailsEnv
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

    const emailLower = userEmail?.toLowerCase();
    if (!emailLower || !adminEmails.includes(emailLower)) {
      return (
        <div className="w-full max-w-lg mx-auto my-16 bg-slate-900/80 border border-red-500/30 rounded-3xl p-8 backdrop-blur-xl shadow-2xl text-center flex flex-col items-center gap-4">
          <div className="p-4 rounded-2xl bg-red-500/10 text-red-400">
            <ShieldAlert size={42} />
          </div>
          <h1 className="text-xl font-bold text-white">403 · Acceso Denegado</h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            Tu cuenta (<strong className="text-slate-200">{userEmail || userId}</strong>) está autenticada con éxito en Clerk, pero no figura en la lista de administradores autorizados.
          </p>
          <div className="text-[11px] text-slate-500 bg-black/40 p-3 rounded-xl border border-white/5 w-full text-left">
            ℹ️ Para autorizar este email, agrégalo a la variable <code className="text-indigo-300">ADMIN_EMAILS</code> en tu archivo <code className="text-indigo-300">.env.local</code>.
          </div>
          <Link
            href="/"
            className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/10 transition-all"
          >
            <ArrowLeft size={16} /> Volver al Horario
          </Link>
        </div>
      );
    }
  }

  const initialRecords = await readAbsences();
  const initialStats = await calculateAbsenceStats();
  const eventsRes = await getEventsAction();
  const initialEvents = eventsRes.success && eventsRes.data ? eventsRes.data : [];

  return (
    <AdminDashboard
      initialRecords={initialRecords}
      initialStats={initialStats}
      initialEvents={initialEvents}
      userEmail={userEmail}
    />
  );
}
