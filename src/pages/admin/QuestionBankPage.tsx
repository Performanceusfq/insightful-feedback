import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Question,
  QuestionType,
  QuestionCategory,
  questionTypeLabels,
  questionCategoryLabels,
} from '@/types/domain';
import { Plus, Pencil, Trash2, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { deleteQuestion, fetchQuestions, setQuestionActive, upsertQuestion } from '@/services/admin/questions';
import { getUserFacingErrorMessage } from '@/lib/error-messages';

const allTypes: QuestionType[] = ['likert', 'open', 'multiple_choice'];
const allCategories: QuestionCategory[] = ['pedagogia', 'contenido', 'evaluacion', 'comunicacion', 'general'];

const typeBadgeColor: Record<QuestionType, string> = {
  likert: 'bg-primary/10 text-primary',
  open: 'bg-accent/20 text-accent-foreground',
  multiple_choice: 'bg-warning/10 text-warning',
};

export default function QuestionBankPage() {
  const queryClient = useQueryClient();
  const [editQuestion, setEditQuestion] = useState<Partial<Question> | null>(null);
  const [open, setOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [newOption, setNewOption] = useState('');

  const questionsQuery = useQuery({
    queryKey: ['admin-questions'],
    queryFn: fetchQuestions,
  });

  const upsertMutation = useMutation({
    mutationFn: upsertQuestion,
    onSuccess: (_, variables) => {
      toast.success(variables.id ? 'Pregunta actualizada' : 'Pregunta creada');
      setOpen(false);
      setEditQuestion(null);
      setNewOption('');
      queryClient.invalidateQueries({ queryKey: ['admin-questions'] });
    },
    onError: (error: { message?: string }) => {
      toast.error(getUserFacingErrorMessage(error, 'No se pudo guardar la pregunta'));
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => setQuestionActive(id, active),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-questions'] });
    },
    onError: (error: { message?: string }) => {
      toast.error(getUserFacingErrorMessage(error, 'No se pudo actualizar el estado'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteQuestion,
    onSuccess: () => {
      toast.success('Pregunta eliminada');
      queryClient.invalidateQueries({ queryKey: ['admin-questions'] });
    },
    onError: (error: { message?: string }) => {
      toast.error(getUserFacingErrorMessage(error, 'No se pudo eliminar la pregunta'));
    },
  });

  const questions = questionsQuery.data ?? [];
  const filteredQuestions = filterCategory === 'all'
    ? questions
    : questions.filter((question) => question.category === filterCategory);

  const handleSave = () => {
    if (!editQuestion?.text?.trim() || !editQuestion?.type || !editQuestion?.category) {
      toast.error('Texto, tipo y categoría son requeridos');
      return;
    }

    if (editQuestion.type === 'multiple_choice' && (!editQuestion.options || editQuestion.options.length < 2)) {
      toast.error('Las preguntas de opción múltiple necesitan al menos 2 opciones');
      return;
    }

    upsertMutation.mutate({
      id: editQuestion.id,
      text: editQuestion.text.trim(),
      type: editQuestion.type,
      category: editQuestion.category,
      options: editQuestion.type === 'multiple_choice' ? editQuestion.options ?? [] : undefined,
      likertScale: editQuestion.type === 'likert' ? editQuestion.likertScale ?? 5 : undefined,
      required: editQuestion.required ?? false,
      active: editQuestion.active ?? true,
    });
  };

  const addOption = () => {
    if (!newOption.trim()) return;

    setEditQuestion((previous) => ({
      ...previous,
      options: [...(previous?.options || []), newOption.trim()],
    }));

    setNewOption('');
  };

  const removeOption = (index: number) => {
    setEditQuestion((previous) => ({
      ...previous,
      options: (previous?.options || []).filter((_, optionIndex) => optionIndex !== index),
    }));
  };

  const openNew = () => {
    setEditQuestion({
      type: 'likert',
      category: 'general',
      required: false,
      active: true,
      options: [],
      likertScale: 5,
    });
    setOpen(true);
  };

  return (
    <div>
      <PageHeader
        title="Banco de Preguntas"
        description="Crea y organiza preguntas para las encuestas de evaluación"
        action={
          <Button onClick={openNew}>
            <Plus className="mr-2 h-4 w-4" /> Nueva Pregunta
          </Button>
        }
      />

      <Tabs value={filterCategory} onValueChange={setFilterCategory} className="mb-4">
        <TabsList>
          <TabsTrigger value="all">Todas</TabsTrigger>
          {allCategories.map((category) => (
            <TabsTrigger key={category} value={category}>{questionCategoryLabels[category]}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[45%]">Pregunta</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Requerida</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="w-24">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {questionsQuery.isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">Cargando preguntas...</TableCell>
                </TableRow>
              ) : questionsQuery.isError ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-destructive">No se pudo cargar el banco de preguntas</TableCell>
                </TableRow>
              ) : (
                filteredQuestions.map((question) => (
                  <TableRow key={question.id}>
                    <TableCell className="font-medium">{question.text}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${typeBadgeColor[question.type]}`}>
                        {questionTypeLabels[question.type]}
                      </span>
                    </TableCell>
                    <TableCell><Badge variant="secondary">{questionCategoryLabels[question.category]}</Badge></TableCell>
                    <TableCell>{question.required ? '✓' : '—'}</TableCell>
                    <TableCell>
                      <Switch
                        checked={question.active}
                        onCheckedChange={(checked) => toggleActiveMutation.mutate({ id: question.id, active: checked })}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditQuestion(question);
                            setOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteMutation.mutate(question.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}

              {!questionsQuery.isLoading && !questionsQuery.isError && filteredQuestions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">Sin preguntas en esta categoría</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editQuestion?.id ? 'Editar' : 'Nueva'} Pregunta</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label>Texto de la pregunta</Label>
              <Textarea
                value={editQuestion?.text || ''}
                onChange={(event) => setEditQuestion((previous) => ({ ...previous, text: event.target.value }))}
                placeholder="¿El profesor explica los conceptos de manera clara?"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tipo</Label>
                <Select
                  value={editQuestion?.type || 'likert'}
                  onValueChange={(value) => setEditQuestion((previous) => ({ ...previous, type: value as QuestionType }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {allTypes.map((type) => (
                      <SelectItem key={type} value={type}>{questionTypeLabels[type]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Categoría</Label>
                <Select
                  value={editQuestion?.category || 'general'}
                  onValueChange={(value) => setEditQuestion((previous) => ({ ...previous, category: value as QuestionCategory }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {allCategories.map((category) => (
                      <SelectItem key={category} value={category}>{questionCategoryLabels[category]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {editQuestion?.type === 'likert' && (
              <div>
                <Label>Escala (1 a N)</Label>
                <Select
                  value={String(editQuestion.likertScale || 5)}
                  onValueChange={(value) => setEditQuestion((previous) => ({ ...previous, likertScale: Number(value) }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[3, 4, 5, 7, 10].map((scale) => (
                      <SelectItem key={scale} value={String(scale)}>{scale} puntos</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {editQuestion?.type === 'multiple_choice' && (
              <div>
                <Label>Opciones de respuesta</Label>
                <div className="mt-2 space-y-2">
                  {(editQuestion.options || []).map((option, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span className="flex-1 rounded-md border bg-muted px-3 py-1.5 text-sm">{option}</span>
                      <Button variant="ghost" size="icon" onClick={() => removeOption(index)}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <Input
                      value={newOption}
                      onChange={(event) => setNewOption(event.target.value)}
                      placeholder="Nueva opción"
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault();
                          addOption();
                        }
                      }}
                    />
                    <Button variant="outline" size="sm" onClick={addOption}>Agregar</Button>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Switch
                checked={editQuestion?.required ?? false}
                onCheckedChange={(checked) => setEditQuestion((previous) => ({ ...previous, required: checked }))}
              />
              <Label>Pregunta requerida</Label>
            </div>

            <Button onClick={handleSave} className="w-full" disabled={upsertMutation.isPending}>
              {upsertMutation.isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...</>
              ) : (
                'Guardar'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
