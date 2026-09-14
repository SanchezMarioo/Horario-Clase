import { SubjectId } from './schedule';

export type CalendarEventType = 'exam' | 'assignment' | 'project' | 'reminder';
export type EventPriority = 'low' | 'medium' | 'high';

export interface AcademicEvent {
  id: string;
  title: string;
  type: CalendarEventType;
  subjectId: SubjectId | 'general';
  date: string; // Formato AAAA-MM-DD
  time?: string; // Formato HH:mm
  description?: string;
  priority: EventPriority;
  completed: boolean;
  isOfficial: boolean;
  authorId?: string;
  authorName?: string;
  authorEmail?: string;
  createdAt: string;
  updatedAt: string;
}

export type CreateEventInput = {
  title: string;
  type: CalendarEventType;
  subjectId: SubjectId | 'general';
  date: string;
  time?: string;
  description?: string;
  priority: EventPriority;
  isOfficial?: boolean;
};
