import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { mockSurveyConfigs as initialConfigs, mockQuestions } from '@/data/mock-questions';
import { mockCourses } from '@/data/mock-data';
import { SurveyConfig, questionTypeLabels, questionCategoryLabels } from '@/types/domain';
import { Plus, Pencil, Eye, Trash2, Shuffle, Pin } from 'lucide-react';
import { toast } from 'sonner';
import SurveyPreview from './SurveyPreview';

export default function SurveyConfigPage() {
  const [configs, setConfigs] = useState<SurveyConfig[]>(initialConfigs);
  const [editConfig, setEditConfig] = useState<Partial<SurveyConfig> | null>(null);
  const [open, setOpen] = useState(false);
  const [previewConfigId, setPreviewConfigId] = useState<string | null>(null);

  const activeQuestions = mockQuestions.filter(q => q.active);

  const handleSave = () => {
    if (!editConfig?.courseId || !editConfig?.name) {
      toast.error('Nombre y clase son requeridos');
      return;
    }
    const config: SurveyConfig = {
      id: editConfig.id || `s${Date.now()}`,
      courseId: editConfig.courseId,
      name: editConfig.name,
      fixedQuestionIds: editConfig.fixedQuestionIds || [],
      randomPool: editConfig.randomPool || { questionIds: [], count: 0 },
      active: editConfig.active ?? true,
    };
    if (editConfig.id) {
      setConfigs(prev => prev.map(c => c.id === config.id ? config : c));
      toast.success('Encuesta actualizada');
    } else {
      setConfigs(prev => [...prev, config]);
      toast.success('Encuesta creada');
    }
    setOpen(false);
    setEditConfig(null);
  };

  const toggleFixed = (qId: string) => {
    setEditConfig(prev => {
      const ids = prev?.fixedQuestionIds || [];
      const newIds = ids.includes(qId) ? ids.filter(x => x !== qId) : [...ids, qId];
      // Remove from random pool if added to fixed
      const randomIds = (prev?.randomPool?.questionIds || []).filter(x => x !== qId);
      return { ...prev, fixedQuestionIds: newIds, randomPool: { ...prev?.randomPool!, questionIds: randomIds, count: prev?.randomPool?.count || 0 } };
    });
  };

  const toggleRandom = (qId: string) => {
    setEditConfig(prev => {
      const ids = prev?.randomPool?.questionIds || [];
      const newIds = ids.includes(qId) ? ids.filter(x => x !== qId) : [...ids, qId];
      // Remove from fixed if added to random
      const fixedIds = (prev?.fixedQuestionIds || []).filter(x => x !== qId);
      return { ...prev, fixedQuestionIds: fixedIds, randomPool: { questionIds: newIds, count: prev?.randomPool?.count || 0 } };
    });
  };

  const getCourseName = (id: string) => mockCourses.find(c => c.id === id)?.name || id;

  const openNew = () => {
    setEditConfig({ fixedQuestionIds: [], randomPool: { questionIds: [], count: 2 }, active: true });
    setOpen(true);
  };

  return (
    <div>
      <PageHeader
        title="Configuración de Encuestas"
        description="Define preguntas fijas y aleatorias para cada clase"
        action={<Button onClick={openNew}><Plus className="mr-2 h-4 w-4" /> Nueva Encuesta</Button>}
      />

      <div className="grid gap-4 md:grid-cols-2">
        {configs.map(config => (
          <Card key={config.id}>
            <CardHeader className="flex flex-row items-start justify-between pb-3">
              <div>
                <CardTitle className="text-base">{config.name}</CardTitle>
                <p className="mt-0.5 text-sm text-muted-foreground">{getCourseName(config.courseId)}</p>
              </div>
              <Badge variant={config.active ? 'default' : 'secondary'}>
                {config.active ? 'Activa' : 'Inactiva'}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><Pin className="h-3 w-3" /> {config.fixedQuestionIds.length} fijas</span>
                <span className="flex items-center gap-1"><Shuffle className="h-3 w-3" /> {config.randomPool.count} de {config.randomPool.questionIds.length} aleatorias</span>
              </div>
              <div className="mt-4 flex gap-2">
                <Button variant="outline" size="sm" onClick={() => { setEditConfig(config); setOpen(true); }}>
                  <Pencil className="mr-1 h-3 w-3" /> Editar
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPreviewConfigId(config.id)}>
                  <Eye className="mr-1 h-3 w-3" /> Vista previa
                </Button>
                <Button variant="ghost" size="sm" onClick={() => { setConfigs(prev => prev.filter(c => c.id !== config.id)); toast.success('Eliminada'); }}>
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

      {/* Edit/Create Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editConfig?.id ? 'Editar' : 'Nueva'} Encuesta</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nombre</Label>
                <Input value={editConfig?.name || ''} onChange={e => setEditConfig(prev => ({ ...prev, name: e.target.value }))} placeholder="Encuesta semestral" />
              </div>
              <div>
                <Label>Clase</Label>
                <Select value={editConfig?.courseId || ''} onValueChange={v => setEditConfig(prev => ({ ...prev, courseId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                  <SelectContent>
                    {mockCourses.map(c => <SelectItem key={c.id} value={c.id}>{c.name} ({c.code})</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Preguntas aleatorias a mostrar</Label>
              <Input
                type="number" min={0}
                value={editConfig?.randomPool?.count || 0}
                onChange={e => setEditConfig(prev => ({
                  ...prev,
                  randomPool: { ...prev?.randomPool!, count: Number(e.target.value) },
                }))}
                className="w-24"
              />
              <p className="mt-1 text-xs text-muted-foreground">Cantidad de preguntas aleatorias que se seleccionarán del pool</p>
            </div>

            <div>
              <Label className="mb-3 block">Seleccionar preguntas</Label>
              <div className="space-y-2 rounded-lg border p-3">
                {activeQuestions.map(q => {
                  const isFixed = editConfig?.fixedQuestionIds?.includes(q.id);
                  const isRandom = editConfig?.randomPool?.questionIds?.includes(q.id);
                  return (
                    <div key={q.id} className="flex items-center gap-3 rounded-md p-2 hover:bg-muted/50">
                      <div className="flex-1">
                        <p className="text-sm">{q.text}</p>
                        <div className="mt-0.5 flex gap-2">
                          <span className="text-xs text-muted-foreground">{questionTypeLabels[q.type]}</span>
                          <span className="text-xs text-muted-foreground">· {questionCategoryLabels[q.category]}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant={isFixed ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => toggleFixed(q.id)}
                          className="h-7 text-xs"
                        >
                          <Pin className="mr-1 h-3 w-3" /> Fija
                        </Button>
                        <Button
                          variant={isRandom ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => toggleRandom(q.id)}
                          className="h-7 text-xs"
                        >
                          <Shuffle className="mr-1 h-3 w-3" /> Aleatoria
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={editConfig?.active ?? true}
                onCheckedChange={checked => setEditConfig(prev => ({ ...prev, active: checked }))}
              />
              <Label>Encuesta activa</Label>
            </div>

            <Button onClick={handleSave} className="w-full">Guardar</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      {previewConfigId && (
        <SurveyPreview
          config={configs.find(c => c.id === previewConfigId)!}
          onClose={() => setPreviewConfigId(null)}
        />
      )}
    </div>
  );
}
