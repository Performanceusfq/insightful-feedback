import { QuestionCategory, questionCategoryLabels } from '@/types/domain';

// ─── Department-level analytics ───

export interface ProfessorRanking {
  professorId: string;
  professorName: string;
  departmentId: string;
  avgScore: number;
  totalResponses: number;
  coursesCount: number;
  trend: 'up' | 'down' | 'stable';
  categoryScores: Record<QuestionCategory, number>;
}

export const mockProfessorRankings: ProfessorRanking[] = [
  {
    professorId: 'p1', professorName: 'Dr. Carlos Mendoza', departmentId: 'd1',
    avgScore: 4.12, totalResponses: 312, coursesCount: 1, trend: 'up',
    categoryScores: { pedagogia: 4.11, contenido: 3.86, evaluacion: 4.27, comunicacion: 3.93, general: 4.36 },
  },
  {
    professorId: 'p2', professorName: 'Dra. Ana López', departmentId: 'd1',
    avgScore: 3.85, totalResponses: 274, coursesCount: 1, trend: 'stable',
    categoryScores: { pedagogia: 3.68, contenido: 3.89, evaluacion: 4.11, comunicacion: 3.75, general: 3.80 },
  },
  {
    professorId: 'p3', professorName: 'Dr. Roberto Sánchez', departmentId: 'd2',
    avgScore: 4.35, totalResponses: 198, coursesCount: 1, trend: 'up',
    categoryScores: { pedagogia: 4.50, contenido: 4.20, evaluacion: 4.40, comunicacion: 4.30, general: 4.35 },
  },
  {
    professorId: 'p4', professorName: 'Dra. María García', departmentId: 'd3',
    avgScore: 3.65, totalResponses: 156, coursesCount: 1, trend: 'down',
    categoryScores: { pedagogia: 3.50, contenido: 3.80, evaluacion: 3.70, comunicacion: 3.55, general: 3.70 },
  },
];

// ─── Department summary ───

export interface DepartmentSummary {
  departmentId: string;
  departmentName: string;
  avgScore: number;
  totalResponses: number;
  professorsCount: number;
  coursesCount: number;
  participationRate: number; // percentage
  trend: 'up' | 'down' | 'stable';
  monthlyScores: { month: string; score: number }[];
  categoryScores: Record<QuestionCategory, number>;
}

export const mockDepartmentSummaries: DepartmentSummary[] = [
  {
    departmentId: 'd1', departmentName: 'Ingeniería de Software',
    avgScore: 3.99, totalResponses: 586, professorsCount: 2, coursesCount: 2,
    participationRate: 82, trend: 'up',
    monthlyScores: [
      { month: 'Sep', score: 3.7 }, { month: 'Oct', score: 3.8 }, { month: 'Nov', score: 3.9 },
      { month: 'Dic', score: 4.0 }, { month: 'Ene', score: 4.1 }, { month: 'Feb', score: 4.0 },
    ],
    categoryScores: { pedagogia: 3.90, contenido: 3.88, evaluacion: 4.19, comunicacion: 3.84, general: 4.08 },
  },
  {
    departmentId: 'd2', departmentName: 'Ciencias de la Computación',
    avgScore: 4.35, totalResponses: 198, professorsCount: 1, coursesCount: 1,
    participationRate: 78, trend: 'up',
    monthlyScores: [
      { month: 'Sep', score: 4.0 }, { month: 'Oct', score: 4.1 }, { month: 'Nov', score: 4.2 },
      { month: 'Dic', score: 4.3 }, { month: 'Ene', score: 4.4 }, { month: 'Feb', score: 4.35 },
    ],
    categoryScores: { pedagogia: 4.50, contenido: 4.20, evaluacion: 4.40, comunicacion: 4.30, general: 4.35 },
  },
  {
    departmentId: 'd3', departmentName: 'Matemáticas Aplicadas',
    avgScore: 3.65, totalResponses: 156, professorsCount: 1, coursesCount: 1,
    participationRate: 65, trend: 'down',
    monthlyScores: [
      { month: 'Sep', score: 3.9 }, { month: 'Oct', score: 3.8 }, { month: 'Nov', score: 3.7 },
      { month: 'Dic', score: 3.6 }, { month: 'Ene', score: 3.65 }, { month: 'Feb', score: 3.65 },
    ],
    categoryScores: { pedagogia: 3.50, contenido: 3.80, evaluacion: 3.70, comunicacion: 3.55, general: 3.70 },
  },
];

// ─── Institutional KPIs ───

export interface InstitutionalKPI {
  label: string;
  value: number;
  previousValue: number;
  unit: string;
}

export const mockInstitutionalKPIs: InstitutionalKPI[] = [
  { label: 'Puntuación Institucional', value: 3.96, previousValue: 3.82, unit: '/ 5.0' },
  { label: 'Total Respuestas', value: 940, previousValue: 780, unit: 'respuestas' },
  { label: 'Tasa de Participación', value: 76, previousValue: 71, unit: '%' },
  { label: 'Profesores Evaluados', value: 4, previousValue: 4, unit: 'profesores' },
];

// ─── Semester comparison ───

export interface SemesterComparison {
  departmentId: string;
  departmentName: string;
  currentSemester: number;
  previousSemester: number;
}

export const mockSemesterComparisons: SemesterComparison[] = [
  { departmentId: 'd1', departmentName: 'Ing. Software', currentSemester: 3.99, previousSemester: 3.72 },
  { departmentId: 'd2', departmentName: 'Ciencias Comp.', currentSemester: 4.35, previousSemester: 4.10 },
  { departmentId: 'd3', departmentName: 'Matemáticas', currentSemester: 3.65, previousSemester: 3.85 },
];
