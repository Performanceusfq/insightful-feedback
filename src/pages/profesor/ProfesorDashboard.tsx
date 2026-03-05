import { useMemo, useState } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { useAuth } from '@/context/AuthContext';
import { mockProfessors, mockCourses } from '@/data/mock-data';
import { mockEvents } from '@/data/mock-events';
import { mockAggregatedResponses, mockWeeklyTrends, mockCategoryScores } from '@/data/mock-professor-stats';
import { mockQuestions } from '@/data/mock-questions';
import { questionCategoryLabels, QuestionCategory } from '@/types/domain';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  BarChart, Bar, LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie,
} from 'recharts';
import { Users, TrendingUp, Star, MessageSquare, BarChart3, BookOpen } from 'lucide-react';

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

export default function ProfesorDashboard() {
  const { currentUser } = useAuth();
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const professor = mockProfessors.find(p => p.userId === currentUser?.id);
  const myCourses = useMemo(
    () => professor ? mockCourses.filter(c => c.professorId === professor.id) : mockCourses.slice(0, 2),
    [professor],
  );
  const courseIds = useMemo(() => myCourses.map(c => c.id), [myCourses]);

  // Filter data by selected course
  const filteredAgg = useMemo(() => {
    const ids = selectedCourse === 'all' ? courseIds : [selectedCourse];
    return mockAggregatedResponses.filter(r => ids.includes(r.courseId));
  }, [selectedCourse, courseIds]);

  const filteredTrends = useMemo(() => {
    const ids = selectedCourse === 'all' ? courseIds : [selectedCourse];
    return mockWeeklyTrends.filter(t => ids.includes(t.courseId));
  }, [selectedCourse, courseIds]);

  const filteredCategories = useMemo(() => {
    const ids = selectedCourse === 'all' ? courseIds : [selectedCourse];
    return mockCategoryScores.filter(s => ids.includes(s.courseId));
  }, [selectedCourse, courseIds]);

  // KPIs
  const totalResponses = useMemo(
    () => filteredAgg.filter(a => a.averageScore != null).reduce((sum, a) => sum + a.totalResponses, 0),
    [filteredAgg],
  );
  const overallAvg = useMemo(() => {
    const scored = filteredAgg.filter(a => a.averageScore != null);
    if (scored.length === 0) return 0;
    return scored.reduce((s, a) => s + (a.averageScore ?? 0), 0) / scored.length;
  }, [filteredAgg]);

  const totalEvents = useMemo(() => {
    const ids = selectedCourse === 'all' ? courseIds : [selectedCourse];
    return mockEvents.filter(e => ids.includes(e.courseId)).length;
  }, [selectedCourse, courseIds]);

  const openComments = useMemo(
    () => filteredAgg.filter(a => a.openAnswers).flatMap(a => a.openAnswers ?? []),
    [filteredAgg],
  );

  // Category radar data
  const radarData = useMemo(() => {
    const categories: QuestionCategory[] = ['pedagogia', 'contenido', 'evaluacion', 'comunicacion', 'general'];
    return categories.map(cat => {
      const entries = filteredCategories.filter(c => c.category === cat);
      const avg = entries.length > 0 ? entries.reduce((s, e) => s + e.avgScore, 0) / entries.length : 0;
      return { category: questionCategoryLabels[cat], score: parseFloat(avg.toFixed(2)), fullMark: 5 };
    });
  }, [filteredCategories]);

  // Likert distribution chart for a merged view
  const likertBarData = useMemo(() => {
    const merged: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    filteredAgg.forEach(a => {
      if (a.likertDistribution) {
        Object.entries(a.likertDistribution).forEach(([k, v]) => { merged[Number(k)] += v; });
      }
    });
    return Object.entries(merged).map(([val, count]) => ({ value: `${val}`, count }));
  }, [filteredAgg]);

  // Trend line data (merge all courses if 'all')
  const trendLineData = useMemo(() => {
    if (filteredTrends.length === 0) return [];
    // Take longest series as base
    const longest = filteredTrends.reduce((a, b) => a.data.length >= b.data.length ? a : b);
    return longest.data.map((d, i) => {
      const point: Record<string, string | number | null> = { week: d.week };
      filteredTrends.forEach(t => {
        const courseName = mockCourses.find(c => c.id === t.courseId)?.code ?? t.courseId;
        point[courseName] = t.data[i]?.avgScore ?? null;
      });
      return point;
    });
  }, [filteredTrends]);

  const trendKeys = useMemo(() => {
    return filteredTrends.map(t => mockCourses.find(c => c.id === t.courseId)?.code ?? t.courseId);
  }, [filteredTrends]);

  // Choice distribution for first MC question found
  const mcQuestion = useMemo(() => filteredAgg.find(a => a.choiceDistribution), [filteredAgg]);
  const mcData = useMemo(() => {
    if (!mcQuestion?.choiceDistribution) return [];
    return Object.entries(mcQuestion.choiceDistribution).map(([label, value]) => ({ label, value }));
  }, [mcQuestion]);

  const courseName = (id: string) => mockCourses.find(c => c.id === id)?.name ?? id;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mi Dashboard"
        description="Resumen de evaluaciones y métricas de tus cursos."
        action={
          <Select value={selectedCourse} onValueChange={setSelectedCourse}>
            <SelectTrigger className="w-52">
              <SelectValue placeholder="Todos los cursos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los cursos</SelectItem>
              {myCourses.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard icon={<Star className="h-5 w-5" />} label="Puntuación Global" value={overallAvg.toFixed(2)} sublabel="de 5.0" accent />
        <KPICard icon={<Users className="h-5 w-5" />} label="Total Respuestas" value={String(totalResponses)} sublabel="acumuladas" />
        <KPICard icon={<BarChart3 className="h-5 w-5" />} label="Eventos Realizados" value={String(totalEvents)} sublabel="sesiones QR" />
        <KPICard icon={<BookOpen className="h-5 w-5" />} label="Cursos Activos" value={String(myCourses.length)} sublabel="este semestre" />
      </div>

      {/* Charts */}
      <Tabs defaultValue="tendencia" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tendencia">Tendencia</TabsTrigger>
          <TabsTrigger value="categorias">Por Categoría</TabsTrigger>
          <TabsTrigger value="distribucion">Distribución</TabsTrigger>
          <TabsTrigger value="metodologia">Metodología</TabsTrigger>
        </TabsList>

        {/* Trend */}
        <TabsContent value="tendencia">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Evolución Semanal del Puntaje
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trendLineData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="week" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis domain={[1, 5]} className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                  {trendKeys.map((key, i) => (
                    <Line key={key} type="monotone" dataKey={key} stroke={COLORS[i % COLORS.length]} strokeWidth={2.5} dot={{ r: 4 }} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Radar */}
        <TabsContent value="categorias">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Puntaje por Categoría</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <ResponsiveContainer width="100%" height={350}>
                <RadarChart data={radarData}>
                  <PolarGrid className="stroke-border" />
                  <PolarAngleAxis dataKey="category" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                  <PolarRadiusAxis domain={[0, 5]} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                  <Radar dataKey="score" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.25} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Likert distribution */}
        <TabsContent value="distribucion">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Distribución de Respuestas Likert</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={likertBarData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="value" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {likertBarData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* MC Pie */}
        <TabsContent value="metodologia">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Metodología Preferida</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              {mcData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={mcData} dataKey="value" nameKey="label" cx="50%" cy="50%" outerRadius={110} label={({ label, percent }) => `${label} ${(percent * 100).toFixed(0)}%`}>
                      {mcData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="py-10 text-sm text-muted-foreground">Sin datos de opción múltiple disponibles.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Per-question breakdown */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Detalle por Pregunta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {filteredAgg.filter(a => a.averageScore != null).map(agg => {
            const q = mockQuestions.find(qq => qq.id === agg.questionId);
            if (!q) return null;
            return (
              <div key={`${agg.courseId}-${agg.questionId}`} className="rounded-lg border p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium flex-1">{q.text}</p>
                  <Badge variant="outline" className="shrink-0">{courseName(agg.courseId)}</Badge>
                </div>
                <div className="flex items-center gap-3">
                  <Progress value={((agg.averageScore ?? 0) / 5) * 100} className="h-2 flex-1" />
                  <span className="text-sm font-bold tabular-nums w-10 text-right">{agg.averageScore?.toFixed(2)}</span>
                  <span className="text-xs text-muted-foreground">({agg.totalResponses})</span>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Open comments */}
      {openComments.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              Comentarios Recientes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {openComments.map((comment, i) => (
              <div key={i} className="rounded-lg bg-muted/40 px-4 py-3 text-sm italic text-muted-foreground">
                "{comment}"
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function KPICard({ icon, label, value, sublabel, accent }: { icon: React.ReactNode; label: string; value: string; sublabel: string; accent?: boolean }) {
  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${accent ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
            {icon}
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold font-display">{value} <span className="text-xs font-normal text-muted-foreground">{sublabel}</span></p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
