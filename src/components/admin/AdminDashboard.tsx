'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { AbsenceRecord, ModuleAbsenceStats } from '@/types/absence';
import { AcademicEvent } from '@/types/calendar';
import { SubjectId } from '@/types/schedule';
import { SUBJECT_MODULES } from '@/data/scheduleData';
import { addAbsenceAction, deleteAbsenceAction } from '@/app/actions/absences';
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

interface AdminDashboardProps {
  initialRecords: AbsenceRecord[];
  initialStats: ModuleAbsenceStats[];
  initialEvents?: AcademicEvent[];
  initialAdmins?: AdminItem[];
  userEmail?: string;
  isSuperAdmin?: boolean;
}

export default function AdminDashboard({
  initialRecords,
  initialStats,
  initialEvents = [],
  initialAdmins = [],
  userEmail,
  isSuperAdmin = false,
}: AdminDashboardProps) {
  const [activeSection, setActiveSection] = useState<AdminSection>('faltas');
  const [records, setRecords] = useState<AbsenceRecord[]>(initialRecords);
  const [stats, setStats] = useState<ModuleAbsenceStats[]>(initialStats);
  const [events, setEvents] = useState<AcademicEvent[]>(initialEvents);
  const [admins, setAdmins] = useState<AdminItem[]>(initialAdmins);
  const [pendingRequests, setPendingRequests] = useState<AdminRequestItem[]>([]);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [selectedFilter, setSelectedFilter] = useState<'all' | SubjectId>('all');

  const [isPending, startTransition] = useTransition();

  // Recalcular estadísticas compartidas
  const refreshStats = (currentRecords: AbsenceRecord[]) => {
    setStats(calculateModuleStatsFromRecords(currentRecords));
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
  }, []);

  // Handlers para Faltas
  const handleAddAbsence = async (data: {
    subjectId: SubjectId;
    date: string;
    hours: number;
    justified: boolean;
    notes?: string;
  }): Promise<boolean> => {
    return new Promise((resolve) => {
      startTransition(async () => {
        const res = await addAbsenceAction(data);

        if (!res.success || !res.data) {
          toast.error('Error al registrar la falta', {
            description: res.error || 'Verifica los datos e inténtalo de nuevo.',
          });
          resolve(false);
          return;
        }

        const updated = [res.data, ...records];
        setRecords(updated);
        refreshStats(updated);

        const modName =
          SUBJECT_MODULES.find((m) => m.id === data.subjectId)?.name || 'Módulo';
        toast.success('¡Falta registrada con éxito!', {
          description: `${data.hours}h en ${modName} (${data.justified ? 'Justificada' : 'Injustificada'}).`,
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
    refreshStats(updated);

    toast.success('Falta eliminada', {
      id: 'absence-delete-toast',
      description: `${subjectName} actualizada.`,
      duration: 1800,
    });

    try {
      const res = await deleteAbsenceAction(id);
      if (!res.success) {
        setRecords(previousRecords);
        refreshStats(previousRecords);
        toast.error('Error al eliminar en el servidor', {
          id: 'absence-delete-toast',
          description: res.error,
        });
      }
    } catch {
      setRecords(previousRecords);
      refreshStats(previousRecords);
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

  // Métricas globales
  const totalHours = records.reduce((acc, r) => acc + r.hours, 0);
  const justifiedHours = records
    .filter((r) => r.justified)
    .reduce((acc, r) => acc + r.hours, 0);
  const riskCount = stats.filter((s) => s.status === 'danger').length;
  const alertCount = stats.filter((s) => s.status === 'warning').length;

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
          <AbsenceMetricsCards
            totalHours={totalHours}
            justifiedHours={justifiedHours}
            riskCount={riskCount}
            alertCount={alertCount}
          />

          <ModuleLimitsGrid stats={stats} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <AddAbsenceForm
                onAddAbsence={handleAddAbsence}
                isPending={isPending}
              />
            </div>
            <div className="lg:col-span-2">
              <AbsenceHistoryTable
                records={records}
                selectedFilter={selectedFilter}
                onFilterChange={setSelectedFilter}
                onDeleteAbsence={handleDeleteAbsence}
                deletingIds={deletingIds}
                isPending={isPending}
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
