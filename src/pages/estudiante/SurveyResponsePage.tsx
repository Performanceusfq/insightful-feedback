import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { mockEvents } from '@/data/mock-events';
import { mockEventConfigs } from '@/data/mock-events';
import { mockSurveyConfigs, mockQuestions } from '@/data/mock-questions';
import { mockCourses } from '@/data/mock-data';
import { hasStudentResponded, submitResponse } from '@/data/mock-responses';
import { Question } from '@/types/domain';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, AlertTriangle, Clock, ShieldCheck, ArrowRight, ArrowLeft, Send } from 'lucide-react';
import { cn } from '@/lib/utils';

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

type FlowState = 'loading' | 'invalid' | 'expired' | 'already_done' | 'intro' | 'survey' | 'success';

export default function SurveyResponsePage() {
  const { token } = useParams<{ token: string }>();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [flowState, setFlowState] = useState<FlowState>('loading');
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  // Resolve event chain
  const event = useMemo(() => mockEvents.find(e => e.qrCode === token), [token]);
  const config = useMemo(() => event ? mockEventConfigs.find(ec => ec.id === event.configId) : undefined, [event]);
  const surveyConfig = useMemo(() => config ? mockSurveyConfigs.find(sc => sc.id === config.surveyConfigId) : undefined, [config]);
  const course = useMemo(() => event ? mockCourses.find(c => c.id === event.courseId) : undefined, [event]);

  const questions = useMemo(() => {
    if (!surveyConfig) return [];
    const fixed = surveyConfig.fixedQuestionIds
      .map(id => mockQuestions.find(q => q.id === id))
      .filter(Boolean) as Question[];
    const pool = surveyConfig.randomPool.questionIds
      .map(id => mockQuestions.find(q => q.id === id))
      .filter(Boolean) as Question[];
    const randomPicked = shuffleArray(pool).slice(0, surveyConfig.randomPool.count);
    return [...fixed, ...randomPicked];
  }, [surveyConfig]);

  useEffect(() => {
    if (!event) { setFlowState('invalid'); return; }
    if (event.status === 'expired' || event.status === 'cancelled') { setFlowState('expired'); return; }
    if (new Date(event.expiresAt).getTime() < Date.now()) { setFlowState('expired'); return; }
    if (hasStudentResponded(currentUser.id, event.id)) { setFlowState('already_done'); return; }
    setFlowState('intro');
  }, [event, currentUser.id]);

  const currentQuestion = questions[currentStep];
  const progress = questions.length > 0 ? ((currentStep + 1) / questions.length) * 100 : 0;

  const canAdvance = () => {
    if (!currentQuestion) return false;
    if (!currentQuestion.required) return true;
    return !!answers[currentQuestion.id]?.trim();
  };

  const handleSubmit = () => {
    if (!event) return;
    submitResponse(currentUser.id, event.id, answers);
    setFlowState('success');
  };

  // ─── Status screens ───
  if (flowState === 'loading') {
    return <StatusScreen icon={<Clock className="h-10 w-10 text-muted-foreground animate-pulse" />} title="Cargando..." />;
  }

  if (flowState === 'invalid') {
    return <StatusScreen icon={<AlertTriangle className="h-10 w-10 text-destructive" />} title="Código inválido" subtitle="Este enlace QR no es válido o ya no existe." action={<Button variant="outline" onClick={() => navigate('/estudiante')}>Volver al inicio</Button>} />;
  }

  if (flowState === 'expired') {
    return <StatusScreen icon={<Clock className="h-10 w-10 text-destructive" />} title="Encuesta expirada" subtitle="El tiempo para responder esta encuesta ya terminó." action={<Button variant="outline" onClick={() => navigate('/estudiante')}>Volver al inicio</Button>} />;
  }

  if (flowState === 'already_done') {
    return <StatusScreen icon={<CheckCircle2 className="h-10 w-10 text-primary" />} title="Ya respondiste" subtitle="Ya completaste esta encuesta. Solo se permite una respuesta por sesión." action={<Button variant="outline" onClick={() => navigate('/estudiante')}>Volver al inicio</Button>} />;
  }

  if (flowState === 'success') {
    return (
      <StatusScreen
        icon={<CheckCircle2 className="h-12 w-12 text-primary" />}
        title="¡Gracias!"
        subtitle="Tu respuesta fue enviada de forma anónima. Tu opinión ayuda a mejorar la calidad docente."
        action={<Button onClick={() => navigate('/estudiante')}>Volver al inicio</Button>}
      />
    );
  }

  // ─── Intro screen ───
  if (flowState === 'intro') {
    return (
      <div className="flex min-h-[80vh] items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8 pb-6 text-center space-y-5">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <ShieldCheck className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold">{course?.name ?? 'Encuesta'}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{surveyConfig?.name}</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-4 text-left text-sm space-y-2">
              <p className="font-medium">Antes de comenzar:</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Tu respuesta es <strong className="text-foreground">completamente anónima</strong></li>
                <li>• Contiene <strong className="text-foreground">{questions.length} preguntas</strong></li>
                <li>• Tiempo estimado: <strong className="text-foreground">~1 minuto</strong></li>
              </ul>
            </div>
            <Button className="w-full" size="lg" onClick={() => setFlowState('survey')}>
              Comenzar encuesta
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── Survey flow ───
  return (
    <div className="flex min-h-[80vh] flex-col px-4 py-6">
      {/* Header */}
      <div className="mx-auto w-full max-w-md space-y-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{course?.name}</span>
          <span>{currentStep + 1} / {questions.length}</span>
        </div>
        <Progress value={progress} className="h-1.5" />
      </div>

      {/* Question */}
      <div className="mx-auto mt-8 w-full max-w-md flex-1">
        {currentQuestion && (
          <div className="space-y-6">
            <div>
              <h3 className="font-display text-lg font-semibold leading-snug">
                {currentQuestion.text}
                {currentQuestion.required && <span className="ml-1 text-destructive">*</span>}
              </h3>
            </div>

            {/* Likert */}
            {currentQuestion.type === 'likert' && (
              <div className="space-y-3">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Muy en desacuerdo</span>
                  <span>Muy de acuerdo</span>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {Array.from({ length: currentQuestion.likertScale || 5 }, (_, i) => {
                    const val = String(i + 1);
                    const selected = answers[currentQuestion.id] === val;
                    return (
                      <button
                        key={i}
                        onClick={() => setAnswers(prev => ({ ...prev, [currentQuestion.id]: val }))}
                        className={cn(
                          'flex h-14 items-center justify-center rounded-xl border-2 text-lg font-bold transition-all',
                          selected
                            ? 'border-primary bg-primary text-primary-foreground scale-105 shadow-md'
                            : 'border-border bg-card hover:border-primary/50 hover:bg-primary/5'
                        )}
                      >
                        {val}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Multiple choice */}
            {currentQuestion.type === 'multiple_choice' && currentQuestion.options && (
              <RadioGroup
                value={answers[currentQuestion.id] ?? ''}
                onValueChange={val => setAnswers(prev => ({ ...prev, [currentQuestion.id]: val }))}
                className="space-y-2"
              >
                {currentQuestion.options.map((opt, oi) => (
                  <Label
                    key={oi}
                    htmlFor={`opt-${oi}`}
                    className={cn(
                      'flex cursor-pointer items-center gap-3 rounded-xl border-2 px-4 py-3.5 text-sm transition-all',
                      answers[currentQuestion.id] === opt
                        ? 'border-primary bg-primary/5 font-medium'
                        : 'border-border hover:border-primary/30'
                    )}
                  >
                    <RadioGroupItem value={opt} id={`opt-${oi}`} />
                    {opt}
                  </Label>
                ))}
              </RadioGroup>
            )}

            {/* Open */}
            {currentQuestion.type === 'open' && (
              <Textarea
                placeholder="Escribe tu respuesta aquí..."
                value={answers[currentQuestion.id] ?? ''}
                onChange={e => setAnswers(prev => ({ ...prev, [currentQuestion.id]: e.target.value }))}
                className="min-h-[120px] rounded-xl text-sm"
              />
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="mx-auto mt-8 flex w-full max-w-md gap-3">
        <Button
          variant="outline"
          onClick={() => setCurrentStep(s => s - 1)}
          disabled={currentStep === 0}
          className="flex-1"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Anterior
        </Button>

        {currentStep < questions.length - 1 ? (
          <Button
            onClick={() => setCurrentStep(s => s + 1)}
            disabled={!canAdvance()}
            className="flex-1"
          >
            Siguiente
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={!canAdvance()}
            className="flex-1"
          >
            <Send className="mr-2 h-4 w-4" />
            Enviar
          </Button>
        )}
      </div>
    </div>
  );
}

function StatusScreen({ icon, title, subtitle, action }: { icon: React.ReactNode; title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="text-center space-y-4 max-w-sm">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-muted/50">
          {icon}
        </div>
        <h2 className="font-display text-xl font-bold">{title}</h2>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        {action && <div className="pt-2">{action}</div>}
      </div>
    </div>
  );
}
