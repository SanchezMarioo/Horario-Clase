'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { AbsenceRecord, ModuleAbsenceStats, StudentAbsenceSummary } from '@/types/absence';
import { AcademicEvent } from '@/types/calendar';
import { SubjectId } from '@/types/schedule';
import { SUBJECT_MODULES } from '@/data/scheduleData';
import {
  addAbsenceAction,
  deleteAbsenceAction,
  getStudentSummariesAction,
} from '@/app/actions/absences';
import { getEventsAction } from '@/app/actions/calendar';
import {
  addAdminAction,
  removeAdminAction,
  AdminItem,
  AdminRequestItem,
  getPendingAdminRequestsAction,
  approveAdminRequestAction,
  rejectAdminRequestAction,
  getAdminsAction,
} from '@/app/actions/admins';
import { calculateModuleStatsFromRecords } from '@/lib/absenceStats';
import { toast } from 'sonner';

import AdminHeader from './AdminHeader';
import AdminTabs, { AdminSection } from './AdminTabs';
import AbsenceMetricsCards from './faltas/AbsenceMetricsCards';
import ModuleLimitsGrid from './faltas/ModuleLimitsGrid';
import AddAbsenceForm from './faltas/AddAbsenceForm';
import AbsenceHistoryTable from './faltas/AbsenceHistoryTable';
import CalendarMonthView from '@/components/calendar/CalendarMonthView';
import AddAdminForm from './admins/AddAdminForm';
import AdminListTable from './admins/AdminListTable';
import AdminPendingRequests from './admins/AdminPendingRequests';
import { Users, User, ArrowLeft, ShieldAlert, CheckCircle2, Clock } from 'lucide-react';

interface AdminDashboardProps {
  initialRecords: AbsenceRecord[];
  initialStats: ModuleAbsenceStats[];
  initialSummaries?: StudentAbsenceSummary[];
  initialEvents?: AcademicEvent[];
  initialAdmins?: AdminItem[];
  userEmail?: string;
  adminUserId?: string;
  isSuperAdmin?: boolean;
}

