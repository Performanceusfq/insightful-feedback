import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/shared/PageHeader';
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
import { Plus, Pencil, CalendarClock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { getUserFacingErrorMessage } from '@/lib/error-messages';
import { fetchEventConfigPageData, upsertEventConfig } from '@/services/admin/event-configs';

const dayLabels = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export default function EventConfigPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ClassEventConfig | null>(null);

  const [courseId, setCourseId] = useState('');
  const [surveyConfigId, setSurveyConfigId] = useState('');
  const [frequency, setFrequency] = useState<EventFrequency>('per_class');
  const [expirationMinutes, setExpirationMinutes] = useState(15);
  const [scheduledDays, setScheduledDays] = useState<number[]>([]);
  const [scheduledTime, setScheduledTime] = useState('10:00');
  const [active, setActive] = useState(true);

  const pageDataQuery = useQuery({
    queryKey: ['admin-event-config-page'],
    queryFn: fetchEventConfigPageData,
  });

  const upsertMutation = useMutation({
    mutationFn: upsertEventConfig,
    onSuccess: () => {
      toast.success(editing ? 'Configuración actualizada' : 'Configuración creada');
      setDialogOpen(false);
      setEditing(null);
      queryClient.invalidateQueries({ queryKey: ['admin-event-config-page'] });
    },
    onError: (error: { message?: string }) => {
      toast.error(getUserFacingErrorMessage(error, 'No se pudo guardar la configuración'));
    },
  });

  const configs = pageDataQuery.data?.configs ?? [];
  const courses = pageDataQuery.data?.courses ?? [];
  const surveys = pageDataQuery.data?.surveys ?? [];

  const visibleSurveys = courseId ? surveys.filter((survey) => survey.courseId === courseId) : surveys;

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

  const openEdit = (config: ClassEventConfig) => {
    setEditing(config);
    setCourseId(config.courseId);
    setSurveyConfigId(config.surveyConfigId);
    setFrequency(config.frequency);
    setExpirationMinutes(config.expirationMinutes);
    setScheduledDays(config.scheduledDays);
    setScheduledTime(config.scheduledTime);
    setActive(config.active);
    setDialogOpen(true);
  };

  const toggleDay = (day: number) => {
    setScheduledDays((previous) => (
      previous.includes(day) ? previous.filter((value) => value !== day) : [...previous, day].sort()
    ));
  };

  const save = () => {
    if (!courseId || !surveyConfigId) {
      toast.error('Clase y encuesta son requeridas');
      return;
    }

    upsertMutation.mutate({
      id: editing?.id,
      courseId,
      surveyConfigId,
      frequency,
      expirationMinutes,
      scheduledDays,
      scheduledTime,
      active,
    });
  };

  const courseName = (id: string) => courses.find((course) => course.id === id)?.name ?? '—';
  const surveyName = (id: string) => surveys.find((survey) => survey.id === id)?.name ?? 'Sin encuesta';

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
            {pageDataQuery.isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">Cargando configuraciones...</TableCell>
              </TableRow>
            ) : pageDataQuery.isError ? (
              <TableRow>
                <TableCell colSpan={8} className="py-8 text-center text-destructive">No se pudo cargar configuraciones de eventos</TableCell>
              </TableRow>
            ) : configs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">Sin configuraciones de eventos</TableCell>
              </TableRow>
            ) : (
              configs.map((config) => (
                <TableRow key={config.id}>
                  <TableCell className="font-medium">{courseName(config.courseId)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{surveyName(config.surveyConfigId)}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{eventFrequencyLabels[config.frequency]}</Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {config.scheduledDays.length > 0
                      ? config.scheduledDays.map((day) => dayLabels[day]).join(', ')
                      : '—'}
                  </TableCell>
                  <TableCell className="text-sm">{config.scheduledTime}</TableCell>
                  <TableCell className="text-sm">{config.expirationMinutes} min</TableCell>
                  <TableCell>
                    <Badge variant={config.active ? 'default' : 'outline'}>
                      {config.active ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => openEdit(config)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
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
            <div className="space-y-1.5">
              <Label>Clase</Label>
              <Select value={courseId} onValueChange={(value) => {
                setCourseId(value);
                const surveyForCourse = surveys.find((survey) => survey.courseId === value);
                setSurveyConfigId((previous) => (
                  previous && surveys.some((survey) => survey.id === previous && survey.courseId === value)
                    ? previous
                    : surveyForCourse?.id || ''
                ));
              }}>
                <SelectTrigger><SelectValue placeholder="Seleccionar clase" /></SelectTrigger>
                <SelectContent>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>{course.name} ({course.code})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Encuesta asociada</Label>
              <Select value={surveyConfigId} onValueChange={setSurveyConfigId}>
                <SelectTrigger><SelectValue placeholder="Seleccionar encuesta" /></SelectTrigger>
                <SelectContent>
                  {visibleSurveys.map((survey) => (
                    <SelectItem key={survey.id} value={survey.id}>{survey.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Frecuencia</Label>
              <Select value={frequency} onValueChange={(value) => setFrequency(value as EventFrequency)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(eventFrequencyLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {frequency !== 'manual' && (
              <div className="space-y-1.5">
                <Label>Días programados</Label>
                <div className="flex flex-wrap gap-2">
                  {dayLabels.map((label, index) => (
                    <label
                      key={index}
                      className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm cursor-pointer hover:bg-accent transition-colors"
                    >
                      <Checkbox checked={scheduledDays.includes(index)} onCheckedChange={() => toggleDay(index)} />
                      {label}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {frequency !== 'manual' && (
              <div className="space-y-1.5">
                <Label>Hora programada</Label>
                <Input type="time" value={scheduledTime} onChange={(event) => setScheduledTime(event.target.value)} />
              </div>
            )}

            <div className="space-y-1.5">
              <Label>Tiempo de expiración del QR (minutos)</Label>
              <Input
                type="number"
                min={1}
                max={240}
                value={expirationMinutes}
                onChange={(event) => setExpirationMinutes(Number(event.target.value) || 1)}
              />
            </div>

            <div className="flex items-center gap-3">
              <Switch checked={active} onCheckedChange={setActive} />
              <Label>Configuración activa</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={save} disabled={!courseId || !surveyConfigId || upsertMutation.isPending}>
              {upsertMutation.isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...</>
              ) : (
                'Guardar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
