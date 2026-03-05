import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QRCodeSVG } from 'qrcode.react';
import { PageHeader } from '@/components/shared/PageHeader';
import { useAuth } from '@/context/AuthContext';
import { eventStatusLabels, type EventStatus } from '@/types/domain';
import { fetchProfessorEvents, generateProfessorEvent } from '@/services/professor-events';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { QrCode, Timer, Users, Plus, RefreshCw, Loader2, AlertTriangle } from 'lucide-react';

const statusVariant: Record<EventStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  active: 'default',
  scheduled: 'secondary',
  expired: 'destructive',
  cancelled: 'outline',
};

function Countdown({ expiresAt }: { expiresAt: string }) {
  const [remaining, setRemaining] = useState('');

  useEffect(() => {
    const tick = () => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) {
        setRemaining('Expirado');
        return;
      }
      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setRemaining(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  return <span className="font-mono text-lg font-bold tabular-nums">{remaining}</span>;
}

export default function EventosQRPage() {
  const { currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const currentUserId = currentUser?.id;

  const eventsQuery = useQuery({
    queryKey: ['professor-events', currentUserId],
    queryFn: () => fetchProfessorEvents(currentUserId ?? ''),
    enabled: Boolean(currentUserId),
  });

  const generateEventMutation = useMutation({
    mutationFn: generateProfessorEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professor-events', currentUserId] });
    },
  });

  const myCourses = eventsQuery.data?.courses ?? [];
  const events = eventsQuery.data?.events;

  const filteredEvents = useMemo(
    () => {
      const eventList = events ?? [];
      return selectedCourse === 'all'
        ? eventList
        : eventList.filter((event) => event.courseId === selectedCourse);
    },
    [events, selectedCourse],
  );

  const activeEvent = useMemo(
    () => filteredEvents.find((event) => event.status === 'active' && new Date(event.expiresAt).getTime() > Date.now()),
    [filteredEvents],
  );

  const generateNewEvent = () => {
    const courseId = selectedCourse === 'all' ? myCourses[0]?.id : selectedCourse;

    if (!courseId || generateEventMutation.isPending) {
      return;
    }

    generateEventMutation.mutate(courseId);
  };

  const courseName = (id: string) => myCourses.find((course) => course.id === id)?.name ?? '—';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Eventos QR"
        description="Genera y gestiona códigos QR para activar encuestas en tus clases."
        action={
          <div className="flex items-center gap-3">
            <Select value={selectedCourse} onValueChange={setSelectedCourse}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Todas las clases" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las clases</SelectItem>
                {myCourses.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={generateNewEvent} disabled={myCourses.length === 0 || generateEventMutation.isPending}>
              {generateEventMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Generar Evento
            </Button>
          </div>
        }
      />

      {eventsQuery.isLoading ? (
        <Card>
          <CardContent className="py-10 text-center">
            <Loader2 className="mx-auto mb-2 h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Cargando eventos...</p>
          </CardContent>
        </Card>
      ) : eventsQuery.isError ? (
        <Card>
          <CardContent className="py-10 text-center">
            <AlertTriangle className="mx-auto mb-2 h-8 w-8 text-destructive" />
            <p className="text-sm text-muted-foreground">No se pudo cargar los eventos del profesor.</p>
            <Button variant="outline" className="mt-4" onClick={() => eventsQuery.refetch()}>
              Reintentar
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {activeEvent && (
            <Card className="border-primary/30 bg-primary/5">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <QrCode className="h-5 w-5 text-primary" />
                  Evento Activo — {courseName(activeEvent.courseId)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
                  <div className="flex flex-col items-center gap-3">
                    <div className="rounded-xl border-2 border-primary/20 bg-white p-4">
                      <QRCodeSVG
                        value={`${window.location.origin}/estudiante/encuesta/${activeEvent.qrCode}`}
                        size={200}
                        level="H"
                        includeMargin={false}
                      />
                    </div>
                    <code className="rounded bg-muted px-3 py-1 text-sm font-mono tracking-widest">
                      {activeEvent.qrCode}
                    </code>
                  </div>

                  <div className="flex flex-1 flex-col gap-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="rounded-lg border bg-card p-4 text-center">
                        <Timer className="mx-auto mb-1 h-5 w-5 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground mb-1">Expira en</p>
                        <Countdown expiresAt={activeEvent.expiresAt} />
                      </div>
                      <div className="rounded-lg border bg-card p-4 text-center">
                        <Users className="mx-auto mb-1 h-5 w-5 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground mb-1">Respuestas</p>
                        <span className="text-lg font-bold">{activeEvent.responsesCount}</span>
                      </div>
                    </div>
                    <Button variant="outline" onClick={generateNewEvent} className="w-fit" disabled={generateEventMutation.isPending}>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Regenerar QR
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div>
            <h3 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Historial de Eventos
            </h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filteredEvents
                .filter((event) => event.id !== activeEvent?.id)
                .map((event) => (
                  <Card key={event.id} className="relative">
                    <CardContent className="pt-5">
                      <div className="flex items-start justify-between mb-3">
                        <p className="font-medium text-sm">{courseName(event.courseId)}</p>
                        <Badge variant={statusVariant[event.status]}>
                          {eventStatusLabels[event.status]}
                        </Badge>
                      </div>
                      <div className="space-y-1 text-xs text-muted-foreground">
                        <p>
                          Código: <code className="font-mono">{event.qrCode}</code>
                        </p>
                        <p>Creado: {new Date(event.createdAt).toLocaleString('es')}</p>
                        <p>
                          Respuestas: <span className="font-semibold text-foreground">{event.responsesCount}</span>
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
