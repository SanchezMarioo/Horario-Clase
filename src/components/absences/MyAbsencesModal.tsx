'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { createPortal } from 'react-dom';
import { useAuth, useUser } from '@clerk/nextjs';
import Link from 'next/link';
import {
  Calendar,
  Clock,
  Trash2,
  X,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Plus,
  Loader2,
  ShieldAlert,
} from 'lucide-react';
import { AbsenceRecord, ModuleAbsenceStats } from '@/types/absence';
import { SUBJECT_MAP } from '@/data/scheduleData';
import { getMyAbsencesAction, deleteAbsenceAction } from '@/app/actions/absences';
import { toast } from 'sonner';

interface MyAbsencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAddModal: () => void;
  onAbsenceDeleted?: () => void;
}

export default function MyAbsencesModal({
  isOpen,
  onClose,
  onOpenAddModal,
  onAbsenceDeleted,
}: MyAbsencesModalProps) {
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState<AbsenceRecord[]>([]);
  const [stats, setStats] = useState<ModuleAbsenceStats[]>([]);
  const [totalHours, setTotalHours] = useState(0);
  const [justifiedHours, setJustifiedHours] = useState(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setMounted(true);
  }, []);

  const loadMyData = async () => {
    if (!isSignedIn) return;
    setLoading(true);
    try {
      const res = await getMyAbsencesAction();
      if (res.success && res.data) {
        setRecords(res.data.records);
        setStats(res.data.stats);
        setTotalHours(res.data.totalHours);
        setJustifiedHours(res.data.justifiedHours);
      }
    } catch (err) {
      console.error('Error cargando faltas personales:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && isSignedIn) {
      loadMyData();
    }
  }, [isOpen, isSignedIn]);

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  const handleDelete = (id: string, subjectName: string) => {
    if (deletingId) return;
    setDeletingId(id);

    // Optimistic UI
    const previous = records;
    setRecords((prev) => prev.filter((r) => r.id !== id));

    startTransition(async () => {
      try {
        const res = await deleteAbsenceAction(id);
        if (!res.success) {
          setRecords(previous);
          toast.error('Error al eliminar falta', { description: res.error });
          return;
        }

        toast.success('Falta eliminada', {
          description: `Se ha retirado la falta de ${subjectName}.`,
        });

        // Recargar estadísticas
        await loadMyData();
        if (onAbsenceDeleted) onAbsenceDeleted();
      } catch (err) {
        setRecords(previous);
        toast.error('Error de conexión al eliminar la falta');
      } finally {
        setDeletingId(null);
      }
    });
  };

  const riskModules = stats.filter((s) => s.status === 'danger');
  const alertModules = stats.filter((s) => s.status === 'warning');

  const modalContent = (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[9998] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="relative w-full max-w-2xl bg-slate-900 border border-white/10 rounded-3xl shadow-2xl backdrop-blur-2xl flex flex-col max-h-[90vh] overflow-hidden my-auto animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera */}
        <div className="p-5 sm:p-6 pb-4 border-b border-white/[0.08] flex items-start justify-between gap-3 bg-slate-900/90 shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-[11px] font-bold uppercase tracking-wider">
                <Calendar size={12} /> Control Individual de Asistencia
              </span>
              <span className="text-[11px] text-slate-400 font-medium">
                {user?.fullName || user?.primaryEmailAddress?.emailAddress}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white">Mis Faltas de Asistencia</h2>
            <p className="text-xs text-slate-400">
              Historial privado y cálculo de tu propio límite del 12% por módulo en DM2A.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal"
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Contenido */}
        {!isLoaded || loading ? (
          <div className="p-16 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-3">
            <Loader2 size={24} className="animate-spin text-indigo-400" />
            <span>Consultando tus ausencias en la base de datos...</span>
          </div>
        ) : !isSignedIn ? (
          <div className="p-8 text-center flex flex-col items-center gap-3">
            <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400">
              <AlertCircle size={32} />
            </div>
            <h3 className="text-sm font-bold text-white">Inicio de sesión requerido</h3>
            <p className="text-xs text-slate-300 max-w-xs leading-relaxed">
              Inicia sesión con tu cuenta de alumno para acceder a tu historial privado de faltas.
            </p>
            <Link
              href="/sign-in"
              className="mt-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-lg shadow-indigo-600/30"
            >
              Iniciar Sesión
            </Link>
          </div>
        ) : (
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Tarjetas de Métricas Personales */}
            <div className="p-4 sm:p-5 bg-slate-950/40 border-b border-white/[0.06] grid grid-cols-2 sm:grid-cols-4 gap-2.5 shrink-0">
              <div className="bg-slate-900/80 border border-white/5 p-3 rounded-2xl">
                <span className="text-[11px] text-slate-400 block mb-0.5">Tus Faltas</span>
                <span className="text-lg font-bold text-white flex items-center gap-1.5">
                  <Clock size={15} className="text-indigo-400" /> {totalHours}h
                </span>
              </div>
              <div className="bg-slate-900/80 border border-white/5 p-3 rounded-2xl">
                <span className="text-[11px] text-slate-400 block mb-0.5">Justificadas</span>
                <span className="text-lg font-bold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 size={15} className="text-emerald-400" /> {justifiedHours}h
                </span>
              </div>
              <div className="bg-slate-900/80 border border-white/5 p-3 rounded-2xl">
                <span className="text-[11px] text-slate-400 block mb-0.5">En Alerta (50-80%)</span>
                <span
                  className={`text-lg font-bold flex items-center gap-1.5 ${
                    alertModules.length > 0 ? 'text-amber-400' : 'text-slate-400'
                  }`}
                >
                  <AlertTriangle size={15} className={alertModules.length > 0 ? 'text-amber-400' : 'text-slate-500'} />{' '}
                  {alertModules.length}
                </span>
              </div>
              <div className="bg-slate-900/80 border border-white/5 p-3 rounded-2xl">
                <span className="text-[11px] text-slate-400 block mb-0.5">En Riesgo (&gt;80%)</span>
                <span
                  className={`text-lg font-bold flex items-center gap-1.5 ${
                    riskModules.length > 0 ? 'text-red-400' : 'text-slate-400'
                  }`}
                >
                  <ShieldAlert size={15} className={riskModules.length > 0 ? 'text-red-400' : 'text-slate-500'} />{' '}
                  {riskModules.length}
                </span>
              </div>
            </div>

            {/* Listado de Faltas */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-3">
              <div className="flex items-center justify-between gap-2 mb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Historial de Ausencias ({records.length})
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenAddModal();
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-bold transition-all cursor-pointer"
                >
                  <Plus size={13} /> Nueva Falta
                </button>
              </div>

              {records.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs flex flex-col items-center justify-center gap-2 bg-slate-950/20 rounded-2xl border border-white/[0.04]">
                  <CheckCircle2 size={36} className="text-emerald-500/50" />
                  <span className="font-semibold text-slate-300">¡Asistencia 100% perfecta!</span>
                  <span className="text-slate-500 max-w-xs">
                    No tienes ninguna falta registrada en ningún módulo.
                  </span>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-white/[0.06] text-slate-400 font-semibold">
                        <th className="pb-2.5 pl-2">Fecha</th>
                        <th className="pb-2.5">Módulo</th>
                        <th className="pb-2.5 text-center">Horas</th>
                        <th className="pb-2.5 text-center">Estado</th>
                        <th className="pb-2.5">Motivo</th>
                        <th className="pb-2.5 text-right pr-2">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04]">
                      {records.map((r) => {
                        const mod = SUBJECT_MAP[r.subjectId];
                        const isDeleting = deletingId === r.id;

                        return (
                          <tr key={r.id} className="hover:bg-white/[0.02] transition-colors">
                            <td className="py-2.5 pl-2 font-medium text-slate-300 whitespace-nowrap">
                              {r.date}
                            </td>
                            <td className="py-2.5 font-bold text-white">
                              <span className="text-xs">{mod?.shortName || r.subjectId}</span>
                            </td>
                            <td className="py-2.5 text-center font-bold text-white">
                              {r.hours}h
                            </td>
                            <td className="py-2.5 text-center">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  r.justified
                                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                                    : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                                }`}
                              >
                                {r.justified ? 'Justificada' : 'Injustificada'}
                              </span>
                            </td>
                            <td className="py-2.5 text-slate-400 max-w-[160px] truncate">
                              {r.notes || '—'}
                            </td>
                            <td className="py-2.5 text-right pr-2">
                              <button
                                type="button"
                                onClick={() => handleDelete(r.id, mod?.shortName || r.subjectId)}
                                disabled={isPending || isDeleting}
                                title="Eliminar mi falta"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer disabled:opacity-30"
                              >
                                {isDeleting ? (
                                  <Loader2 size={14} className="animate-spin text-red-400" />
                                ) : (
                                  <Trash2 size={14} />
                                )}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Pie del modal */}
            <div className="p-4 border-t border-white/[0.08] flex items-center justify-between bg-slate-900/90 shrink-0">
              <span className="text-[11px] text-slate-400">
                Límite legal del 12% por módulo curricular
              </span>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-xs font-semibold text-white transition-all cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
