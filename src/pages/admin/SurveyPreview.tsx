import { useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { SurveyConfig, Question } from '@/types/domain';
import { Pin, Shuffle, Eye, MessageSquare, CircleDot } from 'lucide-react';

interface SurveyPreviewProps {
  config: SurveyConfig;
  questions: Question[];
  courses: Array<{ id: string; name: string; code: string }>;
  onClose: () => void;
}

export default function SurveyPreview({ config, questions, courses, onClose }: SurveyPreviewProps) {
  const course = courses.find((value) => value.id === config.courseId);

  const previewQuestions = useMemo(() => {
    const fixed = config.fixedQuestionIds
      .map((id) => questions.find((q) => q.id === id))
      .filter(Boolean) as Question[];

    const randomPool = config.randomPool.questionIds
      .map((id) => questions.find((q) => q.id === id))
      .filter(Boolean) as Question[];

    return [
      ...fixed.map((q) => ({ ...q, source: 'fixed' as const })),
      ...randomPool.map((q) => ({ ...q, source: 'pool' as const })),
    ];
  }, [config, questions]);

  const fixedCount = previewQuestions.filter((q) => q.source === 'fixed').length;
  const randomCount = previewQuestions.filter((q) => q.source === 'pool').length;
  const total = fixedCount + config.randomPool.count;

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{config.name}</DialogTitle>
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
              <Pin className="h-3 w-3 text-primary" />
              {fixedCount} Fijas
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
              <Shuffle className="h-3 w-3 text-primary" />
              {randomCount} Aleatorias
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-md bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
              <Eye className="h-3 w-3" />
              {total} se mostrarán
            </span>
          </div>
        </DialogHeader>

        {/* Questions preview */}
        <div className="rounded-xl border-2 border-dashed border-primary/20 bg-muted/30 p-4">
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

        </div>
      </DialogContent>
    </Dialog>
  );
}
