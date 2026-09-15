'use client';

import React from 'react';
import { Table2, Calendar, ShieldCheck } from 'lucide-react';

export type AdminSection = 'faltas' | 'calendario' | 'admins';

interface AdminTabsProps {
  activeSection: AdminSection;
  onSectionChange: (section: AdminSection) => void;
  eventCount: number;
  adminCount: number;
  pendingRequestCount: number;
}

export default function AdminTabs({
  activeSection,
  onSectionChange,
  eventCount,
  adminCount,
  pendingRequestCount,
}: AdminTabsProps) {
  return (
    <nav aria-label="Secciones del Panel de Administración" className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-900/80 border border-white/10 backdrop-blur-xl w-fit">
      <button
        type="button"
        onClick={() => onSectionChange('faltas')}
        className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
          activeSection === 'faltas'
            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
            : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
        }`}
      >
        <Table2 size={16} /> Control de Faltas (12%)
      </button>

      <button
        type="button"
        onClick={() => onSectionChange('calendario')}
        className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
          activeSection === 'calendario'
            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
            : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
        }`}
      >
        <Calendar size={16} /> Gestión del Calendario y Exámenes
        <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/10 text-white">
          {eventCount}
        </span>
      </button>

      <button
        type="button"
        onClick={() => onSectionChange('admins')}
        className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
          activeSection === 'admins'
            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
            : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
        }`}
      >
        <ShieldCheck size={16} /> Administradores
        {pendingRequestCount > 0 && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500 text-black font-extrabold animate-pulse">
            {pendingRequestCount}
          </span>
        )}
        <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/10 text-white">
          {adminCount}
        </span>
      </button>
    </nav>
  );
}
