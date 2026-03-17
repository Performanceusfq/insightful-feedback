import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/shared/PageHeader';
import { useAuth } from '@/context/AuthContext';
import { getMyCourses, getCourseEvents } from '@/services/professors/dashboard';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, QrCode, Users, Calendar, Loader2, AlertTriangle, ArrowRight } from 'lucide-react';

export default function MisClasesPage() {
  const { currentUser } = useAuth();

  const { data: myCourses = [], isLoading: loadingCourses, isError, refetch } = useQuery({
    queryKey: ['professor', 'courses', currentUser?.id],
    queryFn: () => getMyCourses(currentUser?.id || ''),
    enabled: !!currentUser?.id,
  });

  const courseIds = useMemo(() => myCourses.map(c => c.id), [myCourses]);

  const { data: courseEvents = [] } = useQuery({
    queryKey: ['professor', 'events', courseIds],
    queryFn: () => getCourseEvents(courseIds),
    enabled: courseIds.length > 0,
  });

  const eventsPerCourse = useMemo(() => {
    const map = new Map<string, { total: number; active: number; responses: number }>();
    for (const event of courseEvents) {
      const entry = map.get(event.courseId) ?? { total: 0, active: 0, responses: 0 };
      entry.total += 1;
      if (event.status === 'active') entry.active += 1;
      entry.responses += event.responsesCount;
      map.set(event.courseId, entry);
    }
    return map;
  }, [courseEvents]);

  if (loadingCourses) {
    return (
      <div className="p-10 text-center">
        <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Cargando tus clases...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-10 text-center">
        <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-destructive" />
        <p className="text-sm text-muted-foreground mb-4">No se pudo cargar tus clases.</p>
        <Button variant="outline" onClick={() => refetch()}>Reintentar</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mis Clases"
        description="Cursos asignados a ti este semestre."
        action={
          <Link to="/profesor/eventos">
            <Button variant="outline">
              <QrCode className="mr-2 h-4 w-4" />
              Eventos QR
            </Button>
          </Link>
        }
      />

      {myCourses.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <BookOpen className="mx-auto mb-4 h-12 w-12 text-muted-foreground/40" />
            <h3 className="text-lg font-semibold mb-1">Sin clases asignadas</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              No tienes cursos asignados para este semestre. Si crees que esto es un error, contacta al administrador.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {myCourses.map(course => {
            const stats = eventsPerCourse.get(course.id);
            return (
              <Card key={course.id} className="group relative overflow-hidden transition-shadow hover:shadow-md">
                <CardContent className="pt-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm truncate">{course.name}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{course.code}</p>
                    </div>
                    <Badge variant="secondary" className="shrink-0 ml-2">{course.semester}</Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mt-4">
                    <div className="rounded-lg border bg-muted/30 px-2.5 py-2 text-center">
                      <QrCode className="mx-auto mb-1 h-4 w-4 text-muted-foreground" />
                      <p className="text-lg font-bold tabular-nums">{stats?.total ?? 0}</p>
                      <p className="text-[10px] text-muted-foreground">Eventos</p>
                    </div>
                    <div className="rounded-lg border bg-muted/30 px-2.5 py-2 text-center">
                      <Calendar className="mx-auto mb-1 h-4 w-4 text-muted-foreground" />
                      <p className="text-lg font-bold tabular-nums">{stats?.active ?? 0}</p>
                      <p className="text-[10px] text-muted-foreground">Activos</p>
                    </div>
                    <div className="rounded-lg border bg-muted/30 px-2.5 py-2 text-center">
                      <Users className="mx-auto mb-1 h-4 w-4 text-muted-foreground" />
                      <p className="text-lg font-bold tabular-nums">{stats?.responses ?? 0}</p>
                      <p className="text-[10px] text-muted-foreground">Respuestas</p>
                    </div>
                  </div>

                  <Link to={`/profesor/eventos`} className="mt-4 block">
                    <Button variant="ghost" size="sm" className="w-full justify-between text-xs text-muted-foreground hover:text-foreground">
                      Ver eventos
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
