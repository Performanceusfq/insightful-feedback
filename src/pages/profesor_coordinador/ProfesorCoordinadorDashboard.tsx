import { useMemo } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { useAuth } from '@/context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { getMyCourses, getCourseEvents, getAggregatedResponses } from '@/services/professors/dashboard';
import { getCoordinatorDepartment, getDepartmentSummary } from '@/services/coordinators/dashboard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BookOpen, Users, Star, BarChart3, TrendingUp, Target } from 'lucide-react';

export default function ProfesorCoordinadorDashboard() {
    const { currentUser } = useAuth();

    // --- PROFESSOR DATA ---
    const { data: myCourses = [], isLoading: loadingCourses } = useQuery({
        queryKey: ['professor', 'courses', currentUser?.id],
        queryFn: () => getMyCourses(currentUser?.id || ''),
        enabled: !!currentUser?.id,
    });

    const courseIds = useMemo(() => myCourses.map(c => c.id), [myCourses]);

    const { data: courseEvents = [], isLoading: loadingEvents } = useQuery({
        queryKey: ['professor', 'events', courseIds],
        queryFn: () => getCourseEvents(courseIds),
        enabled: courseIds.length > 0
    });

    const { data: myAggregated = [] } = useQuery({
        queryKey: ['professor', 'agg', courseIds],
        queryFn: () => getAggregatedResponses(courseIds),
        enabled: courseIds.length > 0
    });

    // Professor KPIs
    const myTotalResponses = useMemo(() => myAggregated.filter(a => a.averageScore != null).reduce((sum, a) => sum + a.totalResponses, 0), [myAggregated]);
    const myOverallAvg = useMemo(() => {
        const scored = myAggregated.filter(a => a.averageScore != null);
        if (scored.length === 0) return 0;
        return scored.reduce((s, a) => s + (a.averageScore ?? 0), 0) / scored.length;
    }, [myAggregated]);
    const myTotalEvents = useMemo(() => courseEvents.length, [courseEvents]);

    // --- COORDINATOR DATA ---
    const { data: myDepartments = [], isLoading: loadingDepts } = useQuery({
        queryKey: ['coordinator', 'departments', currentUser?.id],
        queryFn: () => getCoordinatorDepartment(currentUser?.id || ''),
        enabled: !!currentUser?.id,
    });

    const myDept = myDepartments[0];

    const { data: deptSummary, isLoading: loadingSummary } = useQuery({
        queryKey: ['coordinator', 'summary', myDept?.id],
        queryFn: () => getDepartmentSummary(myDept?.id || ''),
        enabled: !!myDept?.id,
    });


    if (loadingCourses || loadingEvents || loadingDepts || loadingSummary) {
        return <div className="p-10 text-center text-muted-foreground animate-pulse">Cargando visión integral 360°...</div>;
    }

    if (!myDept || !deptSummary) {
        return <div className="p-10 text-center text-muted-foreground">Tu perfil aún no está asignado a la coordinación de un departamento.</div>;
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="Dashboard Unificado"
                description={`Vista integral: Tus Cursos Universitarios & Analítica del ${myDept.name}`}
            />

            <div className="grid gap-6 md:grid-cols-2">
                {/* PROFESSOR SUMMARY BLOCK */}
                <Card className="border-primary/20 bg-muted/10">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <BookOpen className="h-5 w-5 text-primary" />
                            Resumen de mi Docencia
                        </CardTitle>
                        <CardDescription>Métricas de los cursos que dictas actualmente</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-4 mt-2">
                            <MiniKPI label="Puntuación Global" value={myOverallAvg.toFixed(2)} sublabel="/ 5.0" icon={<Star className="h-4 w-4" />} accent />
                            <MiniKPI label="Total Respuestas" value={String(myTotalResponses)} sublabel="recibidas" icon={<Users className="h-4 w-4" />} />
                            <MiniKPI label="Cursos Activos" value={String(myCourses.length)} sublabel="semestre actual" icon={<BookOpen className="h-4 w-4" />} />
                            <MiniKPI label="Exámenes QR" value={String(myTotalEvents)} sublabel="sesiones activas" icon={<BarChart3 className="h-4 w-4" />} />
                        </div>
                    </CardContent>
                </Card>

                {/* COORDINATOR SUMMARY BLOCK */}
                <Card className="border-indigo-500/20 bg-muted/10">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Users className="h-5 w-5 text-indigo-500" />
                            Resumen de mi Coordinación
                        </CardTitle>
                        <CardDescription>Métricas globales del departamento a tu cargo</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-4 mt-2">
                            <MiniKPI label="Puntaje Dpto." value={deptSummary.avgScore.toFixed(2)} sublabel="/ 5.0" icon={<Star className="h-4 w-4 text-indigo-500" />} />
                            <MiniKPI label="Respuestas Dpto" value={String(deptSummary.totalResponses)} sublabel="acumuladas" icon={<Users className="h-4 w-4 text-indigo-500" />} />
                            <MiniKPI label="Participación" value={`${deptSummary.participationRate}%`} sublabel="estudiantes" icon={<Target className="h-4 w-4 text-indigo-500" />} />
                            <MiniKPI label="Total Profesores" value={String(deptSummary.professorsCount)} sublabel="activos" icon={<TrendingUp className="h-4 w-4 text-indigo-500" />} />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2 mt-8">
                <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 text-center space-y-3">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                        <BookOpen className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold text-lg">Administrar mis Clases</h3>
                    <p className="text-sm text-muted-foreground mb-4">Accede al panel completo para ver en detalle tus evaluaciones, tendencias semanales y gestionar códigos QR.</p>
                    <a href="/profesor/clases" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 w-full mt-2">
                        Ir a Panel Docente
                    </a>
                </div>

                <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 text-center space-y-3">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-500/10">
                        <BarChart3 className="h-6 w-6 text-indigo-500" />
                    </div>
                    <h3 className="font-semibold text-lg">Analítica de mi Departamento</h3>
                    <p className="text-sm text-muted-foreground mb-4">Accede a la comparativa completa de todos los profesores del departamento, vistas por categoría y más.</p>
                    <a href="/coordinador/analitica" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 w-full mt-2">
                        Ir a Analítica Dpto.
                    </a>
                </div>
            </div>
        </div>
    );
}

function MiniKPI({ label, value, sublabel, icon, accent }: { label: string; value: string; sublabel: string; icon: React.ReactNode; accent?: boolean }) {
    return (
        <div className="flex items-center gap-3 bg-background rounded-lg border p-3">
            <div className={`flex h-8 w-8 items-center justify-center rounded-md ${accent ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                {icon}
            </div>
            <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{label}</p>
                <p className="text-lg font-bold font-display leading-tight">{value} <span className="text-[10px] font-normal text-muted-foreground uppercase">{sublabel}</span></p>
            </div>
        </div>
    );
}
