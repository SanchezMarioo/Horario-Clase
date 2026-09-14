'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { UserButton } from '@clerk/nextjs';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Trash2,
  Plus,
  ArrowLeft,
  Calendar,
  BookOpen,
  FileText,
  ShieldCheck,
  Percent,
  Table2,
} from 'lucide-react';
import { AbsenceRecord, ModuleAbsenceStats } from '@/types/absence';
import { AcademicEvent } from '@/types/calendar';
import { SubjectId } from '@/types/schedule';
import { SUBJECT_MODULES } from '@/data/scheduleData';
import { addAbsenceAction, deleteAbsenceAction } from '@/app/actions/absences';
import { getEventsAction } from '@/app/actions/calendar';
import CalendarMonthView from '@/components/calendar/CalendarMonthView';

import { toast } from 'sonner';

interface AdminDashboardProps {
  initialRecords: AbsenceRecord[];
  initialStats: ModuleAbsenceStats[];
  initialEvents?: AcademicEvent[];
  userEmail?: string;
}

export default function AdminDashboard({
  initialRecords,
  initialStats,
  initialEvents = [],
  userEmail,
}: AdminDashboardProps) {
  const [activeSection, setActiveSection] = useState<'faltas' | 'calendario'>('faltas');
  const [records, setRecords] = useState<AbsenceRecord[]>(initialRecords);
  const [stats, setStats] = useState<ModuleAbsenceStats[]>(initialStats);
  const [events, setEvents] = useState<AcademicEvent[]>(initialEvents);
  const [selectedFilter, setSelectedFilter] = useState<'all' | SubjectId>('all');

  // Form State para Faltas
  const getTodayStr = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };
  const todayStr = getTodayStr();
  const [subjectId, setSubjectId] = useState<SubjectId>('sub-multimedia');
  const [date, setDate] = useState<string>(todayStr);
  const [hours, setHours] = useState<number>(1);
  const [justified, setJustified] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>('');

  const [isPending, startTransition] = useTransition();

  // Helper para recalcular stats en el cliente
  const refreshStats = (currentRecords: AbsenceRecord[]) => {
    setStats((prevStats) =>
      prevStats.map((stat) => {
        const modRecords = currentRecords.filter((r) => r.subjectId === stat.subjectId);
        const total = modRecords.reduce((sum, r) => sum + r.hours, 0);
        const just = modRecords.filter((r) => r.justified).reduce((sum, r) => sum + r.hours, 0);
        const injust = total - just;
        const remaining = Math.max(0, Number((stat.maxAllowedHours - total).toFixed(2)));
        const pct = Math.min(100, Number(((total / stat.maxAllowedHours) * 100).toFixed(1)));

        let st: 'safe' | 'warning' | 'danger' = 'safe';
        if (pct >= 80) st = 'danger';
        else if (pct >= 50) st = 'warning';

        return {
          ...stat,
          totalAbsenceHours: Number(total.toFixed(2)),
          justifiedHours: Number(just.toFixed(2)),
          unjustifiedHours: Number(injust.toFixed(2)),
          remainingHours: remaining,
          percentageUsed: pct,
          status: st,
        };
      })
    );
  };

  const reloadEvents = async () => {
    const res = await getEventsAction();
    if (res.success && res.data) {
      setEvents(res.data);
    }
  };

  const handleAddAbsence = (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      const res = await addAbsenceAction({
        subjectId,
        date,
        hours: Number(hours),
        justified,
        notes: notes.trim() ? notes.trim() : undefined,
      });

      if (!res.success || !res.data) {
        toast.error('Error al registrar la falta', {
          description: res.error || 'Verifica los datos e inténtalo de nuevo.',
        });
        return;
      }

      const updated = [res.data, ...records];
      setRecords(updated);
      refreshStats(updated);
      setNotes('');

      const modName = SUBJECT_MODULES.find((m) => m.id === subjectId)?.name || 'Módulo';
      toast.success('¡Falta registrada con éxito!', {
        description: `${hours}h en ${modName} (${justified ? 'Justificada' : 'Injustificada'}).`,
      });
    });
  };

  const handleDeleteAbsence = (id: string, subjectName: string) => {
    toast(`¿Eliminar registro de falta?`, {
      description: `Se eliminará la falta registrada en ${subjectName}.`,
      action: {
        label: 'Eliminar',
        onClick: () => {
          startTransition(async () => {
            const res = await deleteAbsenceAction(id);
            if (!res.success) {
              toast.error('Error al eliminar', { description: res.error });
              return;
            }

            const updated = records.filter((r) => r.id !== id);
            setRecords(updated);
            refreshStats(updated);
            toast.success('Registro de falta eliminado');
          });
        },
      },
      cancel: {
        label: 'Cancelar',
        onClick: () => {},
      },
    });
  };

  // Métricas globales
  const totalFaltasAcumuladas = records.reduce((acc, r) => acc + r.hours, 0);
  const totalJustificadas = records.filter((r) => r.justified).reduce((acc, r) => acc + r.hours, 0);
  const modulosEnRiesgo = stats.filter((s) => s.status === 'danger').length;
  const modulosEnAlerta = stats.filter((s) => s.status === 'warning').length;

  const filteredRecords =
    selectedFilter === 'all'
      ? records
      : records.filter((r) => r.subjectId === selectedFilter);

  return (
    <div className="w-full max-w-[1240px] flex flex-col gap-6">
      {/* Barra superior de navegación y usuario */}
      <div className="flex flex-wrap justify-between items-center bg-slate-900/70 border border-white/[0.08] p-4 rounded-2xl backdrop-blur-xl gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-300 hover:text-white bg-white/[0.05] border border-white/[0.1] px-3.5 py-2 rounded-xl transition-all hover:bg-white/[0.1]"
          >
            <ArrowLeft size={16} />
            Volver al Horario
          </Link>
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              <ShieldCheck className="text-indigo-400" size={20} />
              Panel de Administración DM2A
            </h1>
            <p className="text-xs text-slate-400">
              Control de faltas de asistencia y gestión del calendario
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-white/[0.03] border border-white/[0.06] px-3.5 py-1.5 rounded-xl">
          <div className="text-right">
            <span className="text-[11px] block text-slate-400">Sesión iniciada</span>
            <span className="text-xs font-semibold text-indigo-300">
              {userEmail || 'Administrador'}
            </span>
          </div>
          <UserButton />
        </div>
      </div>

      {/* Selector de Pestañas del Panel de Admin */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-900/80 border border-white/10 backdrop-blur-xl w-fit">
        <button
          type="button"
          onClick={() => setActiveSection('faltas')}
          className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSection === 'faltas'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          <Table2 size={16} /> Control de Faltas (12%)
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('calendario')}
          className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSection === 'calendario'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          <Calendar size={16} /> Gestión del Calendario y Exámenes
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/10 text-white">
            {events.length}
          </span>
        </button>
      </div>


      {activeSection === 'faltas' ? (
        <>
          {/* Tarjetas de métricas globales */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-slate-900/60 border border-white/[0.08] p-4 rounded-2xl backdrop-blur-md flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 block mb-1">Horas Totales Faltas</span>
                <span className="text-2xl font-black text-white">{totalFaltasAcumuladas}h</span>
              </div>
              <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400">
                <Clock size={22} />
              </div>
            </div>

            <div className="bg-slate-900/60 border border-white/[0.08] p-4 rounded-2xl backdrop-blur-md flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 block mb-1">Faltas Justificadas</span>
                <span className="text-2xl font-black text-emerald-400">{totalJustificadas}h</span>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
                <CheckCircle2 size={22} />
              </div>
            </div>

            <div className="bg-slate-900/60 border border-white/[0.08] p-4 rounded-2xl backdrop-blur-md flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 block mb-1">Módulos en Riesgo (&gt;80%)</span>
                <span className="text-2xl font-black text-red-400">{modulosEnRiesgo}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-red-500/10 text-red-400">
                <AlertTriangle size={22} />
              </div>
            </div>

            <div className="bg-slate-900/60 border border-white/[0.08] p-4 rounded-2xl backdrop-blur-md flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 block mb-1">Módulos en Alerta (50-80%)</span>
                <span className="text-2xl font-black text-amber-400">{modulosEnAlerta}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400">
                <Percent size={22} />
              </div>
            </div>
          </div>

          {/* Cuadrícula de progreso por módulo frente al 12% */}
          <section className="bg-slate-900/60 border border-white/[0.08] p-5 rounded-3xl backdrop-blur-xl">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
              <BookOpen size={16} /> Estado del Límite de Faltas por Módulo (Base de Datos)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {stats.map((modStat) => {
                const isDanger = modStat.status === 'danger';
                const isWarning = modStat.status === 'warning';

                return (
                  <div
                    key={modStat.subjectId}
                    className={`p-3.5 rounded-2xl border transition-all ${
                      isDanger
                        ? 'bg-red-500/10 border-red-500/30'
                        : isWarning
                        ? 'bg-amber-500/10 border-amber-500/30'
                        : 'bg-white/[0.02] border-white/[0.06]'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <span className="text-xs font-bold text-slate-200 leading-tight">
                        {modStat.name}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                          isDanger
                            ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                            : isWarning
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                        }`}
                      >
                        {modStat.percentageUsed}%
                      </span>
                    </div>

                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden mb-2">
                      <div
                        className={`h-full transition-all duration-500 rounded-full ${
                          isDanger
                            ? 'bg-red-500 shadow-[0_0_8px_#ef4444]'
                            : isWarning
                            ? 'bg-amber-500 shadow-[0_0_8px_#f59e0b]'
                            : 'bg-emerald-500 shadow-[0_0_8px_#10b981]'
                        }`}
                        style={{ width: `${modStat.percentageUsed}%` }}
                      />
                    </div>

                    <div className="flex justify-between items-center text-[11px] text-slate-400">
                      <span>
                        Faltas: <strong className="text-white">{modStat.totalAbsenceHours}h</strong> /{' '}
                        {modStat.maxAllowedHours}h máx
                      </span>
                      <span
                        className={
                          modStat.remainingHours <= 2
                            ? 'text-red-400 font-bold'
                            : 'text-slate-400'
                        }
                      >
                        Restan: {modStat.remainingHours}h
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Formulario para añadir faltas e Historial */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 bg-slate-900/60 border border-white/[0.08] p-5 rounded-3xl backdrop-blur-xl h-fit">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-4 flex items-center gap-2">
                <Plus className="text-indigo-400" size={18} /> Apuntar Nueva Falta
              </h2>

              <form onSubmit={handleAddAbsence} className="flex flex-col gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1.5">
                    Módulo / Asignatura
                  </label>
                  <select
                    value={subjectId}
                    onChange={(e) => setSubjectId(e.target.value as SubjectId)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    {SUBJECT_MODULES.map((m) => (
                      <option key={m.id} value={m.id} className="bg-slate-900 text-white">
                        {m.name} (Máx: {m.maxAbsenceHours})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-400 block mb-1.5 flex items-center gap-1">
                      <Calendar size={13} /> Fecha
                    </label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      required
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-400 block mb-1.5 flex items-center gap-1">
                      <Clock size={13} /> Horas
                    </label>
                    <div className="flex gap-1.5">
                      {[1, 2, 3].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setHours(val)}
                          className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                            hours === val
                              ? 'bg-indigo-600 border-indigo-500 text-white'
                              : 'bg-white/[0.04] border-white/10 text-slate-300 hover:bg-white/[0.08]'
                          }`}
                        >
                          {val}h
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1.5">
                    Tipo de Falta
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setJustified(false)}
                      className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all ${
                        !justified
                          ? 'bg-amber-600/30 border-amber-500/50 text-amber-200'
                          : 'bg-white/[0.03] border-white/10 text-slate-400 hover:bg-white/[0.06]'
                      }`}
                    >
                      Injustificada
                    </button>
                    <button
                      type="button"
                      onClick={() => setJustified(true)}
                      className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all ${
                        justified
                          ? 'bg-emerald-600/30 border-emerald-500/50 text-emerald-200'
                          : 'bg-white/[0.03] border-white/10 text-slate-400 hover:bg-white/[0.06]'
                      }`}
                    >
                      Justificada
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1.5 flex items-center gap-1">
                    <FileText size={13} /> Motivo / Observaciones (opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Cita médica, retraso..."
                    value={notes}
                    maxLength={200}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-1 cursor-pointer"
                >
                  <Plus size={16} />
                  {isPending ? 'Guardando en base de datos...' : 'Registrar Falta'}
                </button>
              </form>
            </div>

            {/* Historial de faltas registradas */}
            <div className="lg:col-span-2 bg-slate-900/60 border border-white/[0.08] p-5 rounded-3xl backdrop-blur-xl flex flex-col justify-between">
              <div>
                <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                    <Calendar size={18} className="text-indigo-400" /> Historial de Faltas ({filteredRecords.length})
                  </h2>

                  <select
                    value={selectedFilter}
                    onChange={(e) => setSelectedFilter(e.target.value as 'all' | SubjectId)}
                    className="bg-slate-950 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="all">Todas las asignaturas</option>
                    {SUBJECT_MODULES.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.shortName}
                      </option>
                    ))}
                  </select>
                </div>

                {filteredRecords.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 text-xs flex flex-col items-center gap-2">
                    <CheckCircle2 size={32} className="text-slate-600" />
                    <span>No hay faltas registradas en la base de datos. ¡Asistencia perfecta!</span>
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
                        {filteredRecords.map((r) => {
                          const mod = SUBJECT_MODULES.find((m) => m.id === r.subjectId);
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
                              <td className="py-2.5 text-slate-400 max-w-[150px] truncate">
                                {r.notes || '—'}
                              </td>
                              <td className="py-2.5 text-right pr-2">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteAbsence(r.id, mod?.shortName || r.subjectId)}
                                  disabled={isPending}
                                  title="Eliminar falta"
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                                >
                                  <Trash2 size={15} />
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
            </div>
          </div>
        </>
      ) : (
        /* Vista de Administración de Calendario */
        <CalendarMonthView events={events} isAdmin={true} onRefresh={reloadEvents} />
      )}
    </div>
  );
}
