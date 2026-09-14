'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { X, Calendar, Clock, Plus, BookOpen, AlertCircle, Sparkles } from 'lucide-react';
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
  const { user } = useUser();

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
  const [isOfficial, setIsOfficial] = useState(false);

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

    startTransition(async () => {
      const res = await createEventAction({
        title,
        type,
        subjectId,
        date,
        time: time || undefined,
        priority,
        description: description || undefined,
        isOfficial: isAdmin ? isOfficial : false,
      });

      if (!res.success) {
        toast.error('Error al guardar el evento', {
          description: res.error || 'No se pudo registrar el evento.',
        });
        return;
      }

      toast.success('¡Evento guardado y compartido!', {
        description: `"${title}" ya está visible para toda la clase.`,
      });

      setTitle('');
      setDescription('');
      setTime('');
      if (onEventAdded) onEventAdded();
      onClose();
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900/95 border border-white/10 rounded-3xl p-6 shadow-2xl backdrop-blur-2xl max-h-[90vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X size={18} />
        </button>

        <div className="mb-5">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-[11px] font-bold uppercase tracking-wider mb-2">
            <Sparkles size={12} /> Calendario Compartido
          </span>
          <h2 className="text-xl font-bold text-white">Añadir Tarea o Examen</h2>
          <p className="text-xs text-slate-400">
            Se guardará en la base de datos para que todos los compañeros puedan consultarlo.
          </p>
        </div>

        {/* Si no ha iniciado sesión en Clerk */}
        {isLoaded && !isSignedIn ? (
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 text-center flex flex-col items-center gap-3">
            <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400">
              <AlertCircle size={28} />
            </div>
            <p className="text-xs text-slate-300">
              Para publicar una tarea o examen debes iniciar sesión en el sistema.
            </p>
            <Link
              href="/sign-in"
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-lg shadow-indigo-600/30"
            >
              Iniciar Sesión con Clerk
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

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
                    className={`py-2 px-2 text-xs font-bold rounded-xl border transition-all ${
                      type === t.id
                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-md'
                        : 'bg-white/[0.03] border-white/10 text-slate-400 hover:bg-white/[0.06]'
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
                Título del Evento / Tarea
              </label>
              <input
                type="text"
                required
                placeholder="Ej. Examen Tema 2 o Entrega Práctica 1"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={100}
                className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Asignatura */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5 flex items-center gap-1.5">
                <BookOpen size={14} className="text-indigo-400" /> Módulo / Asignatura
              </label>
              <select
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value as SubjectId | 'general')}
                className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="general">🌐 General / Sin Asignatura Específica</option>
                {SUBJECT_MODULES.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.shortName})
                  </option>
                ))}
              </select>
            </div>

            {/* Fecha y Hora */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5 flex items-center gap-1">
                  <Calendar size={13} className="text-indigo-400" /> Fecha
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
                    className={`flex-1 py-1.5 text-xs font-bold rounded-xl border transition-all ${
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
                placeholder="Temas que entran, enlace a recursos, formato de entrega..."
                value={description}
                maxLength={500}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
              />
            </div>

            {/* Checkbox oficial si es admin */}
            {isAdmin && (
              <label className="flex items-center gap-2 p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isOfficial}
                  onChange={(e) => setIsOfficial(e.target.checked)}
                  className="rounded border-white/20 text-indigo-600 focus:ring-0"
                />
                <span className="text-xs text-indigo-300 font-semibold">
                  ⭐ Marcar como Examen/Evento Oficial del Curso
                </span>
              </label>
            )}

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/10 transition-all"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <Plus size={16} />
                {isPending ? 'Guardando...' : 'Guardar y Compartir'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
