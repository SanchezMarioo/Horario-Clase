import { SubjectModule, TimeSlot, FilterItem, SubjectId } from '@/types/schedule';

export const SUBJECT_MODULES: SubjectModule[] = [
  {
    id: 'sub-multimedia',
    name: 'Progr. Multimedia y Móviles',
    shortName: 'Móviles',
    filterLabel: '📱 Móviles',
    weeklyHours: '6h/sem',
    totalHours: '198h',
    maxAbsenceHours: '23,76h (~24h)',
    tableBadge: '⚠️ Máx 24h',
    styles: {
      textColor: 'text-purple-400',
      bgColor: 'bg-purple-500/[0.14]',
      borderColor: 'border-purple-400/25',
      hoverBorder: 'hover:border-purple-400/50',
      borderTopColor: 'bg-purple-400',
      badgeBg: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      glowClass: 'shadow-[0_0_25px_rgba(192,132,252,0.45)]',
    },
  },
  {
    id: 'sub-datos',
    name: 'Acceso a Datos',
    shortName: 'Datos',
    filterLabel: '🗄️ Datos',
    weeklyHours: '5h/sem',
    totalHours: '165h',
    maxAbsenceHours: '19,80h (~20h)',
    tableBadge: '⚠️ Máx 20h',
    styles: {
      textColor: 'text-emerald-400',
      bgColor: 'bg-emerald-500/[0.14]',
      borderColor: 'border-emerald-400/25',
      hoverBorder: 'hover:border-emerald-400/50',
      borderTopColor: 'bg-emerald-400',
      badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      glowClass: 'shadow-[0_0_25px_rgba(52,211,153,0.45)]',
    },
  },
  {
    id: 'sub-interfaces',
    name: 'Desarrollo de Interfaces',
    shortName: 'Interfaces',
    filterLabel: '💻 Interfaces',
    weeklyHours: '5h/sem',
    totalHours: '165h',
    maxAbsenceHours: '19,80h (~20h)',
    tableBadge: '⚠️ Máx 20h',
    styles: {
      textColor: 'text-amber-400',
      bgColor: 'bg-amber-500/[0.14]',
      borderColor: 'border-amber-400/25',
      hoverBorder: 'hover:border-amber-400/50',
      borderTopColor: 'bg-amber-400',
      badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      glowClass: 'shadow-[0_0_25px_rgba(251,191,36,0.45)]',
    },
  },
  {
    id: 'sub-gestion',
    name: 'Sistemas de Gestión Empresarial',
    shortName: 'SGE',
    filterLabel: '📊 SGE',
    weeklyHours: '5h/sem',
    totalHours: '165h',
    maxAbsenceHours: '19,80h (~20h)',
    tableBadge: '⚠️ Máx 20h',
    styles: {
      textColor: 'text-red-400',
      bgColor: 'bg-red-500/[0.14]',
      borderColor: 'border-red-400/25',
      hoverBorder: 'hover:border-red-400/50',
      borderTopColor: 'bg-red-400',
      badgeBg: 'bg-red-500/20 text-red-300 border-red-500/30',
      glowClass: 'shadow-[0_0_25px_rgba(248,113,113,0.45)]',
    },
  },
  {
    id: 'sub-servicios',
    name: 'Progr. Servicios y Procesos',
    shortName: 'Procesos',
    filterLabel: '⚡ Procesos',
    weeklyHours: '2h/sem',
    totalHours: '66h',
    maxAbsenceHours: '7,92h (~8h)',
    tableBadge: '⚠️ Máx 8h',
    styles: {
      textColor: 'text-orange-400',
      bgColor: 'bg-orange-500/[0.14]',
      borderColor: 'border-orange-400/25',
      hoverBorder: 'hover:border-orange-400/50',
      borderTopColor: 'bg-orange-400',
      badgeBg: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
      glowClass: 'shadow-[0_0_25px_rgba(251,146,60,0.45)]',
    },
  },
  {
    id: 'sub-ipe',
    name: 'Itin. Pers. Empleabilidad II',
    shortName: 'Empleabilidad',
    filterLabel: '💼 Empleabilidad',
    weeklyHours: '2h/sem',
    totalHours: '68h',
    maxAbsenceHours: '8,16h (~8h)',
    tableBadge: '⚠️ Máx 8h',
    styles: {
      textColor: 'text-teal-400',
      bgColor: 'bg-teal-500/[0.14]',
      borderColor: 'border-teal-400/25',
      hoverBorder: 'hover:border-teal-400/50',
      borderTopColor: 'bg-teal-400',
      badgeBg: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
      glowClass: 'shadow-[0_0_25px_rgba(45,212,191,0.45)]',
    },
  },
  {
    id: 'sub-nube',
    name: 'Computación en la Nube',
    shortName: 'Nube',
    filterLabel: '☁️ Nube',
    weeklyHours: '3h/sem',
    totalHours: '54h',
    maxAbsenceHours: '6,48h (~6h)',
    tableBadge: '⚠️ Máx 6h',
    styles: {
      textColor: 'text-sky-400',
      bgColor: 'bg-sky-500/[0.14]',
      borderColor: 'border-sky-400/25',
      hoverBorder: 'hover:border-sky-400/50',
      borderTopColor: 'bg-sky-400',
      badgeBg: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
      glowClass: 'shadow-[0_0_25px_rgba(56,189,248,0.45)]',
    },
  },
  {
    id: 'sub-digitalizacion',
    name: 'Dig. Apl. Sectores Productivos',
    shortName: 'Digitalización',
    filterLabel: '🤖 Digitalización',
    weeklyHours: '1h/sem',
    totalHours: '34h',
    maxAbsenceHours: '4,08h (~4h)',
    tableBadge: '⚠️ Máx 4h',
    styles: {
      textColor: 'text-indigo-400',
      bgColor: 'bg-indigo-500/[0.14]',
      borderColor: 'border-indigo-400/25',
      hoverBorder: 'hover:border-indigo-400/50',
      borderTopColor: 'bg-indigo-400',
      badgeBg: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
      glowClass: 'shadow-[0_0_25px_rgba(129,140,248,0.45)]',
    },
  },
  {
    id: 'sub-sostenibilidad',
    name: 'Sostenibilidad Apl. Sist. Prod.',
    shortName: 'Sostenibilidad',
    filterLabel: '🌱 Sostenibilidad',
    weeklyHours: '1h/sem',
    totalHours: '34h',
    maxAbsenceHours: '4,08h (~4h)',
    tableBadge: '⚠️ Máx 4h',
    styles: {
      textColor: 'text-slate-300',
      bgColor: 'bg-slate-400/[0.14]',
      borderColor: 'border-slate-300/25',
      hoverBorder: 'hover:border-slate-300/50',
      borderTopColor: 'bg-slate-300',
      badgeBg: 'bg-slate-500/20 text-slate-200 border-slate-400/30',
      glowClass: 'shadow-[0_0_25px_rgba(203,213,225,0.45)]',
    },
  },
];

