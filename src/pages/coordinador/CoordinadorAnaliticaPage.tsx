import { PageHeader } from '@/components/shared/PageHeader';
import { useAuth } from '@/context/AuthContext';
import { mockDepartments } from '@/data/mock-data';
import { mockDepartmentSummaries, mockProfessorRankings } from '@/data/mock-analytics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { TrendingUp, TrendingDown, Minus, BarChart3 } from 'lucide-react';

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

const trendIcon = (t: 'up' | 'down' | 'stable') => {
  if (t === 'up') return <TrendingUp className="h-3 w-3 text-emerald-500" />;
  if (t === 'down') return <TrendingDown className="h-3 w-3 text-destructive" />;
  return <Minus className="h-3 w-3 text-muted-foreground" />;
};

export default function CoordinadorAnaliticaPage() {
  const { currentUser } = useAuth();
  const myDept = mockDepartments.find(d => d.id === currentUser?.departmentId) ?? mockDepartments[0];
  const professors = mockProfessorRankings
    .filter(p => p.departmentId === myDept.id)
    .sort((a, b) => b.avgScore - a.avgScore);

  const barData = professors.map(p => ({
    name: p.professorName.split(' ').pop(),
    score: p.avgScore,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analítica del Departamento"
        description={`Detalle de desempeño docente — ${myDept.name}`}
      />

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            Comparativa de Profesores
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
              <YAxis domain={[0, 5]} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
              <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                {barData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {professors.map((prof, i) => (
          <Card key={prof.professorId}>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm font-medium">{prof.professorName}</p>
                  <p className="text-xs text-muted-foreground">{prof.totalResponses} respuestas · {prof.coursesCount} curso(s)</p>
                </div>
                <div className="flex items-center gap-1.5">
                  {trendIcon(prof.trend)}
                  <span className="text-lg font-bold font-display">{prof.avgScore.toFixed(2)}</span>
                </div>
              </div>
              <div className="grid grid-cols-5 gap-2 text-xs text-center mt-3">
                {(['pedagogia', 'contenido', 'evaluacion', 'comunicacion', 'general'] as const).map(cat => (
                  <div key={cat}>
                    <p className="text-muted-foreground truncate">{cat.slice(0, 4)}.</p>
                    <p className="font-semibold">{prof.categoryScores[cat].toFixed(1)}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
