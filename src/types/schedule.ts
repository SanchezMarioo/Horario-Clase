export type SubjectId =
  | 'sub-multimedia'
  | 'sub-datos'
  | 'sub-interfaces'
  | 'sub-gestion'
  | 'sub-servicios'
  | 'sub-ipe'
  | 'sub-nube'
  | 'sub-digitalizacion'
  | 'sub-sostenibilidad';

export interface SubjectModule {
  id: SubjectId;
  name: string;
  shortName: string;
  filterLabel: string;
  weeklyHours: string;
  totalHours: string;
  maxAbsenceHours: string;
  tableBadge: string;
  // Styling properties for Tailwind
  styles: {
    textColor: string;
    bgColor: string;
    borderColor: string;
    hoverBorder: string;
    borderTopColor: string;
    badgeBg: string;
    glowClass: string;
  };
}

export interface ScheduleClassItem {
  subjectId: SubjectId;
  title: string;
  badge: string;
}

export interface RegularTimeSlot {
  type: 'class';
  time: string;
  period: string;
  classes: {
    monday: ScheduleClassItem;
    tuesday: ScheduleClassItem;
    wednesday: ScheduleClassItem;
    thursday: ScheduleClassItem;
    friday: ScheduleClassItem;
  };
}

export interface BreakTimeSlot {
  type: 'break';
  time: string;
  period: string;
  label: string;
  icon: string;
}

export type TimeSlot = RegularTimeSlot | BreakTimeSlot;

export interface FilterItem {
  id: 'all' | SubjectId;
  label: string;
}
