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
import {
  Question,
  QuestionType,
  QuestionCategory,
  questionTypeLabels,
  questionCategoryLabels,
} from '@/types/domain';
import { Plus, Pencil, Trash2, X, Loader2, Building2, Globe } from 'lucide-react';
import { toast } from 'sonner';
import { deleteQuestion, fetchQuestions, upsertQuestion } from '@/services/admin/questions';
import { getUserFacingErrorMessage } from '@/lib/error-messages';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

const allTypes: QuestionType[] = ['likert', 'open', 'multiple_choice'];

const typeBadgeColor: Record<QuestionType, string> = {
  likert: 'bg-primary/10 text-primary',
  open: 'bg-accent/20 text-accent-foreground',
  multiple_choice: 'bg-warning/10 text-warning',
};

interface DepartmentOption {
  id: string;
  name: string;
  code: string;
}

async function fetchDepartments(): Promise<DepartmentOption[]> {
  const { data, error } = await supabase.from('departments').select('id, name, code').order('name');
  if (error) throw error;
  return data ?? [];
}

export default function QuestionBankPage() {
  const queryClient = useQueryClient();
  const [editQuestion, setEditQuestion] = useState<Partial<Question> | null>(null);
  const [open, setOpen] = useState(false);
  // 'all' | 'general' | <department-uuid>
  const [filterScope, setFilterScope] = useState<string>('all');
  const [newOption, setNewOption] = useState('');

  const questionsQuery = useQuery({
    queryKey: ['admin-questions'],
    queryFn: fetchQuestions,
  });

  const departmentsQuery = useQuery({
    queryKey: ['admin-departments-options'],
    queryFn: fetchDepartments,
  });

  const departments = departmentsQuery.data ?? [];

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

  const filteredQuestions = filterScope === 'all'
    ? questions
    : filterScope === 'general'
      ? questions.filter((q) => !q.departmentId)
      : questions.filter((q) => q.departmentId === filterScope);

  const getDepartmentLabel = (departmentId: string | null | undefined) => {
    if (!departmentId) return 'General';
    return departments.find((d) => d.id === departmentId)?.name ?? 'Desconocido';
  };

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
      departmentId: editQuestion.departmentId ?? null,
    });
  };

  const addOption = () => {
    if (!newOption.trim()) return;
    setEditQuestion((prev) => ({ ...prev, options: [...(prev?.options || []), newOption.trim()] }));
    setNewOption('');
  };

  const removeOption = (index: number) => {
    setEditQuestion((prev) => ({ ...prev, options: (prev?.options || []).filter((_, i) => i !== index) }));
  };

  const openNew = () => {
    setEditQuestion({ type: 'likert', category: 'general', required: false, active: true, options: [], likertScale: 5, departmentId: null });
    setOpen(true);
  };

  // Determine label for the department select filter
  const selectedDeptName = filterScope === 'all' ? null
    : filterScope === 'general' ? null
    : departments.find((d) => d.id === filterScope)?.name;

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

      {/* Compact filter bar */}
      <div className="mb-4 flex items-center gap-2 flex-wrap">
        {/* Quick toggles */}
        <button
          type="button"
          onClick={() => setFilterScope('all')}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-1.5 text-sm font-medium transition-colors',
            filterScope === 'all'
              ? 'border-primary bg-primary text-primary-foreground shadow-sm'
              : 'border-border bg-card text-muted-foreground hover:bg-accent hover:text-accent-foreground'
          )}
        >
          Todas
        </button>
        <button
          type="button"
          onClick={() => setFilterScope('general')}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-1.5 text-sm font-medium transition-colors',
            filterScope === 'general'
              ? 'border-primary bg-primary text-primary-foreground shadow-sm'
              : 'border-border bg-card text-muted-foreground hover:bg-accent hover:text-accent-foreground'
          )}
        >
          <Globe className="h-3.5 w-3.5" />
          Generales
        </button>

        {/* Separator */}
        <div className="h-6 w-px bg-border" />

        {/* Department dropdown */}
        <Select
          value={['all', 'general'].includes(filterScope) ? '__none__' : filterScope}
          onValueChange={(v) => setFilterScope(v === '__none__' ? 'all' : v)}
        >
          <SelectTrigger
            className={cn(
              'h-9 w-52 rounded-xl border text-sm font-medium transition-colors',
              !['all', 'general'].includes(filterScope)
                ? 'border-primary bg-primary text-primary-foreground'
                : 'bg-card text-muted-foreground'
            )}
          >
            <Building2 className="mr-1.5 h-3.5 w-3.5 shrink-0" />
            <SelectValue placeholder="Por departamento…" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__" className="text-muted-foreground">Por departamento…</SelectItem>
            {departmentsQuery.isLoading ? (
              <SelectItem value="__loading__" disabled>Cargando…</SelectItem>
            ) : (
              departments.map((dept) => (
                <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
              ))
            )}
          </SelectContent>
        </Select>

        {/* Active filter pill */}
        {!['all', 'general'].includes(filterScope) && selectedDeptName && (
          <Badge variant="secondary" className="gap-1 pr-1.5">
            {selectedDeptName}
            <button type="button" onClick={() => setFilterScope('all')} className="ml-0.5 rounded hover:opacity-70">
              <X className="h-3 w-3" />
            </button>
          </Badge>
        )}

        {/* Count label */}
        <span className="ml-auto text-xs text-muted-foreground">
          {filteredQuestions.length} pregunta{filteredQuestions.length !== 1 ? 's' : ''}
        </span>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[35%]">Pregunta</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Departamento</TableHead>
                <TableHead className="w-24">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {questionsQuery.isLoading ? (
                <TableRow><TableCell colSpan={7} className="py-8 text-center text-muted-foreground">Cargando preguntas...</TableCell></TableRow>
              ) : questionsQuery.isError ? (
                <TableRow><TableCell colSpan={7} className="py-8 text-center text-destructive">No se pudo cargar el banco de preguntas</TableCell></TableRow>
              ) : (
                filteredQuestions.map((question) => (
                  <TableRow key={question.id}>
                    <TableCell className="font-medium">{question.text}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${typeBadgeColor[question.type]}`}>
                        {questionTypeLabels[question.type]}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={question.departmentId ? 'outline' : 'default'} className="text-xs">
                        {getDepartmentLabel(question.departmentId)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => { setEditQuestion(question); setOpen(true); }}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(question.id)} disabled={deleteMutation.isPending}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
              {!questionsQuery.isLoading && !questionsQuery.isError && filteredQuestions.length === 0 && (
                <TableRow><TableCell colSpan={4} className="py-8 text-center text-muted-foreground">Sin preguntas en esta sección</TableCell></TableRow>
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
                onChange={(e) => setEditQuestion((prev) => ({ ...prev, text: e.target.value }))}
                placeholder="¿El profesor explica los conceptos de manera clara?"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tipo</Label>
                <Select
                  value={editQuestion?.type || 'likert'}
                  onValueChange={(v) => setEditQuestion((prev) => ({ ...prev, type: v as QuestionType }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {allTypes.map((t) => <SelectItem key={t} value={t}>{questionTypeLabels[t]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Departamento</Label>
                <Select
                  value={editQuestion?.departmentId ?? '__general__'}
                  onValueChange={(v) => setEditQuestion((prev) => ({ ...prev, departmentId: v === '__general__' ? null : v }))}
                >
                  <SelectTrigger><SelectValue placeholder="General (todos los departamentos)" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__general__">General (todos los departamentos)</SelectItem>
                    {departments.map((dept) => <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {editQuestion?.type === 'likert' && (
              <div>
                <Label>Escala (1 a N)</Label>
                <Select
                  value={String(editQuestion.likertScale || 5)}
                  onValueChange={(v) => setEditQuestion((prev) => ({ ...prev, likertScale: Number(v) }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[3, 4, 5, 7, 10].map((s) => <SelectItem key={s} value={String(s)}>{s} puntos</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}

            {editQuestion?.type === 'multiple_choice' && (
              <div>
                <Label>Opciones de respuesta</Label>
                <div className="mt-2 space-y-2">
                  {(editQuestion.options || []).map((opt, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="flex-1 rounded-md border bg-muted px-3 py-1.5 text-sm">{opt}</span>
                      <Button variant="ghost" size="icon" onClick={() => removeOption(i)}><X className="h-3 w-3" /></Button>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <Input
                      value={newOption}
                      onChange={(e) => setNewOption(e.target.value)}
                      placeholder="Nueva opción"
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addOption(); } }}
                    />
                    <Button variant="outline" size="sm" onClick={addOption}>Agregar</Button>
                  </div>
                </div>
              </div>
            )}

            <Button onClick={handleSave} className="w-full" disabled={upsertMutation.isPending}>
              {upsertMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...</> : 'Guardar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
