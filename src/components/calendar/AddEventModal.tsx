'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import {
  X,
  Calendar,
  Clock,
  Plus,
  AlertCircle,
  Sparkles,
  ShieldAlert,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { CalendarEventType, EventPriority } from '@/types/calendar';
import { SubjectId } from '@/types/schedule';
import { SUBJECT_MODULES } from '@/data/scheduleData';
import { createEventAction } from '@/app/actions/calendar';

interface AddEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEventAdded?: () => void;
  defaultDate?: string;
  isAdmin?: boolean;
}

export default function AddEventModal({
  isOpen,
  onClose,
  onEventAdded,
  defaultDate,
  isAdmin = false,
}: AddEventModalProps) {
  const { isSignedIn, isLoaded } = useAuth();

  const getInitialDate = () => {
    if (defaultDate) return defaultDate;
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const [title, setTitle] = useState('');
  const [type, setType] = useState<CalendarEventType>('exam');
  const [subjectId, setSubjectId] = useState<SubjectId | 'general'>('sub-multimedia');
  const [date, setDate] = useState(getInitialDate());
  const [time, setTime] = useState('');
  const [priority, setPriority] = useState<EventPriority>('medium');
  const [description, setDescription] = useState('');
  const [isOfficial, setIsOfficial] = useState(true);

  // Sincronizar fecha seleccionada cuando cambia la casilla del calendario o se abre el modal
  useEffect(() => {
    if (isOpen) {
      setDate(defaultDate || getInitialDate());
    }
  }, [isOpen, defaultDate]);

  const [isPending, startTransition] = useTransition();

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error('Por favor introduce un título para la tarea o examen');
      return;
    }

    startTransition(async () => {
      try {
        const res = await createEventAction({
          title: title.trim(),
          type,
          subjectId,
          date,
          time: time || undefined,
          priority,
          description: description.trim() ? description.trim() : undefined,
          isOfficial: isAdmin ? isOfficial : true,
        });

        if (!res.success) {
          toast.error('Error al guardar el evento', {
            description: res.error || 'No se pudo registrar el evento.',
          });
          return;
        }

        toast.success('¡Evento guardado en el calendario!', {
          description: `"${title}" ya está disponible para toda la clase.`,
        });

        setTitle('');
        setDescription('');
        setTime('');
        if (onEventAdded) onEventAdded();
        onClose();
      } catch (error) {
        toast.error('Error de conexión', {
          description: error instanceof Error ? error.message : 'Error inesperado del servidor.',
        });
      }
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto"
    >
      <div className="relative w-full max-w-lg bg-slate-900 border border-white/10 rounded-3xl shadow-2xl backdrop-blur-2xl flex flex-col max-h-[90vh] overflow-hidden my-auto">
        {/* Cabecera fija */}
        <div className="p-5 sm:p-6 pb-4 border-b border-white/[0.08] flex items-start justify-between gap-3 bg-slate-900/90 shrink-0">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-[11px] font-bold uppercase tracking-wider mb-1.5">
              <Sparkles size={12} /> Calendario de Curso · Solo Admins
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-white">Añadir Tarea o Examen</h2>
            <p className="text-xs text-slate-400">
              Se registrará en el calendario compartido para que todos los alumnos puedan consultarlo.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal"
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Contenido */}
        {!isLoaded ? (
          <div className="p-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
            <Loader2 size={18} className="animate-spin text-indigo-400" />
            Cargando estado de usuario...
          </div>
        ) : !isSignedIn ? (
          <div className="p-8 text-center flex flex-col items-center gap-3">
            <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400">
              <AlertCircle size={32} />
            </div>
            <h3 className="text-sm font-bold text-white">Inicio de sesión requerido</h3>
            <p className="text-xs text-slate-300 max-w-xs leading-relaxed">
              Debes iniciar sesión con tu cuenta para acceder a las funciones del calendario.
            </p>
            <Link
              href="/sign-in"
              className="mt-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-lg shadow-indigo-600/30"
            >
              Iniciar Sesión con Clerk
            </Link>
          </div>
        ) : !isAdmin ? (
          <div className="p-8 text-center flex flex-col items-center gap-3">
            <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400">
              <ShieldAlert size={32} />
            </div>
            <h3 className="text-sm font-bold text-white">Acceso Restringido a Administradores</h3>
            <p className="text-xs text-slate-300 max-w-xs leading-relaxed">
              Solo los delegados o administradores pueden publicar exámenes y tareas en el calendario oficial.
            </p>
            <p className="text-[11px] text-slate-400 bg-white/[0.03] p-3 rounded-xl border border-white/5">
              Si eres delegado o administrador, puedes solicitar el alta o usar tu código de activación en el Panel Admin.
            </p>
            <div className="flex gap-2 mt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-white/[0.04] border border-white/10"
              >
                Cerrar
              </button>
              <Link
                href="/admin"
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all"
              >
                Ir a Panel Admin
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
            {/* Cuerpo con scroll independiente */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
              {/* Tipo de evento */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Tipo de Evento
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'exam', label: '📝 Examen' },
                    { id: 'assignment', label: '📋 Tarea' },
                    { id: 'project', label: '🚀 Proyecto' },
                    { id: 'reminder', label: '⏰ Aviso' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setType(t.id as CalendarEventType)}
                      className={`py-2 px-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                        type === t.id
                          ? 'bg-indigo-600 border-indigo-500 text-white shadow-md'
                          : 'bg-white/[0.02] border-white/5 text-slate-400 hover:bg-white/[0.06] hover:text-white'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Título */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Título del Evento / Tarea *
                </label>
                <input
                  type="text"
                  required
                  maxLength={100}
                  placeholder="Ej. Examen Tema 2 o Entrega Práctica 1"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Módulo / Asignatura */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Módulo / Asignatura
                </label>
                <select
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value as SubjectId | 'general')}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="general">📢 Aviso General (Todo el curso)</option>
                  {SUBJECT_MODULES.map((mod) => (
                    <option key={mod.id} value={mod.id}>
                      {mod.name} ({mod.shortName})
                    </option>
                  ))}
                </select>
              </div>

              {/* Fecha y Hora */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5 flex items-center gap-1">
                    <Calendar size={13} className="text-indigo-400" /> Fecha *
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5 flex items-center gap-1">
                    <Clock size={13} className="text-indigo-400" /> Hora Límite (opcional)
                  </label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Prioridad */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Prioridad
                </label>
                <div className="flex gap-2">
                  {[
                    { id: 'low', label: 'Baja', color: 'text-slate-400' },
                    { id: 'medium', label: 'Media', color: 'text-amber-400' },
                    { id: 'high', label: 'Alta', color: 'text-red-400' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPriority(p.id as EventPriority)}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                        priority === p.id
                          ? 'bg-white/10 border-white/30 text-white'
                          : 'bg-white/[0.02] border-white/5 text-slate-400 hover:bg-white/[0.05]'
                      }`}
                    >
                      <span className={p.color}>●</span> {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Descripción */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Detalles / Temario (opcional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Temas que entran, formato de entrega o detalles..."
                  value={description}
                  maxLength={500}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              {/* Checkbox oficial */}
              <label className="flex items-center gap-2 p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isOfficial}
                  onChange={(e) => setIsOfficial(e.target.checked)}
                  className="rounded border-white/20 text-indigo-600 focus:ring-0"
                />
                <span className="text-xs text-indigo-300 font-semibold">
                  ⭐ Marcar como Evento Oficial del Curso DM2A
                </span>
              </label>
            </div>

            {/* Pie fijo con botones siempre visibles */}
            <div className="p-4 sm:p-5 pt-3 border-t border-white/[0.08] bg-slate-950/90 flex justify-end items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={onClose}
                disabled={isPending}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isPending ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Plus size={15} />
                    Guardar y Publicar
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