export const SUBJECT_MAP: Record<SubjectId, SubjectModule> = SUBJECT_MODULES.reduce(
  (acc, mod) => {
    acc[mod.id] = mod;
    return acc;
  },
  {} as Record<SubjectId, SubjectModule>
);

export const SCHEDULE_TIME_SLOTS: TimeSlot[] = [
  // 08:30 - 09:20
  {
    type: 'class',
    time: '08:30 – 09:20',
    period: '1ª Hora',
    classes: {
      monday: {
        subjectId: 'sub-nube',
        title: 'Computación en la nube',
        badge: '⚠️ Máx 6h',
      },
      tuesday: {
        subjectId: 'sub-interfaces',
        title: 'Desarrollo de interfaces',
        badge: '⚠️ Máx 20h',
      },
      wednesday: {
        subjectId: 'sub-multimedia',
        title: 'Progr. Multim. y Móviles',
        badge: '⚠️ Máx 24h',
      },
      thursday: {
        subjectId: 'sub-multimedia',
        title: 'Progr. Multim. y Móviles',
        badge: '⚠️ Máx 24h',
      },
      friday: {
        subjectId: 'sub-gestion',
        title: 'Sis. Ges. Empresarial',
        badge: '⚠️ Máx 20h',
      },
    },
  },
  // 09:20 - 10:10
  {
    type: 'class',
    time: '09:20 – 10:10',
    period: '2ª Hora',
    classes: {
      monday: {
        subjectId: 'sub-ipe',
        title: 'Itin. pers. empleab. II',
        badge: '⚠️ Máx 8h',
      },
      tuesday: {
        subjectId: 'sub-interfaces',
        title: 'Desarrollo de interfaces',
        badge: '⚠️ Máx 20h',
      },
      wednesday: {
        subjectId: 'sub-multimedia',
        title: 'Progr. Multim. y Móviles',
        badge: '⚠️ Máx 24h',
      },
      thursday: {
        subjectId: 'sub-multimedia',
        title: 'Progr. Multim. y Móviles',
        badge: '⚠️ Máx 24h',
      },
      friday: {
        subjectId: 'sub-gestion',
        title: 'Sis. Ges. Empresarial',
        badge: '⚠️ Máx 20h',
      },
    },
  },
  // 10:10 - 10:35 - RECREO 1
  {
    type: 'break',
    time: '10:10 – 10:35',
    period: 'Pausa',
    label: '☕ R E C R E O',
    icon: '☕',
  },
  // 10:35 - 11:25
  {
    type: 'class',
    time: '10:35 – 11:25',
    period: '3ª Hora',
    classes: {
      monday: {
        subjectId: 'sub-gestion',
        title: 'Sis. Ges. Empresarial',
        badge: '⚠️ Máx 20h',
      },
      tuesday: {
        subjectId: 'sub-nube',
        title: 'Computación en la nube',
        badge: '⚠️ Máx 6h',
      },
      wednesday: {
        subjectId: 'sub-ipe',
        title: 'Itin. pers. empleab. II',
        badge: '⚠️ Máx 8h',
      },
      thursday: {
        subjectId: 'sub-digitalizacion',
        title: 'Dig. apl. sec. prod.',
        badge: '⚠️ Máx 4h',
      },
      friday: {
        subjectId: 'sub-multimedia',
        title: 'Progr. Multim. y Móviles',
        badge: '⚠️ Máx 24h',
      },
    },
  },
  // 11:25 - 12:15
  {
    type: 'class',
    time: '11:25 – 12:15',
    period: '4ª Hora',
    classes: {
      monday: {
        subjectId: 'sub-datos',
        title: 'Acceso a datos',
        badge: '⚠️ Máx 20h',
      },
      tuesday: {
        subjectId: 'sub-nube',
        title: 'Computación en la nube',
        badge: '⚠️ Máx 6h',
      },
      wednesday: {
        subjectId: 'sub-interfaces',
        title: 'Desarrollo de interfaces',
        badge: '⚠️ Máx 20h',
      },
      thursday: {
        subjectId: 'sub-datos',
        title: 'Acceso a datos',
        badge: '⚠️ Máx 20h',
      },
      friday: {
        subjectId: 'sub-multimedia',
        title: 'Progr. Multim. y Móviles',
        badge: '⚠️ Máx 24h',
      },
    },
  },
  // 12:15 - 12:40 - RECREO 2
  {
    type: 'break',
    time: '12:15 – 12:40',
    period: 'Pausa',
    label: '🥪 R E C R E O',
    icon: '🥪',
  },
  // 12:40 - 13:30
  {
    type: 'class',
    time: '12:40 – 13:30',
    period: '5ª Hora',
    classes: {
      monday: {
        subjectId: 'sub-datos',
        title: 'Acceso a datos',
        badge: '⚠️ Máx 20h',
      },
      tuesday: {
        subjectId: 'sub-gestion',
        title: 'Sis. Ges. Empresarial',
        badge: '⚠️ Máx 20h',
      },
      wednesday: {
        subjectId: 'sub-datos',
        title: 'Acceso a datos',
        badge: '⚠️ Máx 20h',
      },
      thursday: {
        subjectId: 'sub-servicios',
        title: 'Program. Serv. y Procesos',
        badge: '⚠️ Máx 8h',
      },
      friday: {
        subjectId: 'sub-interfaces',
        title: 'Desarrollo de interfaces',
        badge: '⚠️ Máx 20h',
      },
    },
  },
  // 13:30 - 14:20
  {
    type: 'class',
    time: '13:30 – 14:20',
    period: '6ª Hora',
    classes: {
      monday: {
        subjectId: 'sub-sostenibilidad',
        title: 'Sostenib. apl. sist. prod.',
        badge: '⚠️ Máx 4h',
      },
      tuesday: {
        subjectId: 'sub-gestion',
        title: 'Sis. Ges. Empresarial',
        badge: '⚠️ Máx 20h',
      },
      wednesday: {
        subjectId: 'sub-datos',
        title: 'Acceso a datos',
        badge: '⚠️ Máx 20h',
      },
      thursday: {
        subjectId: 'sub-servicios',
        title: 'Program. Serv. y Procesos',
        badge: '⚠️ Máx 8h',
      },
      friday: {
        subjectId: 'sub-interfaces',
        title: 'Desarrollo de interfaces',
        badge: '⚠️ Máx 20h',
      },
    },
  },
];

export const FILTER_ITEMS: FilterItem[] = [
  { id: 'all', label: 'Todas las asignaturas' },
  { id: 'sub-multimedia', label: '📱 Móviles' },
  { id: 'sub-datos', label: '🗄️ Datos' },
  { id: 'sub-interfaces', label: '💻 Interfaces' },
  { id: 'sub-gestion', label: '📊 SGE' },
  { id: 'sub-nube', label: '☁️ Nube' },
  { id: 'sub-servicios', label: '⚡ Procesos' },
  { id: 'sub-ipe', label: '💼 Empleabilidad' },
  { id: 'sub-digitalizacion', label: '🤖 Digitalización' },
  { id: 'sub-sostenibilidad', label: '🌱 Sostenibilidad' },
];