export default function AdminDashboard({
  initialRecords,
  initialStats,
  initialSummaries = [],
  initialEvents = [],
  initialAdmins = [],
  userEmail,
  adminUserId,
  isSuperAdmin = false,
}: AdminDashboardProps) {
  const [activeSection, setActiveSection] = useState<AdminSection>('faltas');
  const [records, setRecords] = useState<AbsenceRecord[]>(initialRecords);
  const [stats, setStats] = useState<ModuleAbsenceStats[]>(initialStats);
  const [summaries, setSummaries] = useState<StudentAbsenceSummary[]>(initialSummaries);
  const [selectedStudentKey, setSelectedStudentKey] = useState<string>('all');
  const [events, setEvents] = useState<AcademicEvent[]>(initialEvents);
  const [admins, setAdmins] = useState<AdminItem[]>(initialAdmins);
  const [pendingRequests, setPendingRequests] = useState<AdminRequestItem[]>([]);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [selectedFilter, setSelectedFilter] = useState<'all' | SubjectId>('all');

  const [isPending, startTransition] = useTransition();

  const reloadSummaries = async () => {
    const res = await getStudentSummariesAction();
    if (res.success && res.data) {
      setSummaries(res.data);
    }
  };

  const reloadEvents = async () => {
    const res = await getEventsAction();
    if (res.success && res.data) {
      setEvents(res.data);
    }
  };

  const reloadRequests = async () => {
    const res = await getPendingAdminRequestsAction();
    if (res.success && res.data) {
      setPendingRequests(res.data);
    }
  };

  useEffect(() => {
    reloadRequests();
    reloadSummaries();
  }, []);

  // Lista de alumnos únicos
  const distinctStudents = React.useMemo(() => {
    const map = new Map<string, { userId: string; userName: string; userEmail: string }>();
    for (const s of summaries) {
      map.set(s.userId, { userId: s.userId, userName: s.userName, userEmail: s.userEmail });
    }
    for (const r of records) {
      const key = r.createdBy || r.createdByEmail || 'anonimo';
      if (!map.has(key)) {
        map.set(key, {
          userId: key,
          userName: r.createdByName || 'Estudiante',
          userEmail: r.createdByEmail || '',
        });
      }
    }
    return Array.from(map.values());
  }, [summaries, records]);

  // Handlers para Faltas
  const handleAddAbsence = async (data: {
    subjectId: SubjectId;
    date: string;
    hours: number;
    justified: boolean;
    notes?: string;
    targetUser?: { userId?: string; userName?: string; userEmail?: string };
  }): Promise<boolean> => {
    return new Promise((resolve) => {
      startTransition(async () => {
        const res = await addAbsenceAction(data, data.targetUser);

        if (!res.success || !res.data) {
          toast.error('Error al registrar la falta', {
            description: res.error || 'Verifica los datos e inténtalo de nuevo.',
          });
          resolve(false);
          return;
        }

        const updated = [res.data, ...records];
        setRecords(updated);
        await reloadSummaries();

        const modName =
          SUBJECT_MODULES.find((m) => m.id === data.subjectId)?.name || 'Módulo';
        toast.success('¡Falta registrada con éxito!', {
          description: `${data.hours}h en ${modName} para ${res.data.createdByName || 'el alumno'}.`,
        });
        resolve(true);
      });
    });
  };

  const handleDeleteAbsence = async (id: string, subjectName: string) => {
    if (deletingIds.has(id)) return;

    setDeletingIds((prev) => new Set(prev).add(id));

    // Optimistic update: eliminar instantáneamente
    const previousRecords = records;
    const updated = records.filter((r) => r.id !== id);
    setRecords(updated);

    toast.success('Falta eliminada', {
      id: 'absence-delete-toast',
      description: `${subjectName} actualizada.`,
      duration: 1800,
    });

    try {
      const res = await deleteAbsenceAction(id);
      if (!res.success) {
        setRecords(previousRecords);
        toast.error('Error al eliminar en el servidor', {
          id: 'absence-delete-toast',
          description: res.error,
        });
      } else {
        await reloadSummaries();
      }
    } catch {
      setRecords(previousRecords);
      toast.error('Error de conexión', { id: 'absence-delete-toast' });
    } finally {
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  // Handlers para Administradores
  const handleAddAdmin = async (email: string, name?: string): Promise<boolean> => {
    return new Promise((resolve) => {
      startTransition(async () => {
        const res = await addAdminAction({ email, name });

        if (!res.success || !res.data) {
          toast.error('Error al añadir administrador', {
            description: res.error || 'Verifica los datos ingresados.',
          });
          resolve(false);
          return;
        }

        setAdmins([res.data, ...admins]);
        toast.success(res.message || 'Administrador registrado con éxito');
        resolve(true);
      });
    });
  };

  const handleRemoveAdmin = (adm: AdminItem) => {
    toast(`¿Revocar permisos de administrador a ${adm.email}?`, {
      id: 'revoke-confirm-toast',
      description: 'Ya no podrá gestionar el calendario ni dar de alta a otros administradores.',
      action: {
        label: 'Revocar',
        onClick: () => {
          startTransition(async () => {
            const res = await removeAdminAction(adm.id);
            if (!res.success) {
              toast.error('Error al revocar', { id: 'revoke-confirm-toast', description: res.error });
              return;
            }
            setAdmins(admins.filter((a) => a.id !== adm.id));
            toast.success(res.message || 'Permisos revocados con éxito', { id: 'revoke-confirm-toast' });
          });
        },
      },
      cancel: {
        label: 'Cancelar',
        onClick: () => {},
      },
    });
  };

  const handleApproveRequest = async (requestId: string, targetEmail: string) => {
    setPendingRequests((prev) => prev.filter((r) => r.id !== requestId));

    toast.success('Aprobando solicitud...', {
      id: 'admin-req-toast',
      duration: 1800,
    });

    try {
      const res = await approveAdminRequestAction(requestId);
      if (!res.success) {
        toast.error('Error al aprobar', {
          id: 'admin-req-toast',
          description: res.error,
        });
        reloadRequests();
        return;
      }

      toast.success(`¡${targetEmail} ahora es Administrador!`, {
        id: 'admin-req-toast',
        duration: 2500,
      });

      const adminsRes = await getAdminsAction();
      if (adminsRes.success && adminsRes.data) {
        setAdmins(adminsRes.data);
      }
    } catch {
      toast.error('Error al procesar la aprobación', { id: 'admin-req-toast' });
      reloadRequests();
    }
  };

  const handleRejectRequest = async (requestId: string, targetEmail: string) => {
    setPendingRequests((prev) => prev.filter((r) => r.id !== requestId));

    toast.info(`Solicitud de ${targetEmail} rechazada`, {
      id: 'admin-req-toast',
      duration: 2000,
    });

    try {
      await rejectAdminRequestAction(requestId);
    } catch {
      reloadRequests();
    }
  };

  // Registros y estadísticas según el alumno seleccionado
  const isAllStudents = selectedStudentKey === 'all';

  const selectedStudentSummary = summaries.find(
    (s) => s.userId === selectedStudentKey || s.userEmail === selectedStudentKey
  );

  const activeRecords = isAllStudents
    ? records
    : records.filter(
        (r) =>
          r.createdBy === selectedStudentKey ||
          r.createdByEmail === selectedStudentKey
      );

  // Estadísticas individuales calculadas sobre los registros activos del alumno
  const activeStats = isAllStudents
    ? stats
    : calculateModuleStatsFromRecords(activeRecords);

  const activeTotalHours = isAllStudents
    ? Number(summaries.reduce((acc, s) => acc + s.totalHours, 0).toFixed(2))
    : Number(activeRecords.reduce((acc, r) => acc + r.hours, 0).toFixed(2));

  const activeJustifiedHours = isAllStudents
    ? Number(summaries.reduce((acc, s) => acc + s.justifiedHours, 0).toFixed(2))
    : Number(
        activeRecords
          .filter((r) => r.justified)
          .reduce((acc, r) => acc + r.hours, 0)
          .toFixed(2)
      );

  const activeRiskCount = isAllStudents
    ? summaries.filter((s) => s.riskCount > 0).length
    : activeStats.filter((s) => s.status === 'danger').length;

  const activeAlertCount = isAllStudents
    ? summaries.filter((s) => s.alertCount > 0).length
    : activeStats.filter((s) => s.status === 'warning').length;

  return (
    <div className="w-full max-w-[1240px] flex flex-col gap-6">
      {/* Cabecera */}
      <AdminHeader userEmail={userEmail} isSuperAdmin={isSuperAdmin} />

      {/* Navegación por pestañas */}
      <AdminTabs
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        eventCount={events.length}
        adminCount={admins.length}
        pendingRequestCount={pendingRequests.length}
      />

      {/* Pestaña: Control de Faltas */}
      {activeSection === 'faltas' && (
        <>
          {/* Selector de Ámbito / Alumno */}
          <div className="bg-slate-900/80 border border-white/10 p-4 rounded-3xl backdrop-blur-xl flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-400">
                {isAllStudents ? <Users size={20} /> : <User size={20} />}
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  Seguimiento de Asistencia (12% Individual por Alumno)
                </span>
                <span className="text-sm font-bold text-white">
                  {isAllStudents
                    ? 'Resumen General del Grupo'
                    : `Expediente de ${selectedStudentSummary?.userName || 'Alumno'}`}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedStudentKey}
                onChange={(e) => setSelectedStudentKey(e.target.value)}
                className="bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="all">👥 Todos los alumnos (Visión Global)</option>
                {adminUserId && (
                  <option value={adminUserId}>👤 Mis Faltas Personales</option>
                )}
                {distinctStudents
                  .filter((s) => s.userId !== adminUserId)
                  .map((s) => {
                    const sum = summaries.find((sm) => sm.userId === s.userId);
                    const hoursText = sum ? `${sum.totalHours}h` : '0h';
                    return (
                      <option key={s.userId} value={s.userId}>
                        🧑 {s.userName} ({hoursText})
                      </option>
                    );
                  })}
              </select>

              {!isAllStudents && (
                <button
                  type="button"
                  onClick={() => setSelectedStudentKey('all')}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-xs font-semibold text-slate-300 hover:text-white transition-all cursor-pointer"
                >
                  <ArrowLeft size={14} /> Volver a todos
                </button>
              )}
            </div>
          </div>

          {/* Tarjetas de Métricas */}
          <AbsenceMetricsCards
            totalHours={activeTotalHours}
            justifiedHours={activeJustifiedHours}
            riskCount={activeRiskCount}
            alertCount={activeAlertCount}
          />

          {/* Si estamos en visión individual de alumno, mostrar su cuadrícula del 12% */}
          {!isAllStudents ? (
            <ModuleLimitsGrid stats={activeStats} />
          ) : (
            /* En visión global, mostrar listado de alumnos y su estado individual */
            <div className="bg-slate-900/60 border border-white/[0.08] p-5 rounded-3xl backdrop-blur-xl">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-2">
                <Users size={16} className="text-indigo-400" />
                Alumnos con Faltas Registradas ({summaries.length})
              </h3>
              {summaries.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-xs flex flex-col items-center gap-2">
                  <CheckCircle2 size={32} className="text-slate-600" />
                  <span>No hay faltas registradas en la clase.</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {summaries.map((s) => (
                    <div
                      key={s.userId}
                      onClick={() => setSelectedStudentKey(s.userId)}
                      className="p-4 rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.06] hover:border-indigo-500/40 transition-all cursor-pointer flex flex-col justify-between gap-3 group"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <span className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors block">
                            {s.userName}
                          </span>
                          <span className="text-[11px] text-slate-500 truncate block max-w-[180px]">
                            {s.userEmail || 'Sin email'}
                          </span>
                        </div>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 whitespace-nowrap">
                          {s.totalHours}h
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] pt-2 border-t border-white/5">
                        <span className="text-slate-400">
                          {s.totalRecords} {s.totalRecords === 1 ? 'registro' : 'registros'}
                        </span>
                        {s.riskCount > 0 ? (
                          <span className="text-red-400 font-bold flex items-center gap-1">
                            <ShieldAlert size={12} /> {s.riskCount} en riesgo
                          </span>
                        ) : s.alertCount > 0 ? (
                          <span className="text-amber-400 font-bold flex items-center gap-1">
                            <ShieldAlert size={12} /> {s.alertCount} en alerta
                          </span>
                        ) : (
                          <span className="text-emerald-400 font-medium flex items-center gap-1">
                            <CheckCircle2 size={12} /> Correcto
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <AddAbsenceForm
                onAddAbsence={handleAddAbsence}
                isPending={isPending}
                studentsList={distinctStudents}
                currentStudentKey={selectedStudentKey}
              />
            </div>
            <div className="lg:col-span-2">
              <AbsenceHistoryTable
                records={records}
                selectedFilter={selectedFilter}
                onFilterChange={setSelectedFilter}
                selectedStudent={selectedStudentKey}
                onStudentChange={setSelectedStudentKey}
                studentsList={distinctStudents.map((s) => ({
                  key: s.userId,
                  label: `${s.userName} (${s.userEmail})`,
                }))}
                onDeleteAbsence={handleDeleteAbsence}
                deletingIds={deletingIds}
                isPending={isPending}
                showStudentColumn={isAllStudents}
              />
            </div>
          </div>
        </>
      )}

      {/* Pestaña: Gestión del Calendario */}
      {activeSection === 'calendario' && (
        <CalendarMonthView
          events={events}
          isAdmin={true}
          onRefresh={reloadEvents}
        />
      )}

      {/* Pestaña: Administradores */}
      {activeSection === 'admins' && (
        <section className="flex flex-col gap-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <AddAdminForm onAddAdmin={handleAddAdmin} isPending={isPending} />
            <div className="lg:col-span-2">
              <AdminListTable
                admins={admins}
                currentUserEmail={userEmail}
                onRemoveAdmin={handleRemoveAdmin}
                isPending={isPending}
              />
            </div>
            <AdminPendingRequests
              requests={pendingRequests}
              onApprove={handleApproveRequest}
              onReject={handleRejectRequest}
              onRefresh={reloadRequests}
            />
          </div>
        </section>
      )}
    </div>
  );
}
