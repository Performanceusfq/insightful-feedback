import { Question, QuestionType, QuestionCategory, SurveyConfig } from '@/types/domain';

export const mockQuestions: Question[] = [
  // Pedagogía
  { id: 'q1', text: '¿El profesor explica los conceptos de manera clara y comprensible?', type: 'likert', category: 'pedagogia', likertScale: 5, required: true, active: true },
  { id: 'q2', text: '¿El profesor utiliza ejemplos relevantes para ilustrar los temas?', type: 'likert', category: 'pedagogia', likertScale: 5, required: true, active: true },
  { id: 'q3', text: '¿Qué metodología de enseñanza te resulta más efectiva en esta clase?', type: 'multiple_choice', category: 'pedagogia', options: ['Clase magistral', 'Trabajo en equipo', 'Aprendizaje basado en problemas', 'Discusión guiada'], required: false, active: true },
  // Contenido
  { id: 'q4', text: '¿El contenido de la clase es relevante para tu formación profesional?', type: 'likert', category: 'contenido', likertScale: 5, required: true, active: true },
  { id: 'q5', text: '¿El ritmo de avance del contenido es adecuado?', type: 'likert', category: 'contenido', likertScale: 5, required: true, active: true },
  { id: 'q6', text: '¿Qué tema de la clase te gustaría que se profundizara más?', type: 'open', category: 'contenido', required: false, active: true },
  // Evaluación
  { id: 'q7', text: '¿Los criterios de evaluación son claros y justos?', type: 'likert', category: 'evaluacion', likertScale: 5, required: true, active: true },
  { id: 'q8', text: '¿Recibes retroalimentación oportuna sobre tus trabajos y exámenes?', type: 'likert', category: 'evaluacion', likertScale: 5, required: true, active: true },
  // Comunicación
  { id: 'q9', text: '¿El profesor fomenta la participación en clase?', type: 'likert', category: 'comunicacion', likertScale: 5, required: true, active: true },
  { id: 'q10', text: '¿El profesor está disponible para resolver dudas fuera de clase?', type: 'likert', category: 'comunicacion', likertScale: 5, required: false, active: true },
  { id: 'q11', text: '¿Cómo prefieres comunicarte con el profesor?', type: 'multiple_choice', category: 'comunicacion', options: ['Email', 'Plataforma virtual', 'Presencial', 'WhatsApp/Telegram'], required: false, active: true },
  // General
  { id: 'q12', text: '¿Tienes algún comentario o sugerencia adicional?', type: 'open', category: 'general', required: false, active: true },
  { id: 'q13', text: '¿Recomendarías esta clase a otros estudiantes?', type: 'likert', category: 'general', likertScale: 5, required: false, active: true },
];

export const mockSurveyConfigs: SurveyConfig[] = [
  {
    id: 's1',
    courseId: 'c1',
    name: 'Encuesta Programación Avanzada',
    fixedQuestionIds: ['q1', 'q4', 'q7', 'q12'],
    randomPool: { questionIds: ['q2', 'q3', 'q5', 'q9', 'q10', 'q13'], count: 3 },
    active: true,
  },
  {
    id: 's2',
    courseId: 'c2',
    name: 'Encuesta Bases de Datos',
    fixedQuestionIds: ['q1', 'q5', 'q8', 'q12'],
    randomPool: { questionIds: ['q2', 'q6', 'q9', 'q11', 'q13'], count: 2 },
    active: true,
  },
];
