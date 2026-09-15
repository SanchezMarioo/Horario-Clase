'use client';

import React from 'react';
import { BookOpen } from 'lucide-react';
import { ModuleAbsenceStats } from '@/types/absence';

interface ModuleLimitsGridProps {
  stats: ModuleAbsenceStats[];
}

export default function ModuleLimitsGrid({ stats }: ModuleLimitsGridProps) {
  return (
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
  );
}
