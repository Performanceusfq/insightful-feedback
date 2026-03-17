import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { SurveyConfig, questionTypeLabels, questionCategoryLabels } from '@/types/domain';
import { Plus, Pencil, Eye, Trash2, Shuffle, Pin, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import SurveyPreview from './SurveyPreview';
import { getUserFacingErrorMessage } from '@/lib/error-messages';
import {
  deleteSurveyConfig,
  fetchSurveyConfigPageData,
  upsertSurveyConfig,
} from '@/services/admin/survey-configs';

export default function SurveyConfigPage() {
  const queryClient = useQueryClient();
  const [editConfig, setEditConfig] = useState<Partial<SurveyConfig> | null>(null);
  const [open, setOpen] = useState(false);
  const [previewConfigId, setPreviewConfigId] = useState<string | null>(null);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string | null>(null);

  const configsQuery = useQuery({
    queryKey: ['admin-survey-config-page'],
    queryFn: fetchSurveyConfigPageData,
  });

  const upsertMutation = useMutation({
    mutationFn: upsertSurveyConfig,
    onSuccess: (_, variables) => {
      toast.success(variables.id ? 'Encuesta actualizada' : 'Encuesta creada');
      setOpen(false);
      setEditConfig(null);
      queryClient.invalidateQueries({ queryKey: ['admin-survey-config-page'] });
    },
    onError: (error: { message?: string }) => {
      toast.error(getUserFacingErrorMessage(error, 'No se pudo guardar la encuesta'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSurveyConfig,
    onSuccess: () => {
      toast.success('Encuesta eliminada');
      queryClient.invalidateQueries({ queryKey: ['admin-survey-config-page'] });
    },
    onError: (error: { message?: string }) => {
      toast.error(getUserFacingErrorMessage(error, 'No se pudo eliminar la encuesta'));
    },
  });

  const configs = configsQuery.data?.configs ?? [];
  const courses = configsQuery.data?.courses ?? [];
  const departments = configsQuery.data?.departments ?? [];
  const questions = configsQuery.data?.questions ?? [];
  const activeQuestions = questions.filter((question) => question.active);

  const filteredCourses = selectedDepartmentId 
    ? courses.filter(course => course.departmentId === selectedDepartmentId)
    : courses;

  const handleSave = () => {
    if (!editConfig?.courseId || !editConfig?.name?.trim()) {
      toast.error('Nombre y clase son requeridos');
      return;
    }

    const fixedQuestionIds = [...new Set(editConfig.fixedQuestionIds ?? [])];
    const targetTotalCount = Math.max(0, editConfig.randomPool?.count ?? 0);

    if (targetTotalCount > activeQuestions.length) {
      toast.error(`No puedes configurar ${targetTotalCount} preguntas porque solo hay ${activeQuestions.length} preguntas activas en el banco.`);
      return;
    }

    if (targetTotalCount < fixedQuestionIds.length) {
      toast.error(`Has marcado ${fixedQuestionIds.length} preguntas como fijas. El total de preguntas a mostrar debe ser al menos ${fixedQuestionIds.length}.`);
      return;
    }

    const randomQuestionIds = activeQuestions
      .filter((q) => !fixedQuestionIds.includes(q.id))
      .map((q) => q.id);
    
    const randomCount = targetTotalCount - fixedQuestionIds.length;

    upsertMutation.mutate({
      id: editConfig.id,
      courseId: editConfig.courseId,
      name: editConfig.name.trim(),
      fixedQuestionIds,
      randomPool: {
        questionIds: randomQuestionIds,
        count: randomCount,
      },
      active: editConfig.active ?? true,
    });
  };

  const toggleFixed = (questionId: string) => {
    setEditConfig((previous) => {
      if (!previous) return previous;

      const fixedIds = previous.fixedQuestionIds ?? [];
      const currentRandomPool = previous.randomPool ?? { questionIds: [], count: 0 };
      const nextFixedIds = fixedIds.includes(questionId)
        ? fixedIds.filter((id) => id !== questionId)
        : [...fixedIds, questionId];

      return {
        ...previous,
        fixedQuestionIds: nextFixedIds,
      };
    });
  };


  const getCourseName = (courseId: string) => courses.find((course) => course.id === courseId)?.name || courseId;

  const openNew = () => {
    setEditConfig({
      fixedQuestionIds: [],
      randomPool: { questionIds: [], count: 0 },
      active: true,
    });
    setSelectedDepartmentId(null);
    setOpen(true);
  };

  const previewConfig = previewConfigId ? configs.find((config) => config.id === previewConfigId) : null;

  return (
    <div>
      <PageHeader
        title="Configuración de Encuestas"
        description="Define preguntas fijas y aleatorias para cada clase"
        action={<Button onClick={openNew}><Plus className="mr-2 h-4 w-4" /> Nueva Encuesta</Button>}
      />

      {configsQuery.isLoading ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">Cargando configuraciones...</CardContent>
        </Card>
      ) : configsQuery.isError ? (
        <Card>
          <CardContent className="py-12 text-center text-destructive">No se pudo cargar configuraciones de encuestas</CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {configs.map((config) => (
            <Card key={config.id}>
              <CardHeader className="flex flex-row items-start justify-between pb-3">
                <div>
                  <CardTitle className="text-base">{config.name}</CardTitle>
                  <p className="mt-0.5 text-sm text-muted-foreground">{getCourseName(config.courseId)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={config.active}
                    onCheckedChange={(checked) => {
                      upsertMutation.mutate({
                        ...config,
                        active: checked,
                      });
                    }}
                  />
                  <Badge variant={config.active ? 'default' : 'secondary'}>
                    {config.active ? 'Activa' : 'Inactiva'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><Pin className="h-3 w-3" /> {config.fixedQuestionIds.length} fijas</span>
                  <span className="flex items-center gap-1"><Shuffle className="h-3 w-3" /> {config.randomPool.count} aleatorias</span>
                  <span className="font-semibold text-primary">· {config.fixedQuestionIds.length + config.randomPool.count} total</span>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => { setEditConfig(config); setOpen(true); }}>
                    <Pencil className="mr-1 h-3 w-3" /> Editar
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setPreviewConfigId(config.id)}>
                    <Eye className="mr-1 h-3 w-3" /> Vista previa
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteMutation.mutate(config.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {configs.length === 0 && (
            <Card className="col-span-2">
              <CardContent className="py-12 text-center text-muted-foreground">No hay encuestas configuradas</CardContent>
            </Card>
          )}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editConfig?.id ? 'Editar' : 'Nueva'} Encuesta</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 pt-2">
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-1">
                <Label>Departamento</Label>
                <Select
                  value={selectedDepartmentId || 'all'}
                  onValueChange={(value) => setSelectedDepartmentId(value === 'all' ? null : value)}
                >
                  <SelectTrigger><SelectValue placeholder="Filtrar por" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-1">
                <Label>Nombre</Label>
                <Input
                  value={editConfig?.name || ''}
                  onChange={(event) => setEditConfig((previous) => ({ ...previous, name: event.target.value }))}
                  placeholder="Encuesta semestral"
                />
              </div>
              <div className="col-span-1">
                <Label>Clase</Label>
                <Select
                  value={editConfig?.courseId || ''}
                  onValueChange={(value) => setEditConfig((previous) => ({ ...previous, courseId: value }))}
                >
                  <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                  <SelectContent>
                    {filteredCourses.map((course) => (
                      <SelectItem key={course.id} value={course.id}>{course.name} ({course.code})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Total de preguntas a mostrar (fijas + aleatorias)</Label>
              <Input
                type="number"
                min={0}
                value={(editConfig?.randomPool?.count || 0) + (editConfig?.fixedQuestionIds?.length || 0)}
                onChange={(event) => {
                  const total = Number(event.target.value);
                  setEditConfig((previous) => {
                    if (!previous) return previous;
                    const fixedCount = previous.fixedQuestionIds?.length || 0;
                    return {
                      ...previous,
                      randomPool: {
                        questionIds: previous.randomPool?.questionIds || [],
                        count: Math.max(0, (Number.isNaN(total) ? 0 : total)),
                      },
                    };
                  });
                }}
                className="w-24"
              />
              <p className="mt-1 text-xs text-muted-foreground">El sistema completará con preguntas aleatorias si el total es mayor a las preguntas fijas seleccionadas</p>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <Label>Seleccionar preguntas</Label>
                <span className="text-xs text-muted-foreground italic">(las preguntas no marcadas fijas seran de aparicion aleatoria)</span>
              </div>
              <div className="mt-3 space-y-2 rounded-lg border p-3">
                {activeQuestions.map((question) => {
                  const isFixed = editConfig?.fixedQuestionIds?.includes(question.id);
                  const isRandom = editConfig?.randomPool?.questionIds?.includes(question.id);

                  return (
                    <div key={question.id} className="flex items-center gap-3 rounded-md p-2 hover:bg-muted/50">
                      <div className="flex-1">
                        <p className="text-sm">{question.text}</p>
                        <div className="mt-0.5 flex gap-2">
                          <span className="text-xs text-muted-foreground">{questionTypeLabels[question.type]}</span>
                          <span className="text-xs text-muted-foreground">· {questionCategoryLabels[question.category]}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant={isFixed ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => toggleFixed(question.id)}
                          className="h-7 text-xs"
                        >
                          <Pin className="mr-1 h-3 w-3" /> Fija
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
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

      {previewConfig && (
        <SurveyPreview
          config={previewConfig}
          questions={questions}
          courses={courses}
          onClose={() => setPreviewConfigId(null)}
        />
      )}
    </div>
  );
}
