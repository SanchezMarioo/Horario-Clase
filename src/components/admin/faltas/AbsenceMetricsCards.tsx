'use client';

import React from 'react';
import { Clock, CheckCircle2, AlertTriangle, Percent } from 'lucide-react';

interface AbsenceMetricsCardsProps {
  totalHours: number;
  justifiedHours: number;
  riskCount: number;
  alertCount: number;
}

export default function AbsenceMetricsCards({
  totalHours,
  justifiedHours,
  riskCount,
  alertCount,
}: AbsenceMetricsCardsProps) {
  return (
    <section aria-label="Métricas de faltas" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      <div className="bg-slate-900/60 border border-white/[0.08] p-4 rounded-2xl backdrop-blur-md flex items-center justify-between">
        <div>
          <span className="text-xs text-slate-400 block mb-1">Horas Totales Faltas</span>
          <span className="text-2xl font-black text-white">{totalHours}h</span>
        </div>
        <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400">
          <Clock size={22} />
        </div>
      </div>

      <div className="bg-slate-900/60 border border-white/[0.08] p-4 rounded-2xl backdrop-blur-md flex items-center justify-between">
        <div>
          <span className="text-xs text-slate-400 block mb-1">Faltas Justificadas</span>
          <span className="text-2xl font-black text-emerald-400">{justifiedHours}h</span>
        </div>
        <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
          <CheckCircle2 size={22} />
        </div>
      </div>

      <div className="bg-slate-900/60 border border-white/[0.08] p-4 rounded-2xl backdrop-blur-md flex items-center justify-between">
        <div>
          <span className="text-xs text-slate-400 block mb-1">Módulos en Riesgo (&gt;80%)</span>
          <span className="text-2xl font-black text-red-400">{riskCount}</span>
        </div>
        <div className="p-2.5 rounded-xl bg-red-500/10 text-red-400">
          <AlertTriangle size={22} />
        </div>
      </div>

      <div className="bg-slate-900/60 border border-white/[0.08] p-4 rounded-2xl backdrop-blur-md flex items-center justify-between">
        <div>
          <span className="text-xs text-slate-400 block mb-1">Módulos en Alerta (50-80%)</span>
          <span className="text-2xl font-black text-amber-400">{alertCount}</span>
        </div>
        <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400">
          <Percent size={22} />
        </div>
      </div>
    </section>
  );
}
