import { useMemo } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { useAuth } from '@/context/AuthContext';
import { mockDepartments } from '@/data/mock-data';
import { mockProfessorRankings, mockDepartmentSummaries } from '@/data/mock-analytics';
import { questionCategoryLabels, QuestionCategory } from '@/types/domain';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { TrendingUp, TrendingDown, Minus, Users, Star, BarChart3, Target } from 'lucide-react';

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

export default function CoordinadorDashboard() {
  const { currentUser } = useAuth();

  // Get coordinator's department
  const myDept = mockDepartments.find(d => d.id === currentUser.departmentId) ?? mockDepartments[0];
  const deptSummary = mockDepartmentSummaries.find(s => s.departmentId === myDept.id) ?? mockDepartmentSummaries[0];
  const deptProfessors = mockProfessorRankings
    .filter(p => p.departmentId === myDept.id)
    .sort((a, b) => b.avgScore - a.avgScore);

  // Radar data
  const radarData = useMemo(() => {
    const cats: QuestionCategory[] = ['pedagogia', 'contenido', 'evaluacion', 'comunicacion', 'general'];
    return cats.map(cat => ({
      category: questionCategoryLabels[cat],
      score: deptSummary.categoryScores[cat],
      fullMark: 5,
    }));
  }, [deptSummary]);

  // Professor comparison bar data
  const profBarData = useMemo(() =>
    deptProfessors.map(p => ({ name: p.professorName.split(' ').slice(-1)[0], score: p.avgScore, full: p.professorName })),
    [deptProfessors],
  );

  // Professor radar overlay
  const profRadarData = useMemo(() => {
    const cats: QuestionCategory[] = ['pedagogia', 'contenido', 'evaluacion', 'comunicacion', 'general'];
    return cats.map(cat => {
      const point: Record<string, any> = { category: questionCategoryLabels[cat] };
      deptProfessors.forEach(p => {
        point[p.professorName.split(' ').slice(-1)[0]] = p.categoryScores[cat];
      });
      return point;
    });
  }, [deptProfessors]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Departamento: ${myDept.name}`}
        description="Analítica de desempeño docente del departamento."
      />

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard icon={<Star className="h-5 w-5" />} label="Puntaje Dpto." value={deptSummary.avgScore.toFixed(2)} sub="/ 5.0" trend={deptSummary.trend} accent />
        <KPICard icon={<Users className="h-5 w-5" />} label="Respuestas" value={String(deptSummary.totalResponses)} sub="acumuladas" />
        <KPICard icon={<Target className="h-5 w-5" />} label="Participación" value={`${deptSummary.participationRate}%`} sub="de estudiantes" />
        <KPICard icon={<BarChart3 className="h-5 w-5" />} label="Profesores" value={String(deptSummary.professorsCount)} sub={`${deptSummary.coursesCount} cursos`} />
      </div>

      <Tabs defaultValue="profesores" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profesores">Comparativa Profesores</TabsTrigger>
          <TabsTrigger value="categorias">Por Categoría</TabsTrigger>
          <TabsTrigger value="tendencia">Tendencia Mensual</TabsTrigger>
        </TabsList>

        {/* Professor comparison */}
        <TabsContent value="profesores">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Ranking de Profesores</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={profBarData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis type="number" domain={[0, 5]} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis type="category" dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} width={90} />
                    <Tooltip
                      contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }}
                      formatter={(v: number) => [v.toFixed(2), 'Puntaje']}
                    />
                    <Bar dataKey="score" radius={[0, 6, 6, 0]}>
                      {profBarData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Professor detail cards */}
            <div className="space-y-3">
              {deptProfessors.map((prof, i) => (
                <Card key={prof.professorId}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-primary-foreground" style={{ background: COLORS[i % COLORS.length] }}>
                          {i + 1}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{prof.professorName}</p>
                          <p className="text-xs text-muted-foreground">{prof.totalResponses} respuestas · {prof.coursesCount} curso(s)</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {trendIcon(prof.trend)}
                        <span className="text-lg font-bold font-display">{prof.avgScore.toFixed(2)}</span>
                      </div>
                    </div>
                    <Progress value={(prof.avgScore / 5) * 100} className="h-1.5" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Category radar overlay */}
        <TabsContent value="categorias">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Comparativa por Categoría</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <ResponsiveContainer width="100%" height={380}>
                <RadarChart data={profRadarData}>
                  <PolarGrid className="stroke-border" />
                  <PolarAngleAxis dataKey="category" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                  <PolarRadiusAxis domain={[0, 5]} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                  {deptProfessors.map((p, i) => (
                    <Radar
                      key={p.professorId}
                      dataKey={p.professorName.split(' ').slice(-1)[0]}
                      stroke={COLORS[i % COLORS.length]}
                      fill={COLORS[i % COLORS.length]}
                      fillOpacity={0.15}
                      strokeWidth={2}
                    />
                  ))}
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Monthly trend */}
        <TabsContent value="tendencia">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Tendencia Mensual del Departamento</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={deptSummary.monthlyScores}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis domain={[1, 5]} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                  <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function KPICard({ icon, label, value, sub, trend, accent }: { icon: React.ReactNode; label: string; value: string; sub: string; trend?: 'up' | 'down' | 'stable'; accent?: boolean }) {
  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${accent ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
            {icon}
          </div>
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">{label}</p>
            <div className="flex items-center gap-1.5">
              <p className="text-2xl font-bold font-display">{value}</p>
              <span className="text-xs text-muted-foreground">{sub}</span>
              {trend && trendIcon(trend)}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
