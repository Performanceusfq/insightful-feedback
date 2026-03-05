import { useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { SurveyConfig, Question } from '@/types/domain';
import { Pin, Shuffle, MessageSquare, CircleDot } from 'lucide-react';

interface SurveyPreviewProps {
  config: SurveyConfig;
  questions: Question[];
  courses: Array<{ id: string; name: string; code: string }>;
  onClose: () => void;
}

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default function SurveyPreview({ config, questions, courses, onClose }: SurveyPreviewProps) {
  const course = courses.find((value) => value.id === config.courseId);

  const previewQuestions = useMemo(() => {
    const fixed = config.fixedQuestionIds
      .map((id) => questions.find((question) => question.id === id))
      .filter(Boolean) as Question[];

    const randomPool = config.randomPool.questionIds
      .map((id) => questions.find((question) => question.id === id))
      .filter(Boolean) as Question[];

    const selectedRandom = shuffleArray(randomPool).slice(0, config.randomPool.count);

    return [
      ...fixed.map((question) => ({ ...question, source: 'fixed' as const })),
      ...selectedRandom.map((question) => ({ ...question, source: 'random' as const })),
    ];
  }, [config, questions]);

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Vista Previa: {config.name}
          </DialogTitle>
          {course && <p className="text-sm text-muted-foreground">{course.name} ({course.code})</p>}
        </DialogHeader>

        <div className="mt-2 rounded-xl border-2 border-dashed border-primary/20 bg-muted/30 p-4">
          <p className="mb-4 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Así verá el estudiante la encuesta
          </p>

          <div className="space-y-5">
            {previewQuestions.map((question, index) => (
              <div key={question.id} className="rounded-lg bg-card p-4 shadow-sm">
                <div className="mb-2 flex items-start justify-between">
                  <span className="text-sm font-medium">
                    {index + 1}. {question.text}
                    {question.required && <span className="ml-1 text-destructive">*</span>}
                  </span>
                  <Badge variant="outline" className="ml-2 shrink-0 text-[10px]">
                    {question.source === 'fixed' ? (
                      <><Pin className="mr-1 h-2.5 w-2.5" /> Fija</>
                    ) : (
                      <><Shuffle className="mr-1 h-2.5 w-2.5" /> Aleatoria</>
                    )}
                  </Badge>
                </div>

                {question.type === 'likert' && (
                  <div className="flex items-center gap-1 pt-2">
                    {Array.from({ length: question.likertScale || 5 }, (_, value) => (
                      <button
                        key={value}
                        className="flex h-10 w-10 items-center justify-center rounded-lg border bg-background text-sm font-medium transition-colors hover:border-primary hover:bg-primary/10"
                      >
                        {value + 1}
                      </button>
                    ))}
                  </div>
                )}

                {question.type === 'multiple_choice' && question.options && (
                  <div className="space-y-2 pt-2">
                    {question.options.map((option, optionIndex) => (
                      <label
                        key={optionIndex}
                        className="flex cursor-pointer items-center gap-2 rounded-lg border bg-background px-3 py-2 text-sm transition-colors hover:border-primary hover:bg-primary/5"
                      >
                        <CircleDot className="h-4 w-4 text-muted-foreground" />
                        {option}
                      </label>
                    ))}
                  </div>
                )}

                {question.type === 'open' && (
                  <div className="pt-2">
                    <div className="flex items-center gap-2 rounded-lg border bg-background px-3 py-3 text-sm text-muted-foreground">
                      <MessageSquare className="h-4 w-4" />
                      Escribe tu respuesta aquí...
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <Separator className="my-4" />
          <p className="text-center text-xs text-muted-foreground">
            {previewQuestions.filter((question) => question.source === 'fixed').length} preguntas fijas
            {' · '}
            {previewQuestions.filter((question) => question.source === 'random').length} aleatorias (de {config.randomPool.questionIds.length} posibles)
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
