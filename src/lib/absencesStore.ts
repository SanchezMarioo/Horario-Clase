import { prisma } from './prisma';
import { AbsenceRecord, CreateAbsenceInput, ModuleAbsenceStats } from '@/types/absence';
import { SUBJECT_MODULES } from '@/data/scheduleData';
import { SubjectId } from '@/types/schedule';

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

  return SUBJECT_MODULES.map((mod) => {
    const modRecords = records.filter((r) => r.subjectId === mod.id);
    const totalAbsenceHours = modRecords.reduce((sum, r) => sum + r.hours, 0);
    const justifiedHours = modRecords
      .filter((r) => r.justified)
      .reduce((sum, r) => sum + r.hours, 0);
    const unjustifiedHours = totalAbsenceHours - justifiedHours;

    const maxAllowed = MODULE_LIMITS[mod.id];
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
