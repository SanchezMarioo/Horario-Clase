import React from 'react';
import { TimeSlot, SubjectId } from '@/types/schedule';
import { SUBJECT_MAP } from '@/data/scheduleData';

interface ScheduleTableProps {
  slots: TimeSlot[];
  activeFilter: 'all' | SubjectId;
  onSelectCategory: (categoryId: 'all' | SubjectId) => void;
}

export default function ScheduleTable({
  slots,
  activeFilter,
  onSelectCategory,
}: ScheduleTableProps) {
  return (
    <main className="w-full max-w-[1240px] bg-slate-900/75 border border-white/[0.08] rounded-3xl backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)] p-3 sm:p-5 overflow-hidden">
      <div className="w-full overflow-x-auto">
        <table className="w-full border-separate border-spacing-2 min-w-[860px]">
          <thead>
            <tr>
              <th className="w-[130px] p-3 text-xs font-bold uppercase tracking-wider text-slate-500 bg-white/[0.02] rounded-xl border border-white/[0.04]">
                Horario
              </th>
              {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'].map((day) => (
                <th
                  key={day}
                  className="p-3 text-xs font-bold uppercase tracking-wider text-slate-400 bg-white/[0.02] rounded-xl border border-white/[0.04]"
                >
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slots.map((slot, index) => {
              if (slot.type === 'break') {
                return (
                  <tr key={`break-${index}`}>
                    <td className="p-0">
                      <div className="py-2.5 px-2 text-xs font-bold text-slate-500 bg-white/[0.02] rounded-xl border border-white/[0.04] flex flex-col items-center gap-0.5">
                        <span>{slot.time}</span>
                        <span className="text-[11px] text-slate-600 font-medium">{slot.period}</span>
                      </div>
                    </td>
                    <td colSpan={5} className="p-0">
                      <div className="recreo-stripes py-3 px-4 rounded-xl border border-dashed border-white/10 text-slate-500 text-xs font-bold tracking-[3px] uppercase text-center flex items-center justify-center gap-2">
                        <span>{slot.label}</span>
                      </div>
                    </td>
                  </tr>
                );
              }

              // Regular class row
              const days: (keyof typeof slot.classes)[] = [
                'monday',
                'tuesday',
                'wednesday',
                'thursday',
                'friday',
              ];

              return (
                <tr key={`class-${index}`}>
                  <td className="p-0">
                    <div className="py-3 px-2 text-xs font-bold text-slate-400 bg-white/[0.02] rounded-xl border border-white/[0.04] flex flex-col items-center gap-0.5">
                      <span>{slot.time}</span>
                      <span className="text-[11px] text-slate-500 font-medium">{slot.period}</span>
                    </div>
                  </td>
                  {days.map((dayKey) => {
                    const item = slot.classes[dayKey];
                    const mod = SUBJECT_MAP[item.subjectId];
                    const isSelected = activeFilter === item.subjectId;
                    const isDimmed = activeFilter !== 'all' && !isSelected;

                    return (
                      <td key={dayKey} className="p-0 align-middle">
                        <div
                          onClick={() =>
                            onSelectCategory(isSelected ? 'all' : item.subjectId)
                          }
                          className={`
                            relative flex flex-col justify-center items-center p-2.5 rounded-xl min-h-[68px] border transition-all duration-200 cursor-pointer gap-1 select-none overflow-hidden
                            ${mod.styles.bgColor} ${mod.styles.textColor}
                            before:content-[''] before:absolute before:top-0 before:left-0 before:right-0 before:h-[2px] before:bg-current before:opacity-70
                            ${
                              isSelected
                                ? `scale-105 z-20 ${mod.styles.borderColor} ${mod.styles.glowClass} ring-1 ring-white/30`
                                : `${mod.styles.borderColor} hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-lg hover:z-10`
                            }
                            ${isDimmed ? 'opacity-20 grayscale-[80%] scale-[0.97]' : 'opacity-100'}
                          `}
                        >
                          <span className="text-[13px] font-bold text-center leading-tight">
                            {item.title}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/40 border border-white/10 text-white/90 tracking-tight whitespace-nowrap">
                            {item.badge}
                          </span>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </main>
  );
}
