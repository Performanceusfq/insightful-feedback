import { useState, useEffect, useMemo } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { PageHeader } from '@/components/shared/PageHeader';
import { useAuth } from '@/context/AuthContext';
import { mockCourses, mockProfessors } from '@/data/mock-data';
import { mockEventConfigs, mockEvents } from '@/data/mock-events';
import { ClassEvent, EventStatus, eventStatusLabels } from '@/types/domain';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { QrCode, Timer, Users, Plus, RefreshCw } from 'lucide-react';

function generateToken(): string {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

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
      const m = Math.floor(diff / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setRemaining(`${m}:${s.toString().padStart(2, '0')}`);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  return (
    <span className="font-mono text-lg font-bold tabular-nums">
      {remaining}
    </span>
  );
}

export default function EventosQRPage() {
  const { currentUser } = useAuth();
  const [events, setEvents] = useState<ClassEvent[]>(mockEvents);
  const [selectedCourse, setSelectedCourse] = useState<string>('all');

  // Get professor's courses
  const professor = mockProfessors.find(p => p.userId === currentUser.id);
  const myCourses = useMemo(
    () => (professor ? mockCourses.filter(c => c.professorId === professor.id) : mockCourses),
    [professor]
  );

  const filteredEvents = useMemo(
    () =>
      selectedCourse === 'all'
        ? events
        : events.filter(e => e.courseId === selectedCourse),
    [events, selectedCourse]
  );

  const generateNewEvent = () => {
    const courseId = selectedCourse === 'all' ? myCourses[0]?.id : selectedCourse;
    if (!courseId) return;
    const config = mockEventConfigs.find(ec => ec.courseId === courseId);
    const expMin = config?.expirationMinutes ?? 15;
    const now = new Date();
    const newEvent: ClassEvent = {
      id: `ev${Date.now()}`,
      configId: config?.id ?? '',
      courseId,
      qrCode: generateToken(),
      status: 'active',
      createdAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + expMin * 60 * 1000).toISOString(),
      responsesCount: 0,
    };
    setEvents(prev => [newEvent, ...prev]);
  };

  const courseName = (id: string) => mockCourses.find(c => c.id === id)?.name ?? '—';

  const activeEvent = filteredEvents.find(e => e.status === 'active');

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
                {myCourses.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={generateNewEvent}>
              <Plus className="mr-2 h-4 w-4" />
              Generar Evento
            </Button>
          </div>
        }
      />

      {/* Active QR card */}
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
              {/* QR Code */}
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

              {/* Info */}
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
                <Button variant="outline" onClick={generateNewEvent} className="w-fit">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Regenerar QR
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* History */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Historial de Eventos
        </h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredEvents
            .filter(e => e.id !== activeEvent?.id)
            .map(event => (
              <Card key={event.id} className="relative">
                <CardContent className="pt-5">
                  <div className="flex items-start justify-between mb-3">
                    <p className="font-medium text-sm">{courseName(event.courseId)}</p>
                    <Badge variant={statusVariant[event.status]}>
                      {eventStatusLabels[event.status]}
                    </Badge>
                  </div>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <p>Código: <code className="font-mono">{event.qrCode}</code></p>
                    <p>Creado: {new Date(event.createdAt).toLocaleString('es')}</p>
                    <p>Respuestas: <span className="font-semibold text-foreground">{event.responsesCount}</span></p>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      </div>
    </div>
  );
}
