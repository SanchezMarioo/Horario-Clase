import React from 'react';
import { FilterItem, SubjectId } from '@/types/schedule';

interface FilterBarProps {
  filters: FilterItem[];
  activeFilter: 'all' | SubjectId;
  onSelectCategory: (categoryId: 'all' | SubjectId) => void;
}

export default function FilterBar({
  filters,
  activeFilter,
  onSelectCategory,
}: FilterBarProps) {
  return (
    <nav aria-label="Filtros de asignaturas" className="flex flex-wrap justify-center gap-2 mb-6 max-w-[1240px] w-full">
      {filters.map((filter) => {
        const isActive = activeFilter === filter.id;

        return (
          <button
            key={filter.id}
            type="button"
            onClick={() => onSelectCategory(isActive && filter.id !== 'all' ? 'all' : filter.id)}
            className={`
              px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 backdrop-blur-sm border
              ${
                isActive
                  ? 'bg-indigo-600 border-indigo-400 text-white shadow-[0_4px_15px_rgba(99,102,241,0.4)] scale-105'
                  : 'bg-white/[0.04] border-white/[0.08] text-slate-400 hover:bg-white/[0.08] hover:text-white hover:border-white/20'
              }
            `}
          >
            {filter.label}
          </button>
        );
      })}
    </nav>
  );
}
