import { useState, useEffect, type Dispatch, type ReactNode, type SetStateAction } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSurveyByQr } from '@/hooks/useSurveyByQr';
import { useSubmitEventResponse } from '@/hooks/useSubmitEventResponse';
import {
  mapLookupStatusToFlowState,
  mapSubmitStatusToFlowState,
  type SurveyQuestion,
} from '@/services/student-survey';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, AlertTriangle, Clock, ShieldCheck, ArrowRight, ArrowLeft, Send } from 'lucide-react';
import { cn } from '@/lib/utils';

type FlowState = 'loading' | 'invalid' | 'expired' | 'already_done' | 'intro' | 'survey' | 'success';

export default function SurveyResponsePage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const qrCode = token?.trim().toUpperCase() ?? '';

  const [flowState, setFlowState] = useState<FlowState>('loading');
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const surveyQuery = useSurveyByQr(qrCode || undefined);
  const submitMutation = useSubmitEventResponse();

  const questions = surveyQuery.data?.questions ?? [];
  const courseName = surveyQuery.data?.courseName ?? 'Encuesta';
  const surveyName = surveyQuery.data?.surveyName ?? 'Encuesta activa';

  useEffect(() => {
    setCurrentStep(0);
    setAnswers({});
  }, [qrCode]);

  useEffect(() => {
    if (surveyQuery.isLoading) {
      setFlowState('loading');
      return;
    }

    if (surveyQuery.isError || !surveyQuery.data) {
      setFlowState('invalid');
      return;
    }

    const nextState = mapLookupStatusToFlowState(surveyQuery.data.status);
    setFlowState((previousState) => {
      if (nextState === 'intro' && (previousState === 'survey' || previousState === 'success')) {
        return previousState;
      }

      return nextState;
    });
  }, [surveyQuery.data, surveyQuery.isError, surveyQuery.isLoading]);

  useEffect(() => {
    if (questions.length === 0) {
      setCurrentStep(0);
      return;
    }

    setCurrentStep((previousStep) => Math.min(previousStep, questions.length - 1));
  }, [questions.length]);

  const currentQuestion = questions[currentStep];
  const progress = questions.length > 0 ? ((currentStep + 1) / questions.length) * 100 : 0;

  const canAdvance = () => {
    if (!currentQuestion) return false;
    if (!currentQuestion.required) return true;
    return !!answers[currentQuestion.id]?.trim();
  };

  const handleSubmit = async () => {
    if (!qrCode || !currentQuestion) {
      return;
    }

    try {
      const result = await submitMutation.mutateAsync({ qrCode, answers });
      setFlowState(mapSubmitStatusToFlowState(result.status));
    } catch {
      setFlowState('invalid');
    }
  };

  if (flowState === 'loading') {
    return <StatusScreen icon={<Clock className="h-10 w-10 text-muted-foreground animate-pulse" />} title="Cargando..." />;
  }

  if (flowState === 'invalid') {
    return (
      <StatusScreen
        icon={<AlertTriangle className="h-10 w-10 text-destructive" />}
        title="Código inválido"
        subtitle="Este enlace QR no es válido o ya no está disponible para ti."
        action={<Button variant="outline" onClick={() => navigate('/estudiante')}>Volver al inicio</Button>}
      />
    );
  }

  if (flowState === 'expired') {
    return (
      <StatusScreen
        icon={<Clock className="h-10 w-10 text-destructive" />}
        title="Encuesta expirada"
        subtitle="El tiempo para responder esta encuesta ya terminó."
        action={<Button variant="outline" onClick={() => navigate('/estudiante')}>Volver al inicio</Button>}
      />
    );
  }

  if (flowState === 'already_done') {
    return (
      <StatusScreen
        icon={<CheckCircle2 className="h-10 w-10 text-primary" />}
        title="Ya respondiste"
        subtitle="Ya completaste esta encuesta. Solo se permite una respuesta por sesión."
        action={<Button variant="outline" onClick={() => navigate('/estudiante')}>Volver al inicio</Button>}
      />
    );
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

  if (flowState === 'intro') {
    return (
      <div className="flex min-h-[80vh] items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8 pb-6 text-center space-y-5">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <ShieldCheck className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold">{courseName}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{surveyName}</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-4 text-left text-sm space-y-2">
              <p className="font-medium">Antes de comenzar:</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Tu respuesta es <strong className="text-foreground">completamente anónima</strong></li>
                <li>• Contiene <strong className="text-foreground">{questions.length} preguntas</strong></li>
                <li>• Tiempo estimado: <strong className="text-foreground">~{Math.max(1, Math.ceil(questions.length / 6))} minuto(s)</strong></li>
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

  return (
    <div className="flex min-h-[80vh] flex-col px-4 py-6">
      <div className="mx-auto w-full max-w-md space-y-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{courseName}</span>
          <span>{questions.length === 0 ? 0 : currentStep + 1} / {questions.length}</span>
        </div>
        <Progress value={progress} className="h-1.5" />
      </div>

      <div className="mx-auto mt-8 w-full max-w-md flex-1">
        {currentQuestion ? (
          <QuestionRenderer question={currentQuestion} answers={answers} setAnswers={setAnswers} />
        ) : (
          <StatusScreen
            icon={<AlertTriangle className="h-10 w-10 text-destructive" />}
            title="Encuesta sin preguntas"
            subtitle="Este evento no tiene preguntas disponibles en este momento."
            action={<Button variant="outline" onClick={() => navigate('/estudiante')}>Volver al inicio</Button>}
          />
        )}
      </div>

      {currentQuestion && (
        <div className="mx-auto mt-8 flex w-full max-w-md gap-3">
          <Button
            variant="outline"
            onClick={() => setCurrentStep((step) => step - 1)}
            disabled={currentStep === 0 || submitMutation.isPending}
            className="flex-1"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Anterior
          </Button>

          {currentStep < questions.length - 1 ? (
            <Button
              onClick={() => setCurrentStep((step) => step + 1)}
              disabled={!canAdvance() || submitMutation.isPending}
              className="flex-1"
            >
              Siguiente
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={!canAdvance() || submitMutation.isPending} className="flex-1">
              <Send className="mr-2 h-4 w-4" />
              {submitMutation.isPending ? 'Enviando...' : 'Enviar'}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

function QuestionRenderer({
  question,
  answers,
  setAnswers,
}: {
  question: SurveyQuestion;
  answers: Record<string, string>;
  setAnswers: Dispatch<SetStateAction<Record<string, string>>>;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-display text-lg font-semibold leading-snug">
          {question.text}
          {question.required && <span className="ml-1 text-destructive">*</span>}
        </h3>
      </div>

      {question.type === 'likert' && (
        <div className="space-y-3">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Muy en desacuerdo</span>
            <span>Muy de acuerdo</span>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {Array.from({ length: question.likertScale || 5 }, (_, index) => {
              const value = String(index + 1);
              const selected = answers[question.id] === value;

              return (
                <button
                  key={value}
                  onClick={() => setAnswers((prev) => ({ ...prev, [question.id]: value }))}
                  className={cn(
                    'flex h-14 items-center justify-center rounded-xl border-2 text-lg font-bold transition-all',
                    selected
                      ? 'border-primary bg-primary text-primary-foreground scale-105 shadow-md'
                      : 'border-border bg-card hover:border-primary/50 hover:bg-primary/5',
                  )}
                >
                  {value}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {question.type === 'multiple_choice' && question.options && (
        <RadioGroup
          value={answers[question.id] ?? ''}
          onValueChange={(value) => setAnswers((prev) => ({ ...prev, [question.id]: value }))}
          className="space-y-2"
        >
          {question.options.map((option, optionIndex) => (
            <Label
              key={optionIndex}
              htmlFor={`opt-${question.id}-${optionIndex}`}
              className={cn(
                'flex cursor-pointer items-center gap-3 rounded-xl border-2 px-4 py-3.5 text-sm transition-all',
                answers[question.id] === option
                  ? 'border-primary bg-primary/5 font-medium'
                  : 'border-border hover:border-primary/30',
              )}
            >
              <RadioGroupItem value={option} id={`opt-${question.id}-${optionIndex}`} />
              {option}
            </Label>
          ))}
        </RadioGroup>
      )}

      {question.type === 'open' && (
        <Textarea
          placeholder="Escribe tu respuesta aquí..."
          value={answers[question.id] ?? ''}
          onChange={(event) => setAnswers((prev) => ({ ...prev, [question.id]: event.target.value }))}
          className="min-h-[120px] rounded-xl text-sm"
        />
      )}
    </div>
  );
}

function StatusScreen({ icon, title, subtitle, action }: { icon: ReactNode; title: string; subtitle?: string; action?: ReactNode }) {
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
