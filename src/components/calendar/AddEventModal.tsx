'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { createPortal } from 'react-dom';
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
  BookOpen,
  Send,
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  // Cerrar con Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const [isPending, startTransition] = useTransition();

  if (!isOpen || !mounted) return null;

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

        toast.success('¡Evento publicado en el calendario oficial!', {
          description: `"${title}" ya está visible para toda la clase.`,
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

  const modalContent = (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="relative w-full max-w-xl bg-slate-900/98 border border-white/15 rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8),0_0_30px_rgba(99,102,241,0.15)] flex flex-col max-h-[92vh] overflow-hidden my-auto animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera Principal */}
        <div className="p-6 sm:p-7 pb-5 border-b border-white/10 flex items-start justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-xs font-bold uppercase tracking-wider shadow-[0_0_15px_rgba(99,102,241,0.25)]">
                <Sparkles size={13} className="text-indigo-400 animate-pulse" /> Calendario Oficial DM2A
              </span>
              <span className="text-[11px] font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                Solo Admins
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Añadir Tarea o Examen
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Publica entregas o fechas clave para que aparezcan en la agenda de todo el grupo.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal"
            className="p-2.5 rounded-2xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors shrink-0 cursor-pointer border border-transparent hover:border-white/10"
          >
            <X size={20} />
          </button>
        </div>

        {/* Contenido */}
        {!isLoaded ? (
          <div className="p-16 text-center text-slate-400 text-sm flex flex-col items-center justify-center gap-3">
            <Loader2 size={24} className="animate-spin text-indigo-400" />
            <span>Cargando credenciales de usuario...</span>
          </div>
        ) : !isSignedIn ? (
          <div className="p-8 sm:p-10 text-center flex flex-col items-center gap-4">
            <div className="p-4 rounded-3xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-lg">
              <AlertCircle size={40} />
            </div>
            <h3 className="text-base font-bold text-white">Inicio de sesión requerido</h3>
            <p className="text-xs sm:text-sm text-slate-300 max-w-sm leading-relaxed">
              Debes iniciar sesión con tu cuenta para acceder a la gestión del calendario.
            </p>
            <Link
              href="/sign-in"
              className="mt-2 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-xl shadow-indigo-600/30 cursor-pointer"
            >
              Iniciar Sesión con Clerk
            </Link>
          </div>
        ) : !isAdmin ? (
          <div className="p-8 sm:p-10 text-center flex flex-col items-center gap-4">
            <div className="p-4 rounded-3xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-lg">
              <ShieldAlert size={40} />
            </div>
            <h3 className="text-base font-bold text-white">Acceso Exclusivo para Administradores</h3>
            <p className="text-xs sm:text-sm text-slate-300 max-w-md leading-relaxed">
              El calendario oficial de exámenes y tareas solo puede ser modificado por delegados o administradores del curso.
            </p>
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 text-xs text-slate-400 max-w-md text-left">
              💡 <strong>¿Eres delegado o profesor?</strong> Puedes activarte al instante introduciendo el código de invitación rápida en el <strong>Panel Admin</strong>.
            </div>
            <div className="flex gap-3 mt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-white/[0.04] border border-white/10 cursor-pointer"
              >
                Cerrar
              </button>
              <Link
                href="/admin"
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/30 cursor-pointer"
              >
                Ir al Panel Admin
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
            {/* Cuerpo con Scroll Amplio */}
            <div className="p-6 sm:p-7 overflow-y-auto space-y-5 flex-1">
              {/* Tipo de evento */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-2">
                  Tipo de Evento
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    { id: 'exam', label: '📝 Examen', activeClass: 'bg-red-500/20 text-red-300 border-red-500/40 shadow-red-500/20' },
                    { id: 'assignment', label: '📋 Tarea', activeClass: 'bg-sky-500/20 text-sky-300 border-sky-500/40 shadow-sky-500/20' },
                    { id: 'project', label: '🚀 Proyecto', activeClass: 'bg-purple-500/20 text-purple-300 border-purple-500/40 shadow-purple-500/20' },
                    { id: 'reminder', label: '⏰ Aviso', activeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-emerald-500/20' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setType(t.id as CalendarEventType)}
                      className={`py-2.5 px-3 text-xs font-bold rounded-2xl border transition-all cursor-pointer shadow-sm ${
                        type === t.id
                          ? `${t.activeClass} ring-1 ring-white/20 scale-[1.02]`
                          : 'bg-white/[0.03] border-white/10 text-slate-400 hover:bg-white/[0.07] hover:text-white'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Título de la tarea */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-2">
                  Título del Evento o Tarea <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={100}
                  placeholder="Ej. Examen Tema 2 o Entrega Práctica 1"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-white/15 rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-inner"
                />
              </div>

              {/* Módulo / Asignatura */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-2 flex items-center gap-1.5">
                  <BookOpen size={14} className="text-indigo-400" /> Módulo / Asignatura
                </label>
                <select
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value as SubjectId | 'general')}
                  className="w-full bg-slate-950 border border-white/15 rounded-2xl px-4 py-3 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer"
                >
                  <option value="general">📢 Aviso General (Todo el curso DM2A)</option>
                  {SUBJECT_MODULES.map((mod) => (
                    <option key={mod.id} value={mod.id}>
                      {mod.name} ({mod.shortName})
                    </option>
                  ))}
                </select>
              </div>

              {/* Fecha y Hora en Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-2 flex items-center gap-1.5">
                    <Calendar size={14} className="text-indigo-400" /> Fecha <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-slate-950 border border-white/15 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-2 flex items-center gap-1.5">
                    <Clock size={14} className="text-indigo-400" /> Hora Límite (opcional)
                  </label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full bg-slate-950 border border-white/15 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer"
                  />
                </div>
              </div>

              {/* Nivel de Prioridad */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-2">
                  Prioridad
                </label>
                <div className="flex gap-2.5">
                  {[
                    { id: 'low', label: 'Baja', dot: 'bg-slate-400', active: 'bg-white/15 border-white/40 text-white' },
                    { id: 'medium', label: 'Media', dot: 'bg-amber-400', active: 'bg-amber-500/20 border-amber-500/40 text-amber-300' },
                    { id: 'high', label: 'Alta', dot: 'bg-red-400', active: 'bg-red-500/20 border-red-500/40 text-red-300' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPriority(p.id as EventPriority)}
                      className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer flex items-center justify-center gap-2 ${
                        priority === p.id
                          ? `${p.active} ring-1 ring-white/10 shadow-sm`
                          : 'bg-white/[0.02] border-white/10 text-slate-400 hover:bg-white/[0.06] hover:text-white'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${p.dot}`} />
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Temario / Detalles */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-2">
                  Temario o Detalles de la Entrega (opcional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Temas que entran, formato de entrega, enlace a repositorio o apuntes..."
                  value={description}
                  maxLength={500}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-white/15 rounded-2xl px-4 py-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none shadow-inner"
                />
              </div>

              {/* Checkbox Oficial */}
              <label className="flex items-center gap-3 p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/25 cursor-pointer hover:bg-indigo-500/15 transition-colors">
                <input
                  type="checkbox"
                  checked={isOfficial}
                  onChange={(e) => setIsOfficial(e.target.checked)}
                  className="w-4 h-4 rounded border-white/20 text-indigo-600 focus:ring-0 cursor-pointer"
                />
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-indigo-200">
                    ⭐ Marcar como Evento Oficial del Curso DM2A
                  </span>
                  <span className="text-[11px] text-indigo-300/70">
                    Destacará con marco dorado y distintivo en el calendario de todos los alumnos.
                  </span>
                </div>
              </label>
            </div>

            {/* Pie Principal Fijo */}
            <div className="p-5 sm:p-6 pt-4 border-t border-white/10 bg-slate-950 flex justify-end items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={onClose}
                disabled={isPending}
                className="px-5 py-2.5 rounded-2xl text-xs font-bold text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer border border-transparent hover:border-white/10"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-xs font-black shadow-lg shadow-indigo-600/40 hover:shadow-indigo-600/60 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
              >
                {isPending ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Publicando...
                  </>
                ) : (
                  <>
                    <Send size={15} />
                    Publicar en el Calendario
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
