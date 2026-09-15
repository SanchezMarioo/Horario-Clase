'use client';

import React, { useState } from 'react';
import { Plus, Calendar, Clock, FileText } from 'lucide-react';
import { SubjectId } from '@/types/schedule';
import { SUBJECT_MODULES } from '@/data/scheduleData';

interface AddAbsenceFormProps {
  onAddAbsence: (data: {
    subjectId: SubjectId;
    date: string;
    hours: number;
    justified: boolean;
    notes?: string;
  }) => Promise<boolean>;
  isPending: boolean;
}

export default function AddAbsenceForm({ onAddAbsence, isPending }: AddAbsenceFormProps) {
  const getTodayStr = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const [subjectId, setSubjectId] = useState<SubjectId>('sub-multimedia');
  const [date, setDate] = useState<string>(getTodayStr());
  const [hours, setHours] = useState<number>(1);
  const [justified, setJustified] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await onAddAbsence({
      subjectId,
      date,
      hours: Number(hours),
      justified,
      notes: notes.trim() ? notes.trim() : undefined,
    });

    if (success) {
      setNotes('');
      setHours(1);
    }
  };

  return (
    <div className="bg-slate-900/60 border border-white/[0.08] p-5 rounded-3xl backdrop-blur-xl h-fit">
      <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-4 flex items-center gap-2">
        <Plus className="text-indigo-400" size={18} /> Apuntar Nueva Falta
      </h2>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
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
              className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
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
              className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
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
  );
}
