import { AbsenceRecord, ModuleAbsenceStats } from '@/types/absence';
import { SubjectModule } from '@/types/schedule';
import { SUBJECT_MODULES } from '@/data/scheduleData';
import { MODULE_LIMITS } from './absencesStore';

/**
 * Calcula de forma pura las estadísticas de cada módulo a partir de un listado de faltas.
 * Compartido entre servidor y cliente para asegurar cálculos consistentes.
 */
export function calculateModuleStatsFromRecords(
  records: AbsenceRecord[],
  modules: SubjectModule[] = SUBJECT_MODULES
): ModuleAbsenceStats[] {
  return modules.map((mod) => {
    const modRecords = records.filter((r) => r.subjectId === mod.id);
    const totalAbsenceHours = modRecords.reduce((sum, r) => sum + r.hours, 0);
    const justifiedHours = modRecords
      .filter((r) => r.justified)
      .reduce((sum, r) => sum + r.hours, 0);
    const unjustifiedHours = totalAbsenceHours - justifiedHours;

    const maxAllowed = MODULE_LIMITS[mod.id] || 20;
    const remainingHours = Math.max(0, Number((maxAllowed - totalAbsenceHours).toFixed(2)));
    const percentageUsed = Math.min(
      100,
      Number(((totalAbsenceHours / maxAllowed) * 100).toFixed(1))
    );

    let status: 'safe' | 'warning' | 'danger' = 'safe';
    if (percentageUsed >= 80) {
      status = 'danger';
    } else if (percentageUsed >= 50) {
      status = 'warning';
    }

    return {
      subjectId: mod.id,
      name: mod.name,
      shortName: mod.shortName,
      maxAllowedHours: maxAllowed,
      totalAbsenceHours: Number(totalAbsenceHours.toFixed(2)),
      justifiedHours: Number(justifiedHours.toFixed(2)),
      unjustifiedHours: Number(unjustifiedHours.toFixed(2)),
      remainingHours,
      percentageUsed,
      status,
    };
  });
}
