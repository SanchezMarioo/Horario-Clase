'use client';

import React, { useState, useMemo } from 'react';
import { AcademicEvent, CalendarEventType } from '@/types/calendar';
import { SUBJECT_MAP } from '@/data/scheduleData';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  Trash2,
  CheckCircle2,
  Calendar as CalendarIcon,
  Star,
  User,
  Pencil,
} from 'lucide-react';
import AddEventModal from './AddEventModal';
import { deleteEventAction, toggleEventCompleteAction } from '@/app/actions/calendar';
import { useAuth, useUser } from '@clerk/nextjs';
import { toast } from 'sonner';

interface CalendarMonthViewProps {
  events: AcademicEvent[];
  onRefresh?: () => void;
  isAdmin?: boolean;
}

const MONTH_NAMES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

// Helper para formatear fechas locales YYYY-MM-DD sin desvío horario UTC
function formatLocalDate(y: number, m: number, d: number): string {
  const dt = new Date(y, m, d);
  const actualY = dt.getFullYear();
  const actualM = String(dt.getMonth() + 1).padStart(2, '0');
  const actualD = String(dt.getDate()).padStart(2, '0');
  return `${actualY}-${actualM}-${actualD}`;
}

function getTodayStr(): string {
  const now = new Date();
  return formatLocalDate(now.getFullYear(), now.getMonth(), now.getDate());
}

