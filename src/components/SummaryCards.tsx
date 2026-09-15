import React, { useState, memo } from 'react';
import { SubjectModule, SubjectId } from '@/types/schedule';
import { ModuleAbsenceStats } from '@/types/absence';
import { Plus } from 'lucide-react';
import AddAbsenceModal from '@/components/absences/AddAbsenceModal';

interface SummaryCardsProps {
  modules: SubjectModule[];
  activeFilter: 'all' | SubjectId;
  onSelectCategory: (categoryId: 'all' | SubjectId) => void;
  absenceStats?: Record<SubjectId, ModuleAbsenceStats>;
  onRefresh?: () => void;
}

function SummaryCardsComponent({
  modules,
  activeFilter,
  onSelectCategory,
  absenceStats,
  onRefresh,
}: SummaryCardsProps) {
  const [isAbsenceModalOpen, setIsAbsenceModalOpen] = useState(false);

  return (
    <section className="w-full max-w-[1240px] mb-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
          <span>⚠️</span> Límite de Faltas por Módulo (12% Currículo)
        </div>

        <div className="flex items-center gap-3">
          {absenceStats && (
            <span className="text-[11px] text-indigo-300 font-medium hidden sm:inline">
              Sincronizado con base de datos
            </span>
          )}
          <button
            type="button"
            onClick={() => setIsAbsenceModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold shadow-md shadow-amber-500/20 transition-all cursor-pointer"
          >
            <Plus size={14} /> Registrar Falta
          </button>
        </div>
      </div>

      <AddAbsenceModal
        isOpen={isAbsenceModalOpen}
        onClose={() => setIsAbsenceModalOpen(false)}
        onAbsenceAdded={onRefresh}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {modules.map((mod) => {
          const isSelected = activeFilter === mod.id;
          const isDimmed = activeFilter !== 'all' && !isSelected;
          const stat = absenceStats ? absenceStats[mod.id] : undefined;
          const hasAbsences = stat && stat.totalAbsenceHours > 0;

          return (
            <div
              key={mod.id}
              onClick={() => onSelectCategory(isSelected ? 'all' : mod.id)}
              className={`
                bg-slate-900/60 border rounded-2xl p-3.5 backdrop-blur-md flex flex-col justify-between gap-2.5 transition-all duration-200 cursor-pointer select-none
                ${
                  isSelected
                    ? `${mod.styles.borderColor} ${mod.styles.glowClass} -translate-y-1 bg-slate-900/90 ring-1 ring-white/20`
                    : 'border-white/[0.08] hover:border-white/25 hover:-translate-y-0.5'
                }
                ${isDimmed ? 'opacity-30 grayscale-[80%] scale-[0.98]' : 'opacity-100'}
              `}
            >
              <div className="flex justify-between items-start gap-2">
                <span className="text-xs sm:text-[13px] font-bold text-slate-100 leading-snug">
                  {mod.name}
                </span>
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-md border whitespace-nowrap ${mod.styles.badgeBg}`}
                >
                  {mod.weeklyHours}
                </span>
              </div>

              {/* Si hay faltas registradas, mostrar barra o indicador de uso */}
              {hasAbsences && (
                <div className="w-full bg-slate-950/60 p-2 rounded-xl border border-white/5 my-0.5">
                  <div className="flex justify-between items-center text-[11px] mb-1.5">
                    <span className="text-slate-400">
                      Consumido:{' '}
                      <strong
                        className={
                          stat.status === 'danger'
                            ? 'text-red-400'
                            : stat.status === 'warning'
                            ? 'text-amber-400'
                            : 'text-indigo-300'
                        }
                      >
                        {stat.totalAbsenceHours}h
                      </strong>
                    </span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                        stat.status === 'danger'
                          ? 'bg-red-500/20 text-red-300'
                          : stat.status === 'warning'
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-indigo-500/20 text-indigo-300'
                      }`}
                    >
                      {stat.percentageUsed}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        stat.status === 'danger'
                          ? 'bg-red-500'
                          : stat.status === 'warning'
                          ? 'bg-amber-500'
                          : 'bg-indigo-500'
                      }`}
                      style={{ width: `${stat.percentageUsed}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center text-xs text-slate-400 border-t border-white/[0.06] pt-2 mt-1">
                <span className="text-slate-400 font-medium">Total: {mod.totalHours}</span>
                <span className="text-red-400 font-bold inline-flex items-center gap-1">
                  Máx: {mod.maxAbsenceHours}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default memo(SummaryCardsComponent);
