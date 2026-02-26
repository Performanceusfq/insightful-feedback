export type AppRole = 'estudiante' | 'profesor' | 'admin' | 'coordinador' | 'director';

export interface User {
  id: string;
  email: string;
  name: string;
  roles: AppRole[];
  activeRole: AppRole;
  departmentId?: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  coordinatorId?: string;
}

export interface Professor {
  id: string;
  userId: string;
  name: string;
  email: string;
  departmentId: string;
}

export interface Course {
  id: string;
  name: string;
  code: string;
  departmentId: string;
  professorId: string;
  semester: string;
}

export interface UserRole {
  id: string;
  userId: string;
  role: AppRole;
}

// Sprint 2 – Banco de Preguntas

export type QuestionType = 'likert' | 'open' | 'multiple_choice';

export type QuestionCategory = 'pedagogia' | 'contenido' | 'evaluacion' | 'comunicacion' | 'general';

export const questionTypeLabels: Record<QuestionType, string> = {
  likert: 'Escala Likert',
  open: 'Respuesta Abierta',
  multiple_choice: 'Opción Múltiple',
};

export const questionCategoryLabels: Record<QuestionCategory, string> = {
  pedagogia: 'Pedagogía',
  contenido: 'Contenido',
  evaluacion: 'Evaluación',
  comunicacion: 'Comunicación',
  general: 'General',
};

export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  category: QuestionCategory;
  options?: string[]; // for multiple_choice
  likertScale?: number; // default 5
  required: boolean;
  active: boolean;
}

export interface SurveyConfig {
  id: string;
  courseId: string;
  name: string;
  fixedQuestionIds: string[];
  randomPool: {
    questionIds: string[];
    count: number; // how many random questions to pick
  };
  active: boolean;
}

// Sprint 3 – Eventos de Clase & QR

export type EventFrequency = 'per_class' | 'weekly' | 'biweekly' | 'monthly' | 'manual';

export const eventFrequencyLabels: Record<EventFrequency, string> = {
  per_class: 'Cada clase',
  weekly: 'Semanal',
  biweekly: 'Quincenal',
  monthly: 'Mensual',
  manual: 'Manual',
};

export type EventStatus = 'scheduled' | 'active' | 'expired' | 'cancelled';

export const eventStatusLabels: Record<EventStatus, string> = {
  scheduled: 'Programado',
  active: 'Activo',
  expired: 'Expirado',
  cancelled: 'Cancelado',
};

export interface ClassEventConfig {
  id: string;
  courseId: string;
  surveyConfigId: string;
  frequency: EventFrequency;
  expirationMinutes: number; // QR expiration time
  scheduledDays: number[]; // 0=Sun ... 6=Sat
  scheduledTime: string; // HH:mm
  active: boolean;
}

export interface ClassEvent {
  id: string;
  configId: string;
  courseId: string;
  qrCode: string; // unique token for QR
  status: EventStatus;
  createdAt: string; // ISO timestamp
  expiresAt: string; // ISO timestamp
  responsesCount: number;
}
