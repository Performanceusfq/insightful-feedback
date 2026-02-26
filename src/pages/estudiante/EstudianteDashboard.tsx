import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/shared/PageHeader';
import { useAuth } from '@/context/AuthContext';
import { mockEvents } from '@/data/mock-events';
import { mockEventConfigs } from '@/data/mock-events';
import { mockSurveyConfigs } from '@/data/mock-questions';
import { mockCourses } from '@/data/mock-data';
import { hasStudentResponded } from '@/data/mock-responses';
import { eventStatusLabels } from '@/types/domain';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { QrCode, FileQuestion, CheckCircle2, Clock, ArrowRight } from 'lucide-react';

export default function EstudianteDashboard() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [manualCode, setManualCode] = useState('');

  const activeEvents = mockEvents.filter(e => {
    if (e.status !== 'active') return false;
    return new Date(e.expiresAt).getTime() > Date.now();
  });

  const handleManualCode = () => {
    if (manualCode.trim()) {
      navigate(`/estudiante/encuesta/${manualCode.trim().toUpperCase()}`);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Hola, ${currentUser.name.split(' ')[0]}`}
        description="Responde las encuestas activas para evaluar a tus profesores."
      />

      {/* Manual code input */}
      <Card>
        <CardContent className="pt-5">
          <div className="flex items-center gap-2 mb-3">
            <QrCode className="h-5 w-5 text-primary" />
            <h3 className="font-medium text-sm">Ingresar código manualmente</h3>
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Código QR (ej: A1B2C3D4)"
              value={manualCode}
              onChange={e => setManualCode(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && handleManualCode()}
              className="font-mono tracking-wider uppercase"
            />
            <Button onClick={handleManualCode} disabled={!manualCode.trim()}>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Active surveys */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Encuestas Activas
        </h3>
        {activeEvents.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center">
              <FileQuestion className="mx-auto mb-2 h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No hay encuestas activas en este momento.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {activeEvents.map(event => {
              const course = mockCourses.find(c => c.id === event.courseId);
              const responded = hasStudentResponded(currentUser.id, event.id);
              return (
                <Card key={event.id} className={responded ? 'opacity-60' : ''}>
                  <CardContent className="pt-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-medium text-sm">{course?.name ?? 'Clase'}</p>
                        <p className="text-xs text-muted-foreground">{course?.code}</p>
                      </div>
                      {responded ? (
                        <Badge variant="secondary"><CheckCircle2 className="mr-1 h-3 w-3" /> Respondida</Badge>
                      ) : (
                        <Badge><Clock className="mr-1 h-3 w-3" /> Activa</Badge>
                      )}
                    </div>
                    {!responded && (
                      <Button
                        size="sm"
                        className="w-full"
                        onClick={() => navigate(`/estudiante/encuesta/${event.qrCode}`)}
                      >
                        Responder encuesta
                        <ArrowRight className="ml-2 h-3 w-3" />
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
