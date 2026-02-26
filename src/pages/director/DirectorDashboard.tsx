import { useMemo } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { mockDepartmentSummaries, mockInstitutionalKPIs, mockSemesterComparisons, mockProfessorRankings } from '@/data/mock-analytics';
import { questionCategoryLabels, QuestionCategory } from '@/types/domain';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend,
} from 'recharts';
import { TrendingUp, TrendingDown, Minus, Building2, Star, Users, Target, ArrowUpRight, ArrowDownRight } from 'lucide-react';

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

const trendIcon = (t: 'up' | 'down' | 'stable') => {
  if (t === 'up') return <TrendingUp className="h-4 w-4 text-emerald-500" />;
  if (t === 'down') return <TrendingDown className="h-4 w-4 text-destructive" />;
  return <Minus className="h-4 w-4 text-muted-foreground" />;
};

export default function DirectorDashboard() {
  // Semester comparison bar chart
  const semesterData = mockSemesterComparisons;

  // Department trend overlay
  const trendOverlayData = useMemo(() => {
    const months = mockDepartmentSummaries[0]?.monthlyScores.map(m => m.month) ?? [];
    return months.map((month, i) => {
      const point: Record<string, any> = { month };
      mockDepartmentSummaries.forEach(dept => {
        point[dept.departmentName] = dept.monthlyScores[i]?.score ?? null;
      });
      return point;
    });
  }, []);

  // Institutional radar
  const institutionalRadar = useMemo(() => {
    const cats: QuestionCategory[] = ['pedagogia', 'contenido', 'evaluacion', 'comunicacion', 'general'];
    return cats.map(cat => {
      const all = mockDepartmentSummaries.map(d => d.categoryScores[cat]);
      const avg = all.reduce((s, v) => s + v, 0) / all.length;
      return { category: questionCategoryLabels[cat], score: parseFloat(avg.toFixed(2)), fullMark: 5 };
    });
  }, []);

  // Top 5 professors institution-wide
  const topProfessors = useMemo(() =>
    [...mockProfessorRankings].sort((a, b) => b.avgScore - a.avgScore).slice(0, 5),
    [],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analítica Institucional"
        description="Visión general del desempeño docente a nivel institucional."
      />

      {/* Institutional KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {mockInstitutionalKPIs.map((kpi, i) => {
          const diff = kpi.value - kpi.previousValue;
          const isUp = diff > 0;
          return (
            <Card key={i}>
              <CardContent className="pt-5">
                <p className="text-xs text-muted-foreground mb-1">{kpi.label}</p>
                <div className="flex items-end gap-2">
                  <span className="text-2xl font-bold font-display">{typeof kpi.value === 'number' && kpi.value % 1 !== 0 ? kpi.value.toFixed(2) : kpi.value}</span>
                  <span className="text-xs text-muted-foreground mb-0.5">{kpi.unit}</span>
                </div>
                {diff !== 0 && (
                  <div className={`flex items-center gap-1 mt-1 text-xs ${isUp ? 'text-emerald-600' : 'text-destructive'}`}>
                    {isUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    {isUp ? '+' : ''}{typeof diff === 'number' && Math.abs(diff) < 1 ? diff.toFixed(2) : diff} vs semestre anterior
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Tabs defaultValue="departamentos" className="space-y-4">
        <TabsList>
          <TabsTrigger value="departamentos">Departamentos</TabsTrigger>
          <TabsTrigger value="tendencias">Tendencias</TabsTrigger>
          <TabsTrigger value="semestral">Comparativa Semestral</TabsTrigger>
          <TabsTrigger value="categorias">Categorías</TabsTrigger>
        </TabsList>

        {/* Department cards */}
        <TabsContent value="departamentos">
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Department summary cards */}
            <div className="space-y-3 lg:col-span-1">
              {mockDepartmentSummaries.map((dept, i) => (
                <Card key={dept.departmentId}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold text-primary-foreground" style={{ background: COLORS[i % COLORS.length] }}>
                          <Building2 className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{dept.departmentName}</p>
                          <p className="text-xs text-muted-foreground">{dept.professorsCount} profesores · {dept.coursesCount} cursos</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {trendIcon(dept.trend)}
                        <span className="text-xl font-bold font-display">{dept.avgScore.toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <p className="text-muted-foreground">Respuestas</p>
                        <p className="font-semibold">{dept.totalResponses}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Participación</p>
                        <p className="font-semibold">{dept.participationRate}%</p>
                      </div>
                    </div>
                    <Progress value={(dept.avgScore / 5) * 100} className="h-1.5 mt-3" />
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Top professors */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Star className="h-4 w-4 text-primary" />
                  Top Profesores Institucional
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {topProfessors.map((prof, i) => {
                  const dept = mockDepartmentSummaries.find(d => d.departmentId === prof.departmentId);
                  return (
                    <div key={prof.professorId} className="flex items-center gap-3">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-primary-foreground" style={{ background: COLORS[i % COLORS.length] }}>
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{prof.professorName}</p>
                        <p className="text-xs text-muted-foreground">{dept?.departmentName}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        {trendIcon(prof.trend)}
                        <span className="font-bold text-sm tabular-nums">{prof.avgScore.toFixed(2)}</span>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Trend overlay */}
        <TabsContent value="tendencias">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Evolución Mensual por Departamento</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={trendOverlayData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis domain={[1, 5]} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                  <Legend />
                  {mockDepartmentSummaries.map((dept, i) => (
                    <Line key={dept.departmentId} type="monotone" dataKey={dept.departmentName} stroke={COLORS[i % COLORS.length]} strokeWidth={2.5} dot={{ r: 3 }} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Semester comparison */}
        <TabsContent value="semestral">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Comparativa Semestre Actual vs Anterior</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={semesterData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="departmentName" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                  <YAxis domain={[0, 5]} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                  <Legend />
                  <Bar dataKey="previousSemester" name="Semestre Anterior" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="currentSemester" name="Semestre Actual" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Institutional radar */}
        <TabsContent value="categorias">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Puntaje Institucional por Categoría</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <ResponsiveContainer width="100%" height={380}>
                <RadarChart data={institutionalRadar}>
                  <PolarGrid className="stroke-border" />
                  <PolarAngleAxis dataKey="category" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                  <PolarRadiusAxis domain={[0, 5]} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                  <Radar dataKey="score" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.25} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
