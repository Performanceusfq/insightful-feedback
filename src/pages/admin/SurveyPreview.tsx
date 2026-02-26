import { useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { mockQuestions } from '@/data/mock-questions';
import { mockCourses } from '@/data/mock-data';
import { SurveyConfig, Question, questionTypeLabels } from '@/types/domain';
import { Pin, Shuffle, Star, MessageSquare, CircleDot } from 'lucide-react';

interface SurveyPreviewProps {
  config: SurveyConfig;
  onClose: () => void;
}

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default function SurveyPreview({ config, onClose }: SurveyPreviewProps) {
  const course = mockCourses.find(c => c.id === config.courseId);

  const previewQuestions = useMemo(() => {
    const fixed = config.fixedQuestionIds
      .map(id => mockQuestions.find(q => q.id === id))
      .filter(Boolean) as Question[];

    const randomPool = config.randomPool.questionIds
      .map(id => mockQuestions.find(q => q.id === id))
      .filter(Boolean) as Question[];

    const selectedRandom = shuffleArray(randomPool).slice(0, config.randomPool.count);

    return [
      ...fixed.map(q => ({ ...q, source: 'fixed' as const })),
      ...selectedRandom.map(q => ({ ...q, source: 'random' as const })),
    ];
  }, [config]);

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
            {previewQuestions.map((q, idx) => (
              <div key={q.id} className="rounded-lg bg-card p-4 shadow-sm">
                <div className="mb-2 flex items-start justify-between">
                  <span className="text-sm font-medium">
                    {idx + 1}. {q.text}
                    {q.required && <span className="ml-1 text-destructive">*</span>}
                  </span>
                  <Badge variant="outline" className="ml-2 shrink-0 text-[10px]">
                    {q.source === 'fixed' ? (
                      <><Pin className="mr-1 h-2.5 w-2.5" /> Fija</>
                    ) : (
                      <><Shuffle className="mr-1 h-2.5 w-2.5" /> Aleatoria</>
                    )}
                  </Badge>
                </div>

                {q.type === 'likert' && (
                  <div className="flex items-center gap-1 pt-2">
                    {Array.from({ length: q.likertScale || 5 }, (_, i) => (
                      <button
                        key={i}
                        className="flex h-10 w-10 items-center justify-center rounded-lg border bg-background text-sm font-medium transition-colors hover:border-primary hover:bg-primary/10"
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                )}

                {q.type === 'multiple_choice' && q.options && (
                  <div className="space-y-2 pt-2">
                    {q.options.map((opt, oi) => (
                      <label key={oi} className="flex cursor-pointer items-center gap-2 rounded-lg border bg-background px-3 py-2 text-sm transition-colors hover:border-primary hover:bg-primary/5">
                        <CircleDot className="h-4 w-4 text-muted-foreground" />
                        {opt}
                      </label>
                    ))}
                  </div>
                )}

                {q.type === 'open' && (
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
            {previewQuestions.filter(q => q.source === 'fixed').length} preguntas fijas
            {' · '}
            {previewQuestions.filter(q => q.source === 'random').length} aleatorias (de {config.randomPool.questionIds.length} posibles)
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
