import { QuestionCategory } from '@/types/domain';

export type InsightType = 'alert' | 'recommendation' | 'highlight' | 'trend';
export type InsightPriority = 'high' | 'medium' | 'low';
export type InsightTarget = 'professor' | 'department' | 'institution';

export interface AIInsight {
  id: string;
  type: InsightType;
  priority: InsightPriority;
  target: InsightTarget;
  title: string;
  description: string;
  details: string;
  relatedEntity: { id: string; name: string };
  category?: QuestionCategory;
  metric?: { label: string; value: number; change: number };
  suggestedActions: string[];
  generatedAt: string;
}

const now = new Date();

export const mockInsights: AIInsight[] = [
  {
    id: 'ins1',
    type: 'alert',
    priority: 'high',
    target: 'professor',
    title: 'Puntaje en descenso sostenido',
    description: 'Dra. María García muestra una tendencia negativa en las últimas 4 semanas en la categoría de Pedagogía.',
    details: 'El puntaje promedio en Pedagogía pasó de 3.9 a 3.5 en las últimas 4 evaluaciones. El área más afectada es la claridad en las explicaciones (pregunta q1), donde el 15% de los estudiantes calificó con 1 o 2. Esto representa una desviación de -0.8σ respecto al promedio del departamento.',
    relatedEntity: { id: 'p4', name: 'Dra. María García' },
    category: 'pedagogia',
    metric: { label: 'Puntaje Pedagogía', value: 3.5, change: -0.4 },
    suggestedActions: [
      'Programar reunión de retroalimentación con la profesora',
      'Ofrecer taller de metodologías activas de enseñanza',
      'Asignar un mentor docente del departamento',
      'Revisar carga académica actual para detectar sobrecarga',
    ],
    generatedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'ins2',
    type: 'highlight',
    priority: 'medium',
    target: 'professor',
    title: 'Desempeño destacado en Evaluación',
    description: 'Dr. Roberto Sánchez obtiene el puntaje más alto de la institución en la categoría de Evaluación (4.40/5.0).',
    details: 'El profesor mantiene consistentemente altos puntajes en claridad de criterios de evaluación y retroalimentación oportuna. El 85% de sus estudiantes califican con 4 o 5 en estas áreas. Su metodología de rúbricas detalladas podría replicarse en otros departamentos.',
    relatedEntity: { id: 'p3', name: 'Dr. Roberto Sánchez' },
    category: 'evaluacion',
    metric: { label: 'Puntaje Evaluación', value: 4.40, change: 0.15 },
    suggestedActions: [
      'Reconocer formalmente su desempeño docente',
      'Solicitar que comparta su metodología de rúbricas en un taller institucional',
      'Documentar sus prácticas como caso de éxito',
    ],
    generatedAt: new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'ins3',
    type: 'trend',
    priority: 'medium',
    target: 'department',
    title: 'Mejora progresiva en Ing. de Software',
    description: 'El departamento de Ingeniería de Software muestra una mejora del 7.3% en su puntaje global en los últimos 3 meses.',
    details: 'El puntaje promedio del departamento subió de 3.72 a 3.99. Las categorías con mayor mejora son Comunicación (+12%) y Contenido (+8%). La participación estudiantil también aumentó de 74% a 82%, lo que indica mayor compromiso con el proceso de evaluación.',
    relatedEntity: { id: 'd1', name: 'Ingeniería de Software' },
    metric: { label: 'Puntaje Dpto.', value: 3.99, change: 0.27 },
    suggestedActions: [
      'Mantener las estrategias pedagógicas actuales del departamento',
      'Compartir las prácticas exitosas con otros departamentos',
      'Evaluar qué cambios específicos contribuyeron a la mejora',
    ],
    generatedAt: new Date(now.getTime() - 8 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'ins4',
    type: 'alert',
    priority: 'high',
    target: 'department',
    title: 'Baja participación en Matemáticas Aplicadas',
    description: 'La tasa de participación en encuestas del departamento cayó al 65%, la más baja de la institución.',
    details: 'Solo el 65% de los estudiantes matriculados están respondiendo las encuestas, comparado con un promedio institucional del 76%. Esto puede sesgar los resultados y reducir la confiabilidad de las evaluaciones. El problema es más pronunciado en los horarios vespertinos.',
    relatedEntity: { id: 'd3', name: 'Matemáticas Aplicadas' },
    metric: { label: 'Participación', value: 65, change: -8 },
    suggestedActions: [
      'Implementar recordatorios push para estudiantes al inicio de clase',
      'Reducir la cantidad de preguntas en encuestas de este departamento',
      'Investigar si hay barreras técnicas (conectividad, dispositivos)',
      'Considerar incentivos de participación no coercitivos',
    ],
    generatedAt: new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'ins5',
    type: 'recommendation',
    priority: 'low',
    target: 'institution',
    title: 'Optimizar banco de preguntas',
    description: 'Análisis de correlación sugiere que 3 preguntas del banco tienen redundancia alta y podrían consolidarse.',
    details: 'Las preguntas q1 ("¿El profesor explica de manera clara?") y q2 ("¿Utiliza ejemplos relevantes?") tienen una correlación de 0.89, lo que sugiere que miden dimensiones muy similares. Consolidarlas reduciría la fatiga del encuestado sin perder información significativa. Similar patrón entre q9 y q10.',
    relatedEntity: { id: 'inst', name: 'Institución' },
    suggestedActions: [
      'Revisar y fusionar preguntas q1 y q2 en una más completa',
      'Evaluar la correlación entre q9 y q10 para posible consolidación',
      'Realizar análisis factorial completo del banco de preguntas',
    ],
    generatedAt: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'ins6',
    type: 'recommendation',
    priority: 'medium',
    target: 'institution',
    title: 'Preferencia por aprendizaje activo',
    description: 'El 65% de los estudiantes prefieren metodologías de aprendizaje basado en problemas sobre la clase magistral.',
    details: 'En las encuestas de opción múltiple sobre metodología preferida, "Trabajo en equipo" (35%) y "Aprendizaje basado en problemas" (30%) superan significativamente a "Clase magistral" (20%). Esta tendencia es consistente en todos los departamentos. Los profesores que usan métodos activos tienen en promedio 0.4 puntos más en satisfacción general.',
    relatedEntity: { id: 'inst', name: 'Institución' },
    metric: { label: 'Preferencia ABP', value: 65, change: 5 },
    suggestedActions: [
      'Ofrecer capacitación institucional en metodologías activas',
      'Crear repositorio de recursos para aprendizaje basado en problemas',
      'Incluir esta métrica en los criterios de evaluación docente',
    ],
    generatedAt: new Date(now.getTime() - 36 * 60 * 60 * 1000).toISOString(),
  },
];

// Simulated weekly summary
export interface WeeklySummary {
  period: string;
  overallScore: number;
  changeVsPrevious: number;
  totalResponses: number;
  participationRate: number;
  topPerformer: { name: string; score: number };
  needsAttention: { name: string; score: number };
  keyFindings: string[];
}

export const mockWeeklySummary: WeeklySummary = {
  period: 'Semana del 17 al 23 de Febrero 2026',
  overallScore: 3.96,
  changeVsPrevious: 0.04,
  totalResponses: 148,
  participationRate: 76,
  topPerformer: { name: 'Dr. Roberto Sánchez', score: 4.35 },
  needsAttention: { name: 'Dra. María García', score: 3.65 },
  keyFindings: [
    'La satisfacción general aumentó un 1% respecto a la semana anterior.',
    'El departamento de Ciencias de la Computación mantiene el liderazgo con 4.35/5.0.',
    'Se detectó una correlación entre la participación estudiantil y los horarios matutinos.',
    'Los comentarios abiertos mencionan "material de apoyo" como la principal área de mejora.',
  ],
};
