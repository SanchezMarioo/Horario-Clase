'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import SummaryCards from '@/components/SummaryCards';
import FilterBar from '@/components/FilterBar';
import ScheduleTable from '@/components/ScheduleTable';
import FooterStats from '@/components/FooterStats';
import UpcomingEventsWidget from '@/components/calendar/UpcomingEventsWidget';
import CalendarMonthView from '@/components/calendar/CalendarMonthView';
import {
  SUBJECT_MODULES,
  SCHEDULE_TIME_SLOTS,
  FILTER_ITEMS,
} from '@/data/scheduleData';
import { SubjectId } from '@/types/schedule';
import { ModuleAbsenceStats } from '@/types/absence';
import { AcademicEvent } from '@/types/calendar';
import { getPublicStatsAction } from '@/app/actions/absences';
import { getEventsAction, getUpcomingEventsAction } from '@/app/actions/calendar';
import { checkIsAdminAction } from '@/app/actions/admins';
import { Calendar, Table2 } from 'lucide-react';

export default function SchedulePage() {
  const [activeTab, setActiveTab] = useState<'horario' | 'calendario'>('horario');
  const [activeFilter, setActiveFilter] = useState<'all' | SubjectId>('all');
  const [absenceStatsMap, setAbsenceStatsMap] = useState<
    Record<SubjectId, ModuleAbsenceStats> | undefined
  >(undefined);
  const [allEvents, setAllEvents] = useState<AcademicEvent[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<AcademicEvent[]>([]);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  const loadData = async () => {
    // 1. Estadísticas de faltas
    const absRes = await getPublicStatsAction();
    if (absRes.success && absRes.data) {
      const mapping = absRes.data.reduce((acc, stat) => {
        acc[stat.subjectId] = stat;
        return acc;
      }, {} as Record<SubjectId, ModuleAbsenceStats>);
      setAbsenceStatsMap(mapping);
    }

    // 2. Próximos eventos
    const upRes = await getUpcomingEventsAction(6);
    if (upRes.success && upRes.data) {
      setUpcomingEvents(upRes.data);
    }

    // 3. Todos los eventos del calendario
    const allRes = await getEventsAction();
    if (allRes.success && allRes.data) {
      setAllEvents(allRes.data);
    }

    // 4. Verificación de permisos de administrador
    const adminCheck = await checkIsAdminAction();
    setIsAdmin(adminCheck.isAdmin);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectCategory = (categoryId: 'all' | SubjectId) => {
    setActiveFilter(categoryId);
  };

  return (
    <div className="w-full flex flex-col items-center">
      {/* Encabezado con acceso de usuario y panel */}
      <Header />

      {/* Selector de Pestañas: Horario vs Calendario */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-900/80 border border-white/10 mb-6 backdrop-blur-xl">
        <button
          type="button"
          onClick={() => setActiveTab('horario')}
          className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'horario'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          <Table2 size={16} /> Horario Semanal
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('calendario')}
          className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'calendario'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          <Calendar size={16} /> Calendario de Exámenes y Tareas
          {upcomingEvents.length > 0 && (
            <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
          )}
        </button>
      </div>

      {activeTab === 'horario' ? (
        <>
          {/* Widget superior de próximos exámenes y tareas (Solo admin puede añadir) */}
          <UpcomingEventsWidget
            events={upcomingEvents}
            onRefresh={loadData}
            isAdmin={isAdmin}
          />

          {/* Resumen de límites de faltas sincronizado con ausencias */}
          <SummaryCards
            modules={SUBJECT_MODULES}
            activeFilter={activeFilter}
            onSelectCategory={handleSelectCategory}
            absenceStats={absenceStatsMap}
            onRefresh={loadData}
          />

          {/* Barra de Filtros */}
          <FilterBar
            filters={FILTER_ITEMS}
            activeFilter={activeFilter}
            onSelectCategory={handleSelectCategory}
          />

          {/* Tabla del Horario Semanal */}
          <ScheduleTable
            slots={SCHEDULE_TIME_SLOTS}
            activeFilter={activeFilter}
            onSelectCategory={handleSelectCategory}
          />
        </>
      ) : (
        /* Vista de Calendario Mensual Completo */
        <CalendarMonthView
          events={allEvents}
          onRefresh={loadData}
          isAdmin={isAdmin}
        />
      )}

      {/* Pie de página con estadísticas */}
      <FooterStats />
    </div>
  );
}
