import { SubjectId } from './schedule';

export interface AbsenceRecord {
  id: string;
  subjectId: SubjectId;
  date: string; // Formato YYYY-MM-DD
  hours: number;
  justified: boolean;
  notes?: string;
  createdAt: string;
  createdBy?: string; // Clerk userId
  createdByName?: string;
  createdByEmail?: string;
}

export type CreateAbsenceInput = Omit<AbsenceRecord, 'id' | 'createdAt' | 'createdBy'>;

export interface ModuleAbsenceStats {
  subjectId: SubjectId;
  name: string;
  shortName: string;
  maxAllowedHours: number;
  totalAbsenceHours: number;
  justifiedHours: number;
  unjustifiedHours: number;
  remainingHours: number;
  percentageUsed: number;
  status: 'safe' | 'warning' | 'danger'; // safe < 50%, warning 50-80%, danger > 80%
}
