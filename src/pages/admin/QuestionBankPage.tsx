import { useState } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { mockQuestions as initialQuestions } from '@/data/mock-questions';
import {
  Question, QuestionType, QuestionCategory,
  questionTypeLabels, questionCategoryLabels,
} from '@/types/domain';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';

const allTypes: QuestionType[] = ['likert', 'open', 'multiple_choice'];
const allCategories: QuestionCategory[] = ['pedagogia', 'contenido', 'evaluacion', 'comunicacion', 'general'];

const typeBadgeColor: Record<QuestionType, string> = {
  likert: 'bg-primary/10 text-primary',
  open: 'bg-accent/20 text-accent-foreground',
  multiple_choice: 'bg-warning/10 text-warning',
};

export default function QuestionBankPage() {
  const [questions, setQuestions] = useState<Question[]>(initialQuestions);
  const [editQ, setEditQ] = useState<Partial<Question> | null>(null);
  const [open, setOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [newOption, setNewOption] = useState('');

  const filtered = filterCategory === 'all'
    ? questions
    : questions.filter(q => q.category === filterCategory);

  const handleSave = () => {
    if (!editQ?.text || !editQ?.type || !editQ?.category) {
      toast.error('Texto, tipo y categoría son requeridos');
      return;
    }
    if (editQ.type === 'multiple_choice' && (!editQ.options || editQ.options.length < 2)) {
      toast.error('Las preguntas de opción múltiple necesitan al menos 2 opciones');
      return;
    }
    if (editQ.id) {
      setQuestions(prev => prev.map(q => q.id === editQ.id ? { ...q, ...editQ } as Question : q));
      toast.success('Pregunta actualizada');
    } else {
      const newQ: Question = {
        id: `q${Date.now()}`,
        text: editQ.text,
        type: editQ.type,
        category: editQ.category,
        options: editQ.options,
        likertScale: editQ.type === 'likert' ? (editQ.likertScale || 5) : undefined,
        required: editQ.required ?? false,
        active: true,
      };
      setQuestions(prev => [...prev, newQ]);
      toast.success('Pregunta creada');
    }
    setOpen(false);
    setEditQ(null);
  };

  const addOption = () => {
    if (!newOption.trim()) return;
    setEditQ(prev => ({
      ...prev,
      options: [...(prev?.options || []), newOption.trim()],
    }));
    setNewOption('');
  };

  const removeOption = (idx: number) => {
    setEditQ(prev => ({
      ...prev,
      options: (prev?.options || []).filter((_, i) => i !== idx),
    }));
  };

  const openNew = () => {
    setEditQ({ type: 'likert', category: 'general', required: false, options: [] });
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

      {/* Filter tabs */}
      <Tabs value={filterCategory} onValueChange={setFilterCategory} className="mb-4">
        <TabsList>
          <TabsTrigger value="all">Todas</TabsTrigger>
          {allCategories.map(c => (
            <TabsTrigger key={c} value={c}>{questionCategoryLabels[c]}</TabsTrigger>
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
              {filtered.map(q => (
                <TableRow key={q.id}>
                  <TableCell className="font-medium">{q.text}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${typeBadgeColor[q.type]}`}>
                      {questionTypeLabels[q.type]}
                    </span>
                  </TableCell>
                  <TableCell><Badge variant="secondary">{questionCategoryLabels[q.category]}</Badge></TableCell>
                  <TableCell>{q.required ? '✓' : '—'}</TableCell>
                  <TableCell>
                    <Switch
                      checked={q.active}
                      onCheckedChange={checked =>
                        setQuestions(prev => prev.map(x => x.id === q.id ? { ...x, active: checked } : x))
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => { setEditQ(q); setOpen(true); }}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => { setQuestions(prev => prev.filter(x => x.id !== q.id)); toast.success('Pregunta eliminada'); }}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">Sin preguntas en esta categoría</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit/Create Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editQ?.id ? 'Editar' : 'Nueva'} Pregunta</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label>Texto de la pregunta</Label>
              <Textarea
                value={editQ?.text || ''}
                onChange={e => setEditQ(prev => ({ ...prev, text: e.target.value }))}
                placeholder="¿El profesor explica los conceptos de manera clara?"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tipo</Label>
                <Select value={editQ?.type || 'likert'} onValueChange={v => setEditQ(prev => ({ ...prev, type: v as QuestionType }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {allTypes.map(t => <SelectItem key={t} value={t}>{questionTypeLabels[t]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Categoría</Label>
                <Select value={editQ?.category || 'general'} onValueChange={v => setEditQ(prev => ({ ...prev, category: v as QuestionCategory }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {allCategories.map(c => <SelectItem key={c} value={c}>{questionCategoryLabels[c]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {editQ?.type === 'likert' && (
              <div>
                <Label>Escala (1 a N)</Label>
                <Select value={String(editQ.likertScale || 5)} onValueChange={v => setEditQ(prev => ({ ...prev, likertScale: Number(v) }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[3, 4, 5, 7, 10].map(n => <SelectItem key={n} value={String(n)}>{n} puntos</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}

            {editQ?.type === 'multiple_choice' && (
              <div>
                <Label>Opciones de respuesta</Label>
                <div className="mt-2 space-y-2">
                  {(editQ.options || []).map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="flex-1 rounded-md border bg-muted px-3 py-1.5 text-sm">{opt}</span>
                      <Button variant="ghost" size="icon" onClick={() => removeOption(idx)}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <Input
                      value={newOption}
                      onChange={e => setNewOption(e.target.value)}
                      placeholder="Nueva opción"
                      onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addOption())}
                    />
                    <Button variant="outline" size="sm" onClick={addOption}>Agregar</Button>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Switch
                checked={editQ?.required ?? false}
                onCheckedChange={checked => setEditQ(prev => ({ ...prev, required: checked }))}
              />
              <Label>Pregunta requerida</Label>
            </div>

            <Button onClick={handleSave} className="w-full">Guardar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
