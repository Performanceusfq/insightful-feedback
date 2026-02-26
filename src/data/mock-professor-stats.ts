import { Question, QuestionCategory, questionCategoryLabels } from '@/types/domain';
import { mockQuestions } from './mock-questions';

// Simulated aggregated responses per question for professor's courses
export interface AggregatedResponse {
  questionId: string;
  courseId: string;
  totalResponses: number;
  // For likert: distribution of responses per scale value
  likertDistribution?: Record<number, number>;
  averageScore?: number;
  // For multiple_choice: count per option
  choiceDistribution?: Record<string, number>;
  // For open: sample text answers
  openAnswers?: string[];
}

// Generate realistic mock aggregated data
function generateLikertDist(total: number, avgTarget: number, scale = 5): Record<number, number> {
  const dist: Record<number, number> = {};
  let remaining = total;
  for (let i = 1; i <= scale; i++) {
    if (i === scale) { dist[i] = remaining; break; }
    const weight = Math.exp(-Math.abs(i - avgTarget));
    const count = Math.max(1, Math.round(total * weight / (scale * 0.8)));
    dist[i] = Math.min(count, remaining - (scale - i));
    remaining -= dist[i];
  }
  return dist;
}

export const mockAggregatedResponses: AggregatedResponse[] = [
  // Course c1 - Programación Avanzada
  { questionId: 'q1', courseId: 'c1', totalResponses: 45, likertDistribution: { 1: 1, 2: 3, 3: 6, 4: 18, 5: 17 }, averageScore: 4.04 },
  { questionId: 'q2', courseId: 'c1', totalResponses: 45, likertDistribution: { 1: 0, 2: 2, 3: 8, 4: 15, 5: 20 }, averageScore: 4.18 },
  { questionId: 'q4', courseId: 'c1', totalResponses: 45, likertDistribution: { 1: 1, 2: 4, 3: 7, 4: 16, 5: 17 }, averageScore: 3.98 },
  { questionId: 'q5', courseId: 'c1', totalResponses: 45, likertDistribution: { 1: 2, 2: 5, 3: 10, 4: 14, 5: 14 }, averageScore: 3.73 },
  { questionId: 'q7', courseId: 'c1', totalResponses: 45, likertDistribution: { 1: 0, 2: 1, 3: 5, 4: 20, 5: 19 }, averageScore: 4.27 },
  { questionId: 'q9', courseId: 'c1', totalResponses: 45, likertDistribution: { 1: 1, 2: 3, 3: 9, 4: 17, 5: 15 }, averageScore: 3.93 },
  { questionId: 'q13', courseId: 'c1', totalResponses: 45, likertDistribution: { 1: 0, 2: 2, 3: 4, 4: 15, 5: 24 }, averageScore: 4.36 },
  { questionId: 'q3', courseId: 'c1', totalResponses: 40, choiceDistribution: { 'Clase magistral': 8, 'Trabajo en equipo': 14, 'Aprendizaje basado en problemas': 12, 'Discusión guiada': 6 } },
  { questionId: 'q12', courseId: 'c1', totalResponses: 30, openAnswers: [
    'Excelente profesor, muy claro en sus explicaciones.',
    'Me gustaría más ejercicios prácticos.',
    'El ritmo es un poco rápido para algunos temas.',
    'La clase es muy interactiva, me gusta mucho.',
    'Sería bueno tener más material de apoyo.',
  ]},
  // Course c2 - Bases de Datos (for p2, but useful for variety)
  { questionId: 'q1', courseId: 'c2', totalResponses: 38, likertDistribution: { 1: 2, 2: 4, 3: 8, 4: 14, 5: 10 }, averageScore: 3.68 },
  { questionId: 'q5', courseId: 'c2', totalResponses: 38, likertDistribution: { 1: 1, 2: 3, 3: 7, 4: 15, 5: 12 }, averageScore: 3.89 },
  { questionId: 'q8', courseId: 'c2', totalResponses: 38, likertDistribution: { 1: 0, 2: 2, 3: 6, 4: 16, 5: 14 }, averageScore: 4.11 },
];

// Weekly trend data for sparklines
export interface WeeklyTrend {
  courseId: string;
  data: { week: string; avgScore: number; responses: number }[];
}

export const mockWeeklyTrends: WeeklyTrend[] = [
  {
    courseId: 'c1',
    data: [
      { week: 'Sem 1', avgScore: 3.8, responses: 42 },
      { week: 'Sem 2', avgScore: 3.9, responses: 44 },
      { week: 'Sem 3', avgScore: 4.0, responses: 40 },
      { week: 'Sem 4', avgScore: 3.7, responses: 45 },
      { week: 'Sem 5', avgScore: 4.1, responses: 43 },
      { week: 'Sem 6', avgScore: 4.2, responses: 45 },
      { week: 'Sem 7', avgScore: 4.0, responses: 41 },
      { week: 'Sem 8', avgScore: 4.3, responses: 44 },
    ],
  },
  {
    courseId: 'c2',
    data: [
      { week: 'Sem 1', avgScore: 3.5, responses: 35 },
      { week: 'Sem 2', avgScore: 3.6, responses: 37 },
      { week: 'Sem 3', avgScore: 3.8, responses: 36 },
      { week: 'Sem 4', avgScore: 3.7, responses: 38 },
      { week: 'Sem 5', avgScore: 3.9, responses: 37 },
      { week: 'Sem 6', avgScore: 4.0, responses: 38 },
      { week: 'Sem 7', avgScore: 3.8, responses: 36 },
      { week: 'Sem 8', avgScore: 3.9, responses: 38 },
    ],
  },
];

// Category scores for radar-like overview
export interface CategoryScore {
  courseId: string;
  category: QuestionCategory;
  avgScore: number;
}

export const mockCategoryScores: CategoryScore[] = [
  { courseId: 'c1', category: 'pedagogia', avgScore: 4.11 },
  { courseId: 'c1', category: 'contenido', avgScore: 3.86 },
  { courseId: 'c1', category: 'evaluacion', avgScore: 4.27 },
  { courseId: 'c1', category: 'comunicacion', avgScore: 3.93 },
  { courseId: 'c1', category: 'general', avgScore: 4.36 },
  { courseId: 'c2', category: 'pedagogia', avgScore: 3.68 },
  { courseId: 'c2', category: 'contenido', avgScore: 3.89 },
  { courseId: 'c2', category: 'evaluacion', avgScore: 4.11 },
  { courseId: 'c2', category: 'comunicacion', avgScore: 3.75 },
  { courseId: 'c2', category: 'general', avgScore: 3.80 },
];
