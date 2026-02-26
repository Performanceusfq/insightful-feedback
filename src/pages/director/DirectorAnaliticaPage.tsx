import { useMemo } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { mockDepartmentSummaries, mockProfessorRankings, mockSemesterComparisons } from '@/data/mock-analytics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend,
} from 'recharts';
import { TrendingUp, TrendingDown, Minus, Building2, BarChart3 } from 'lucide-react';

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

export default function DirectorAnaliticaPage() {
  const deptBarData = mockDepartmentSummaries.map(d => ({
    name: d.departmentName.length > 15 ? d.departmentName.slice(0, 15) + '…' : d.departmentName,
    score: d.avgScore,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analítica Institucional Detallada"
        description="Comparativas entre departamentos y análisis de desempeño."
      />

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            Puntaje por Departamento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={deptBarData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
              <YAxis domain={[0, 5]} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
              <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                {deptBarData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Comparativa Semestral</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={mockSemesterComparisons}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="departmentName" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
              <YAxis domain={[0, 5]} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
              <Legend />
              <Bar dataKey="previousSemester" name="Anterior" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="currentSemester" name="Actual" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* All professors ranked */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Todos los Profesores</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[...mockProfessorRankings].sort((a, b) => b.avgScore - a.avgScore).map((prof, i) => {
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
  );
}
