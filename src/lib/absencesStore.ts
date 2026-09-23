import { prisma } from './prisma';
import {
  AbsenceRecord,
  CreateAbsenceInput,
  ModuleAbsenceStats,
  StudentAbsenceSummary,
} from '@/types/absence';
import { SUBJECT_MODULES } from '@/data/scheduleData';
import { SubjectId } from '@/types/schedule';
import { calculateModuleStatsFromRecords } from './absenceStats';

// Límite de faltas numérico exacto (12% del currículo) por módulo
export const MODULE_LIMITS: Record<SubjectId, number> = {
  'sub-multimedia': 23.76,
  'sub-datos': 19.8,
  'sub-interfaces': 19.8,
  'sub-gestion': 19.8,
  'sub-servicios': 7.92,
  'sub-ipe': 8.16,
  'sub-nube': 6.48,
  'sub-digitalizacion': 4.08,
  'sub-sostenibilidad': 4.08,
};

export async function readAbsences(userId?: string): Promise<AbsenceRecord[]> {
  try {
    const absences = await prisma.absence.findMany({
      where: userId ? { userId } : undefined,
      orderBy: { date: 'desc' },
    });

    return absences.map((a) => ({
      id: a.id,
      subjectId: a.subjectId as SubjectId,
      date: a.date,
      hours: a.hours,
      justified: a.justified,
      notes: a.notes ?? undefined,
      createdAt: a.createdAt.toISOString(),
      createdBy: a.userId ?? undefined,
      createdByName: a.userName ?? undefined,
      createdByEmail: a.userEmail ?? undefined,
    }));
  } catch (error) {
    console.error('Error querying absences from database:', error);
    return [];
  }
}

export async function createAbsence(
  input: CreateAbsenceInput,
  userId?: string,
  userName?: string,
  userEmail?: string
): Promise<AbsenceRecord> {
  const created = await prisma.absence.create({
    data: {
      subjectId: input.subjectId,
      date: input.date,
      hours: input.hours,
      justified: input.justified,
      notes: input.notes,
      userId,
      userName,
      userEmail,
    },
  });

  return {
    id: created.id,
    subjectId: created.subjectId as SubjectId,
    date: created.date,
    hours: created.hours,
    justified: created.justified,
    notes: created.notes ?? undefined,
    createdAt: created.createdAt.toISOString(),
    createdBy: created.userId ?? undefined,
    createdByName: created.userName ?? undefined,
    createdByEmail: created.userEmail ?? undefined,
  };
}

export async function deleteAbsenceById(id: string): Promise<boolean> {
  try {
    await prisma.absence.delete({
      where: { id },
    });
    return true;
  } catch (error) {
    console.error('Error deleting absence:', error);
    return false;
  }
}

export async function calculateAbsenceStats(
  userId?: string | null,
  allUsers = false
): Promise<ModuleAbsenceStats[]> {
  const records = allUsers
    ? await readAbsences()
    : userId
    ? await readAbsences(userId)
    : [];

  return calculateModuleStatsFromRecords(records);
}

/**
 * Agrupa las faltas por cada alumno individual y calcula de manera independiente
 * sus estadísticas individuales frente al límite del 12%.
 */
export async function getStudentSummaries(): Promise<StudentAbsenceSummary[]> {
  try {
    const allRecords = await readAbsences();
    const studentMap = new Map<string, AbsenceRecord[]>();

    for (const record of allRecords) {
      const studentKey = record.createdBy || record.createdByEmail || 'anonimo';
      if (!studentMap.has(studentKey)) {
        studentMap.set(studentKey, []);
      }
      studentMap.get(studentKey)!.push(record);
    }

    const summaries: StudentAbsenceSummary[] = [];

    for (const [key, studentRecords] of studentMap.entries()) {
      const first = studentRecords[0];
      const stats = calculateModuleStatsFromRecords(studentRecords);
      const totalHours = Number(
        studentRecords.reduce((sum, r) => sum + r.hours, 0).toFixed(2)
      );
      const justifiedHours = Number(
        studentRecords
          .filter((r) => r.justified)
          .reduce((sum, r) => sum + r.hours, 0)
          .toFixed(2)
      );
      const unjustifiedHours = Number((totalHours - justifiedHours).toFixed(2));
      const riskCount = stats.filter((s) => s.status === 'danger').length;
      const alertCount = stats.filter((s) => s.status === 'warning').length;

      summaries.push({
        userId: first.createdBy || key,
        userName: first.createdByName || 'Estudiante',
        userEmail: first.createdByEmail || '',
        totalHours,
        justifiedHours,
        unjustifiedHours,
        riskCount,
        alertCount,
        totalRecords: studentRecords.length,
        stats,
      });
    }

    // Ordenar de mayor a menor número de faltas para priorizar alertas
    return summaries.sort((a, b) => b.totalHours - a.totalHours);
  } catch (error) {
    console.error('Error computing student summaries:', error);
    return [];
  }
}

