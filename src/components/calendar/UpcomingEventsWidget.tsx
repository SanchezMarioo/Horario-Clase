'use client';

import React, { useState } from 'react';
import { AcademicEvent } from '@/types/calendar';
import { SUBJECT_MAP } from '@/data/scheduleData';
import { Calendar, Clock, Plus, CheckCircle2, Star, User, AlertTriangle } from 'lucide-react';
import AddEventModal from './AddEventModal';
import { toggleEventCompleteAction } from '@/app/actions/calendar';

interface UpcomingEventsWidgetProps {
  events: AcademicEvent[];
  onRefresh?: () => void;
  isAdmin?: boolean;
}

export default function UpcomingEventsWidget({
  events,
  onRefresh,
  isAdmin = false,
}: UpcomingEventsWidgetProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Calcular diferencia de días
  const getDaysLeftLabel = (dateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [year, month, day] = dateStr.split('-').map(Number);
    const target = new Date(year, month - 1, day);

    const diffMs = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { label: 'Pasado', color: 'bg-slate-700 text-slate-400' };
    if (diffDays === 0) return { label: '¡HOY!', color: 'bg-red-500 text-white animate-pulse' };
    if (diffDays === 1) return { label: 'Mañana', color: 'bg-amber-500 text-black font-bold' };
    if (diffDays <= 3) return { label: `En ${diffDays} días`, color: 'bg-amber-500/20 text-amber-300 border border-amber-500/30' };
    if (diffDays <= 7) return { label: `En ${diffDays} días`, color: 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' };
    return { label: `En ${diffDays} días`, color: 'bg-white/10 text-slate-300' };
  };

  const getTypeLabel = (type: AcademicEvent['type']) => {
    switch (type) {
      case 'exam':
        return { label: 'Examen', icon: '📝', badge: 'bg-red-500/20 text-red-300 border-red-500/30' };
      case 'assignment':
        return { label: 'Tarea', icon: '📋', badge: 'bg-sky-500/20 text-sky-300 border-sky-500/30' };
      case 'project':
        return { label: 'Proyecto', icon: '🚀', badge: 'bg-purple-500/20 text-purple-300 border-purple-500/30' };
      case 'reminder':
        return { label: 'Aviso', icon: '⏰', badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' };
    }
  };

  const handleToggleComplete = async (id: string) => {
    await toggleEventCompleteAction(id);
    if (onRefresh) onRefresh();
  };

  return (
    <section className="w-full max-w-[1240px] mb-6 bg-slate-900/60 border border-white/[0.08] rounded-3xl p-4 sm:p-5 backdrop-blur-xl">
      <div className="flex flex-wrap justify-between items-center mb-4 gap-3">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Calendar size={18} className="text-indigo-400" /> Próximos Exámenes y Entregas
          </h2>
          <p className="text-xs text-slate-400">
            Agenda compartida en la base de datos para todo el grupo DM2A
          </p>
        </div>

        {isAdmin ? (
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
          >
            <Plus size={15} /> Añadir Tarea / Examen
          </button>
        ) : (
          <span className="text-[11px] font-medium text-slate-400 bg-white/[0.03] px-3 py-1 rounded-xl border border-white/5">
            📅 Calendario oficial gestionado por administradores
          </span>
        )}
      </div>

      {events.length === 0 ? (
        <div className="py-8 text-center text-slate-500 text-xs flex flex-col items-center gap-2 bg-white/[0.01] rounded-2xl border border-white/[0.04]">
          <CheckCircle2 size={28} className="text-slate-600" />
          <span>No hay entregas ni exámenes pendientes registrados. ¡Todo al día!</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {events.map((ev) => {
            const daysInfo = getDaysLeftLabel(ev.date);
            const typeInfo = getTypeLabel(ev.type);
            const subject = ev.subjectId !== 'general' ? SUBJECT_MAP[ev.subjectId] : null;

            return (
              <div
                key={ev.id}
                className={`
                  relative flex flex-col justify-between p-3.5 rounded-2xl border transition-all duration-200 gap-3
                  ${
                    ev.isOfficial
                      ? 'bg-indigo-950/30 border-indigo-500/40 shadow-[0_0_15px_rgba(99,102,241,0.15)]'
                      : 'bg-white/[0.02] border-white/[0.06] hover:border-white/20'
                  }
                  ${ev.completed ? 'opacity-50 grayscale' : 'opacity-100'}
                `}
              >
                {/* Cabecera de tarjeta */}
                <div className="flex justify-between items-start gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 ${typeInfo.badge}`}
                    >
                      <span>{typeInfo.icon}</span> {typeInfo.label}
                    </span>
                    {ev.isOfficial && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                        <Star size={10} /> Oficial
                      </span>
                    )}
                  </div>

                  <span
                    className={`text-[11px] font-extrabold px-2 py-0.5 rounded-full whitespace-nowrap ${daysInfo.color}`}
                  >
                    {daysInfo.label}
                  </span>
                </div>

                {/* Título y Asignatura */}
                <div>
                  <h3 className="text-xs sm:text-[13px] font-bold text-white leading-snug mb-1">
                    {ev.title}
                  </h3>
                  {subject ? (
                    <span className={`text-[11px] font-semibold ${subject.styles.textColor}`}>
                      {subject.name}
                    </span>
                  ) : (
                    <span className="text-[11px] font-semibold text-slate-400">
                      Asignatura General
                    </span>
                  )}
                  {ev.description && (
                    <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">
                      {ev.description}
                    </p>
                  )}
                </div>

                {/* Pie con fecha, hora y autor */}
                <div className="flex justify-between items-center text-[11px] text-slate-400 border-t border-white/[0.04] pt-2 mt-1">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1">
                      <Calendar size={11} /> {ev.date}
                    </span>
                    {ev.time && (
                      <span className="flex items-center gap-1 text-slate-300">
                        <Clock size={11} /> {ev.time}
                      </span>
                    )}
                  </div>

                  {ev.authorName && (
                    <span className="flex items-center gap-1 text-[10px] text-slate-500 truncate max-w-[120px]">
                      <User size={10} /> {ev.authorName}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal para añadir tareas/exámenes */}
      <AddEventModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onEventAdded={onRefresh}
        isAdmin={isAdmin}
      />
    </section>
  );
}
