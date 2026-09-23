'use client';

import React from 'react';
import { Calendar, CheckCircle2, Trash2 } from 'lucide-react';
import { AbsenceRecord } from '@/types/absence';
import { SubjectId } from '@/types/schedule';
import { SUBJECT_MODULES } from '@/data/scheduleData';

interface AbsenceHistoryTableProps {
  records: AbsenceRecord[];
  selectedFilter: 'all' | SubjectId;
  onFilterChange: (filter: 'all' | SubjectId) => void;
  selectedStudent?: string;
  onStudentChange?: (student: string) => void;
  studentsList?: { key: string; label: string }[];
  onDeleteAbsence: (id: string, subjectName: string) => void;
  deletingIds: Set<string>;
  isPending: boolean;
  showStudentColumn?: boolean;
}

export default function AbsenceHistoryTable({
  records,
  selectedFilter,
  onFilterChange,
  selectedStudent = 'all',
  onStudentChange,
  studentsList = [],
  onDeleteAbsence,
  deletingIds,
  isPending,
  showStudentColumn = true,
}: AbsenceHistoryTableProps) {
  const filteredRecords = records.filter((r) => {
    const matchesSubject =
      selectedFilter === 'all' || r.subjectId === selectedFilter;
    const studentKey = r.createdBy || r.createdByEmail || 'anonimo';
    const matchesStudent =
      !onStudentChange ||
      selectedStudent === 'all' ||
      studentKey === selectedStudent ||
      r.createdByEmail === selectedStudent;
    return matchesSubject && matchesStudent;
  });

  return (
    <div className="bg-slate-900/60 border border-white/[0.08] p-5 rounded-3xl backdrop-blur-xl flex flex-col justify-between">
      <div>
        <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Calendar size={18} className="text-indigo-400" /> Historial de Faltas ({filteredRecords.length})
          </h2>

          <div className="flex flex-wrap items-center gap-2">
            {studentsList.length > 0 && onStudentChange && (
              <select
                value={selectedStudent}
                onChange={(e) => onStudentChange(e.target.value)}
                className="bg-slate-950 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
              >
                <option value="all">Todos los alumnos</option>
                {studentsList.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.label}
                  </option>
                ))}
              </select>
            )}

            <select
              value={selectedFilter}
              onChange={(e) => onFilterChange(e.target.value as 'all' | SubjectId)}
              className="bg-slate-950 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">Todas las asignaturas</option>
              {SUBJECT_MODULES.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.shortName}
                </option>
              ))}
            </select>
          </div>
        </div>

        {filteredRecords.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs flex flex-col items-center gap-2">
            <CheckCircle2 size={32} className="text-slate-600" />
            <span>No hay faltas que coincidan con los filtros seleccionados.</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/[0.06] text-slate-400 font-semibold">
                  <th className="pb-2.5 pl-2">Fecha</th>
                  {showStudentColumn && <th className="pb-2.5">Alumno</th>}
                  <th className="pb-2.5">Módulo</th>
                  <th className="pb-2.5 text-center">Horas</th>
                  <th className="pb-2.5 text-center">Estado</th>
                  <th className="pb-2.5">Motivo</th>
                  <th className="pb-2.5 text-right pr-2">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filteredRecords.map((r) => {
                  const mod = SUBJECT_MODULES.find((m) => m.id === r.subjectId);
                  const isBeingDeleted = deletingIds.has(r.id);

                  return (
                    <tr key={r.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-2.5 pl-2 font-medium text-slate-300 whitespace-nowrap">
                        {r.date}
                      </td>
                      {showStudentColumn && (
                        <td className="py-2.5 text-slate-300">
                          <span className="font-semibold block truncate max-w-[130px]">
                            {r.createdByName || 'Estudiante'}
                          </span>
                          <span className="text-[10px] text-slate-500 block truncate max-w-[130px]">
                            {r.createdByEmail || ''}
                          </span>
                        </td>
                      )}
                      <td className="py-2.5 font-bold text-white">
                        <span className="text-xs">{mod?.shortName || r.subjectId}</span>
                      </td>
                      <td className="py-2.5 text-center font-bold text-white">
                        {r.hours}h
                      </td>
                      <td className="py-2.5 text-center">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            r.justified
                              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                              : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {r.justified ? 'Justificada' : 'Injustificada'}
                        </span>
                      </td>
                      <td className="py-2.5 text-slate-400 max-w-[150px] truncate">
                        {r.notes || '—'}
                      </td>
                      <td className="py-2.5 text-right pr-2">
                        <button
                          type="button"
                          onClick={() => onDeleteAbsence(r.id, mod?.shortName || r.subjectId)}
                          disabled={isPending || isBeingDeleted}
                          title="Eliminar falta"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer disabled:opacity-30"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
