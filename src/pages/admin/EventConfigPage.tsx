import { useState } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { mockCourses, mockProfessors } from '@/data/mock-data';
import { mockSurveyConfigs } from '@/data/mock-questions';
import { mockEventConfigs } from '@/data/mock-events';
import { ClassEventConfig, EventFrequency, eventFrequencyLabels } from '@/types/domain';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Pencil, CalendarClock } from 'lucide-react';

const dayLabels = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export default function EventConfigPage() {
  const [configs, setConfigs] = useState<ClassEventConfig[]>(mockEventConfigs);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ClassEventConfig | null>(null);

  // form state
  const [courseId, setCourseId] = useState('');
  const [surveyConfigId, setSurveyConfigId] = useState('');
  const [frequency, setFrequency] = useState<EventFrequency>('per_class');
  const [expirationMinutes, setExpirationMinutes] = useState(15);
  const [scheduledDays, setScheduledDays] = useState<number[]>([]);
  const [scheduledTime, setScheduledTime] = useState('10:00');
  const [active, setActive] = useState(true);

  const openCreate = () => {
    setEditing(null);
    setCourseId('');
    setSurveyConfigId('');
    setFrequency('per_class');
    setExpirationMinutes(15);
    setScheduledDays([]);
    setScheduledTime('10:00');
    setActive(true);
    setDialogOpen(true);
  };

  const openEdit = (c: ClassEventConfig) => {
    setEditing(c);
    setCourseId(c.courseId);
    setSurveyConfigId(c.surveyConfigId);
    setFrequency(c.frequency);
    setExpirationMinutes(c.expirationMinutes);
    setScheduledDays(c.scheduledDays);
    setScheduledTime(c.scheduledTime);
    setActive(c.active);
    setDialogOpen(true);
  };

  const toggleDay = (day: number) => {
    setScheduledDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day].sort()
    );
  };

  const save = () => {
    const data: ClassEventConfig = {
      id: editing?.id || `ec${Date.now()}`,
      courseId,
      surveyConfigId,
      frequency,
      expirationMinutes,
      scheduledDays,
      scheduledTime,
      active,
    };
    if (editing) {
      setConfigs(prev => prev.map(c => (c.id === editing.id ? data : c)));
    } else {
      setConfigs(prev => [...prev, data]);
    }
    setDialogOpen(false);
  };

  const courseName = (id: string) => mockCourses.find(c => c.id === id)?.name ?? '—';
  const surveyName = (id: string) => mockSurveyConfigs.find(s => s.id === id)?.name ?? 'Sin encuesta';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configuración de Eventos"
        description="Define la frecuencia, horario y expiración de los eventos QR por clase."
        action={
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Configuración
          </Button>
        }
      />

      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Clase</TableHead>
              <TableHead>Encuesta</TableHead>
              <TableHead>Frecuencia</TableHead>
              <TableHead>Días</TableHead>
              <TableHead>Hora</TableHead>
              <TableHead>Expiración</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {configs.map(c => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{courseName(c.courseId)}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{surveyName(c.surveyConfigId)}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{eventFrequencyLabels[c.frequency]}</Badge>
                </TableCell>
                <TableCell className="text-sm">
                  {c.scheduledDays.length > 0
                    ? c.scheduledDays.map(d => dayLabels[d]).join(', ')
                    : '—'}
                </TableCell>
                <TableCell className="text-sm">{c.scheduledTime}</TableCell>
                <TableCell className="text-sm">{c.expirationMinutes} min</TableCell>
                <TableCell>
                  <Badge variant={c.active ? 'default' : 'outline'}>
                    {c.active ? 'Activo' : 'Inactivo'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={() => openEdit(c)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarClock className="h-5 w-5" />
              {editing ? 'Editar Configuración' : 'Nueva Configuración de Evento'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Course */}
            <div className="space-y-1.5">
              <Label>Clase</Label>
              <Select value={courseId} onValueChange={setCourseId}>
                <SelectTrigger><SelectValue placeholder="Seleccionar clase" /></SelectTrigger>
                <SelectContent>
                  {mockCourses.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name} ({c.code})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Survey */}
            <div className="space-y-1.5">
              <Label>Encuesta asociada</Label>
              <Select value={surveyConfigId} onValueChange={setSurveyConfigId}>
                <SelectTrigger><SelectValue placeholder="Seleccionar encuesta" /></SelectTrigger>
                <SelectContent>
                  {mockSurveyConfigs.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Frequency */}
            <div className="space-y-1.5">
              <Label>Frecuencia</Label>
              <Select value={frequency} onValueChange={(v) => setFrequency(v as EventFrequency)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(eventFrequencyLabels).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Scheduled days */}
            {frequency !== 'manual' && (
              <div className="space-y-1.5">
                <Label>Días programados</Label>
                <div className="flex flex-wrap gap-2">
                  {dayLabels.map((label, idx) => (
                    <label
                      key={idx}
                      className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm cursor-pointer hover:bg-accent transition-colors"
                    >
                      <Checkbox
                        checked={scheduledDays.includes(idx)}
                        onCheckedChange={() => toggleDay(idx)}
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Time */}
            {frequency !== 'manual' && (
              <div className="space-y-1.5">
                <Label>Hora programada</Label>
                <Input type="time" value={scheduledTime} onChange={e => setScheduledTime(e.target.value)} />
              </div>
            )}

            {/* Expiration */}
            <div className="space-y-1.5">
              <Label>Tiempo de expiración del QR (minutos)</Label>
              <Input
                type="number"
                min={1}
                max={120}
                value={expirationMinutes}
                onChange={e => setExpirationMinutes(Number(e.target.value))}
              />
            </div>

            {/* Active */}
            <div className="flex items-center gap-3">
              <Switch checked={active} onCheckedChange={setActive} />
              <Label>Configuración activa</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={save} disabled={!courseId}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