export default function CalendarMonthView({
  events,
  onRefresh,
  isAdmin = false,
}: CalendarMonthViewProps) {
  const { userId } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string>(getTodayStr());
  const [filterType, setFilterType] = useState<'all' | CalendarEventType>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<AcademicEvent | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Navegación de mes
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleGoToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDateStr(getTodayStr());
  };

  // Cálculo memoizado de la cuadrícula de días (solo cuando cambia el mes o año)
  const calendarCells = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    let startDayIndex = firstDayOfMonth.getDay() - 1;
    if (startDayIndex === -1) startDayIndex = 6;

    const daysInMonth = lastDayOfMonth.getDate();
    const prevMonthLastDay = new Date(year, month, 0).getDate();

    const cells: {
      key: string;
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
    }[] = [];

    // Días del mes anterior para rellenar
    for (let i = startDayIndex - 1; i >= 0; i--) {
      const d = prevMonthLastDay - i;
      const dateStr = formatLocalDate(year, month - 1, d);
      cells.push({
        key: `prev-${dateStr}`,
        dateStr,
        dayNumber: d,
        isCurrentMonth: false,
      });
    }

    // Días del mes actual
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = formatLocalDate(year, month, d);
      cells.push({
        key: `curr-${dateStr}`,
        dateStr,
        dayNumber: d,
        isCurrentMonth: true,
      });
    }

    // Días del mes siguiente para completar la cuadrícula (35 o 42 celdas completas)
    const totalCellsNeeded = cells.length > 35 ? 42 : 35;
    const remainingCells = totalCellsNeeded - cells.length;
    for (let d = 1; d <= remainingCells; d++) {
      const dateStr = formatLocalDate(year, month + 1, d);
      cells.push({
        key: `next-${dateStr}`,
        dateStr,
        dayNumber: d,
        isCurrentMonth: false,
      });
    }

    return cells;
  }, [year, month]);

  // Indexación O(1) de eventos por fecha
  const eventsByDate = useMemo(() => {
    const map: Record<string, AcademicEvent[]> = {};
    for (const ev of events) {
      if (filterType !== 'all' && ev.type !== filterType) continue;
      if (!map[ev.date]) {
        map[ev.date] = [];
      }
      map[ev.date].push(ev);
    }
    return map;
  }, [events, filterType]);

  // Eventos para el día seleccionado (búsqueda instantánea O(1))
  const selectedDayEvents = useMemo(
    () => eventsByDate[selectedDateStr] || [],
    [eventsByDate, selectedDateStr]
  );

  const todayStr = getTodayStr();

  const handleDelete = (id: string, title: string) => {
    toast(`¿Eliminar "${title}"?`, {
      description: 'Esta acción no se puede deshacer.',
      action: {
        label: 'Eliminar',
        onClick: async () => {
          const res = await deleteEventAction(id);
          if (!res.success) {
            toast.error('Error al eliminar', { description: res.error });
            return;
          }
          toast.success('Evento eliminado correctamente');
          if (onRefresh) onRefresh();
        },
      },
      cancel: {
        label: 'Cancelar',
        onClick: () => {},
      },
    });
  };

  const handleToggle = async (id: string, currentCompleted: boolean) => {
    const res = await toggleEventCompleteAction(id);
    if (!res.success) {
      toast.error('Error al actualizar estado', { description: res.error });
      return;
    }
    toast.success(res.data ? '¡Tarea completada!' : 'Tarea marcada como pendiente');
    if (onRefresh) onRefresh();
  };

  return (
    <div className="w-full max-w-[1240px] flex flex-col gap-6">
      {/* Barra de cabecera del calendario con navegación y filtros */}
      <div className="bg-slate-900/60 border border-white/[0.08] p-4 sm:p-5 rounded-3xl backdrop-blur-xl flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-white/[0.04] border border-white/10 rounded-xl p-1">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <h2 className="text-base sm:text-lg font-bold text-white capitalize">
            {MONTH_NAMES[month]} {year}
          </h2>

          <button
            type="button"
            onClick={handleGoToday}
            className="text-xs font-semibold text-indigo-300 hover:text-white bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-lg transition-colors"
          >
            Hoy
          </button>
        </div>

        {/* Filtros por tipo de evento */}
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'all', label: 'Todos' },
            { id: 'exam', label: '📝 Exámenes' },
            { id: 'assignment', label: '📋 Tareas' },
            { id: 'project', label: '🚀 Proyectos' },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilterType(f.id as 'all' | CalendarEventType)}
              className={`px-3 py-1 text-xs font-semibold rounded-xl border transition-all ${
                filterType === f.id
                  ? 'bg-indigo-600 border-indigo-500 text-white shadow-md'
                  : 'bg-white/[0.03] border-white/10 text-slate-400 hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}

          {isAdmin && (
            <button
              type="button"
              onClick={() => {
                setEditingEvent(null);
                setIsModalOpen(true);
              }}
              className="ml-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <Plus size={14} /> Añadir
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cuadrícula Mensual (2 columnas en pantallas grandes) */}
        <div className="lg:col-span-2 bg-slate-900/60 border border-white/[0.08] p-4 sm:p-5 rounded-3xl backdrop-blur-xl">
          {/* Cabecera de días de la semana */}
          <div className="grid grid-cols-7 gap-1.5 mb-2 text-center">
            {WEEKDAYS.map((day, idx) => (
              <div
                key={day}
                className={`text-[11px] font-bold uppercase tracking-wider py-1.5 rounded-lg ${
                  idx >= 5 ? 'text-slate-600' : 'text-slate-400'
                }`}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Días del mes */}
          <div className="grid grid-cols-7 gap-1.5">
            {calendarCells.map((cell) => {
              const dayEvents = eventsByDate[cell.dateStr] || [];
              const isSelected = cell.dateStr === selectedDateStr;
              const isToday = cell.dateStr === todayStr;
              const hasExams = dayEvents.some((e) => e.type === 'exam');

              return (
                <div
                  key={cell.key}
                  onClick={() => setSelectedDateStr(cell.dateStr)}
                  onDoubleClick={() => {
                    setSelectedDateStr(cell.dateStr);
                    setIsModalOpen(true);
                  }}
                  title="Clic para seleccionar · Doble clic para añadir"
                  className={`
                    min-h-[72px] sm:min-h-[84px] p-1.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between select-none
                    ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-950/40 ring-1 ring-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.2)]'
                        : cell.isCurrentMonth
                        ? 'border-white/[0.06] bg-white/[0.01] hover:border-white/20 hover:bg-white/[0.03]'
                        : 'border-transparent bg-transparent opacity-30'
                    }
                    ${isToday ? 'ring-1 ring-emerald-500/50' : ''}
                  `}
                >
                  <div className="flex justify-between items-center">
                    <span
                      className={`text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full ${
                        isToday
                          ? 'bg-emerald-500 text-black font-extrabold'
                          : isSelected
                          ? 'text-indigo-300 font-bold'
                          : 'text-slate-300'
                      }`}
                    >
                      {cell.dayNumber}
                    </span>

                    {hasExams && (
                      <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_6px_#ef4444]" />
                    )}
                  </div>

                  {/* Indicadores de eventos */}
                  <div className="flex flex-col gap-1 overflow-hidden mt-1">
                    {dayEvents.slice(0, 2).map((ev) => {
                      const subject = ev.subjectId !== 'general' ? SUBJECT_MAP[ev.subjectId] : null;
                      return (
                        <div
                          key={ev.id}
                          className={`text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded truncate border ${
                            ev.type === 'exam'
                              ? 'bg-red-500/20 text-red-300 border-red-500/30'
                              : subject
                              ? `${subject.styles.bgColor} ${subject.styles.textColor} ${subject.styles.borderColor}`
                              : 'bg-white/10 text-slate-300 border-white/10'
                          }`}
                        >
                          {ev.type === 'exam' ? '📝 ' : '📋 '}
                          {ev.title}
                        </div>
                      );
                    })}
                    {dayEvents.length > 2 && (
                      <span className="text-[9px] text-slate-400 font-semibold px-1">
                        +{dayEvents.length - 2} más
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Panel lateral de detalle del día seleccionado */}
        <div className="lg:col-span-1 bg-slate-900/60 border border-white/[0.08] p-5 rounded-3xl backdrop-blur-xl flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-white/[0.06]">
              <div>
                <span className="text-xs text-slate-400 block">Día seleccionado</span>
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <CalendarIcon size={14} className="text-indigo-400" /> {selectedDateStr}
                  {selectedDateStr === todayStr && (
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.2 rounded">
                      Hoy
                    </span>
                  )}
                </h3>
              </div>

              {isAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingEvent(null);
                    setIsModalOpen(true);
                  }}
                  className="p-1.5 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-600/30 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Plus size={14} /> Añadir
                </button>
              )}
            </div>

            {selectedDayEvents.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs flex flex-col items-center gap-2">
                <CheckCircle2 size={32} className="text-slate-600" />
                <span>No hay tareas ni exámenes programados para esta fecha.</span>
              </div>
            ) : (
              <div className="flex flex-col gap-3 max-h-[460px] overflow-y-auto pr-1">
                {selectedDayEvents.map((ev) => {
                  const subject = ev.subjectId !== 'general' ? SUBJECT_MAP[ev.subjectId] : null;
                  const canDelete = isAdmin;

                  return (
                    <div
                      key={ev.id}
                      className={`p-3 rounded-2xl border transition-all flex flex-col gap-2 ${
                        ev.isOfficial
                          ? 'bg-indigo-950/30 border-indigo-500/30'
                          : 'bg-white/[0.02] border-white/[0.06]'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-xs font-bold text-white leading-snug">
                          {ev.title}
                        </span>
                        {canDelete && (
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingEvent(ev);
                                setIsModalOpen(true);
                              }}
                              className="text-slate-500 hover:text-indigo-400 transition-colors p-1 cursor-pointer"
                              title="Editar evento"
                            >
                              <Pencil size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(ev.id, ev.title)}
                              className="text-slate-500 hover:text-red-400 transition-colors p-1 cursor-pointer"
                              title="Eliminar evento"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5">
                        {subject && (
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${subject.styles.badgeBg}`}
                          >
                            {subject.shortName}
                          </span>
                        )}
                        {ev.isOfficial && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-0.5">
                            <Star size={10} /> Oficial
                          </span>
                        )}
                        {ev.time && (
                          <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                            <Clock size={11} /> {ev.time}
                          </span>
                        )}
                      </div>

                      {ev.description && (
                        <p className="text-[11px] text-slate-400 leading-relaxed bg-black/20 p-2 rounded-xl border border-white/5">
                          {ev.description}
                        </p>
                      )}

                      <div className="flex justify-between items-center text-[10px] text-slate-500 pt-1 border-t border-white/[0.04]">
                        <span className="truncate max-w-[140px] flex items-center gap-1">
                          <User size={10} /> {ev.authorName || 'Compañero'}
                        </span>
                        {isAdmin ? (
                          <button
                            type="button"
                            onClick={() => handleToggle(ev.id, ev.completed)}
                            className={`font-semibold hover:underline cursor-pointer ${
                              ev.completed ? 'text-emerald-400' : 'text-slate-400'
                            }`}
                          >
                            {ev.completed ? '✓ Hecho' : '○ Pendiente'}
                          </button>
                        ) : (
                          <span
                            className={`font-semibold ${
                              ev.completed ? 'text-emerald-400' : 'text-slate-500'
                            }`}
                          >
                            {ev.completed ? '✓ Hecho' : '○ Pendiente'}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <AddEventModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingEvent(null);
        }}
        onEventAdded={onRefresh}
        defaultDate={selectedDateStr}
        isAdmin={isAdmin}
        eventToEdit={editingEvent}
      />
    </div>
  );
}
