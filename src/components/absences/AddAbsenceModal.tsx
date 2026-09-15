'use client';

import React, { useState, useTransition } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';
import Link from 'next/link';
import {
  X,
  AlertTriangle,
  Calendar,
  Clock,
  Plus,
  Loader2,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';
import { SubjectId } from '@/types/schedule';
import { SUBJECT_MODULES, SUBJECT_MAP } from '@/data/scheduleData';
import { addAbsenceAction } from '@/app/actions/absences';

interface AddAbsenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAbsenceAdded?: () => void;
  defaultSubjectId?: SubjectId;
}

export default function AddAbsenceModal({
  isOpen,
  onClose,
  onAbsenceAdded,
  defaultSubjectId,
}: AddAbsenceModalProps) {
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();

  const getTodayStr = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const [subjectId, setSubjectId] = useState<SubjectId>(
    defaultSubjectId || 'sub-multimedia'
  );
  const [date, setDate] = useState<string>(getTodayStr());
  const [hours, setHours] = useState<number>(1);
  const [justified, setJustified] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>('');

  const [isPending, startTransition] = useTransition();

  if (!isOpen) return null;

  const currentMod = SUBJECT_MAP[subjectId];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      try {
        const res = await addAbsenceAction({
          subjectId,
          date,
          hours: Number(hours),
          justified,
          notes: notes.trim() ? notes.trim() : undefined,
        });

        if (!res.success) {
          toast.error('Error al registrar la falta', {
            description: res.error || 'Verifica los datos e inténtalo de nuevo.',
          });
          return;
        }

        toast.success('¡Falta registrada con éxito!', {
          description: `Se han anotado ${hours}h en ${currentMod?.name || 'la asignatura'}.`,
        });

        setNotes('');
        setHours(1);
        if (onAbsenceAdded) onAbsenceAdded();
        onClose();
      } catch (err) {
        toast.error('Error al comunicarse con el servidor', {
          description: err instanceof Error ? err.message : 'Error inesperado.',
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
            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-bold uppercase tracking-wider mb-1.5">
              <AlertTriangle size={12} /> Registro de Ausencias DM2A
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-white">Registrar Falta de Asistencia</h2>
            <p className="text-xs text-slate-400">
              Cualquier compañero puede registrar horas de falta para monitorizar el límite del 12%.
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
              Inicia sesión con tu cuenta para anotar tus faltas o las del grupo y mantener las estadísticas sincronizadas.
            </p>
            <Link
              href="/sign-in"
              className="mt-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-lg shadow-indigo-600/30"
            >
              Iniciar Sesión con Clerk
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
            <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
              {/* Asignatura */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Módulo / Asignatura
                </label>
                <select
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value as SubjectId)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  {SUBJECT_MODULES.map((mod) => (
                    <option key={mod.id} value={mod.id}>
                      {mod.name} (Límite 12%: {mod.maxAbsenceHours})
                    </option>
                  ))}
                </select>

                {currentMod && (
                  <div className="mt-2 p-2.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Horas semanales: <strong className="text-slate-200">{currentMod.weeklyHours}</strong></span>
                    <span>Límite pérdida continua: <strong className="text-amber-400">{currentMod.maxAbsenceHours}</strong></span>
                  </div>
                )}
              </div>

              {/* Fecha y Horas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5 flex items-center gap-1">
                    <Calendar size={13} className="text-amber-400" /> Fecha de la falta
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5 flex items-center gap-1">
                    <Clock size={13} className="text-amber-400" /> Horas perdidas
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      required
                      min={0.5}
                      max={8}
                      step={0.5}
                      value={hours}
                      onChange={(e) => setHours(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                    {/* Botones rápidos */}
                    <div className="flex gap-1">
                      {[1, 2, 3].map((h) => (
                        <button
                          key={h}
                          type="button"
                          onClick={() => setHours(h)}
                          className={`px-2.5 py-2 text-[11px] font-bold rounded-lg border transition-all cursor-pointer ${
                            hours === h
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                              : 'bg-white/[0.02] text-slate-400 border-white/5 hover:text-white'
                          }`}
                        >
                          {h}h
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Estado de Justificación */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Tipo de Falta
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setJustified(false)}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      !justified
                        ? 'bg-red-500/20 text-red-300 border-red-500/40 shadow-sm'
                        : 'bg-white/[0.02] text-slate-400 border-white/5 hover:text-white'
                    }`}
                  >
                    <span>❌ Sin Justificar</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setJustified(true)}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      justified
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                        : 'bg-white/[0.02] text-slate-400 border-white/5 hover:text-white'
                    }`}
                  >
                    <span>✅ Justificada</span>
                  </button>
                </div>
              </div>

              {/* Motivo u Observaciones */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5 flex items-center gap-1">
                  <FileText size={13} className="text-slate-400" /> Motivo / Observaciones (opcional)
                </label>
                <textarea
                  rows={2}
                  maxLength={200}
                  placeholder="Ej. Cita médica, huelga de transporte, trámite oficial..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>
            </div>

            {/* Pie fijo con botones */}
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
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isPending ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Plus size={15} />
                    Registrar Falta
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
