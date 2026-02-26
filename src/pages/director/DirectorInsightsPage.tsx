import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { mockInsights, mockWeeklySummary, InsightType, InsightPriority, AIInsight } from '@/data/mock-insights';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertTriangle, TrendingUp, TrendingDown, Lightbulb, Star, ArrowUpRight, ArrowDownRight,
  BrainCircuit, ChevronRight, Clock, CheckCircle2, Target, Users, BarChart3, Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const typeConfig: Record<InsightType, { icon: React.ReactNode; label: string; color: string }> = {
  alert: { icon: <AlertTriangle className="h-4 w-4" />, label: 'Alerta', color: 'text-destructive bg-destructive/10' },
  recommendation: { icon: <Lightbulb className="h-4 w-4" />, label: 'Recomendación', color: 'text-amber-600 bg-amber-500/10' },
  highlight: { icon: <Star className="h-4 w-4" />, label: 'Destacado', color: 'text-emerald-600 bg-emerald-500/10' },
  trend: { icon: <TrendingUp className="h-4 w-4" />, label: 'Tendencia', color: 'text-primary bg-primary/10' },
};

const priorityConfig: Record<InsightPriority, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  high: { label: 'Alta', variant: 'default' },
  medium: { label: 'Media', variant: 'secondary' },
  low: { label: 'Baja', variant: 'outline' },
};

export default function DirectorInsightsPage() {
  const [filterType, setFilterType] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [selectedInsight, setSelectedInsight] = useState<AIInsight | null>(null);

  const filtered = useMemo(() => {
    return mockInsights.filter(i => {
      if (filterType !== 'all' && i.type !== filterType) return false;
      if (filterPriority !== 'all' && i.priority !== filterPriority) return false;
      return true;
    });
  }, [filterType, filterPriority]);

  const summary = mockWeeklySummary;
  const alertCount = mockInsights.filter(i => i.type === 'alert').length;
  const highlightCount = mockInsights.filter(i => i.type === 'highlight').length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Insights IA"
        description="Recomendaciones y alertas generadas automáticamente a partir de los datos de evaluación."
        action={
          <Badge variant="outline" className="gap-1.5 px-3 py-1.5 text-xs">
            <Sparkles className="h-3 w-3 text-primary" />
            Generado con IA simulada
          </Badge>
        }
      />

      {/* Weekly summary */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <BrainCircuit className="h-5 w-5 text-primary" />
            Resumen Semanal — {summary.period}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <MiniKPI
              icon={<Star className="h-4 w-4" />}
              label="Puntaje Global"
              value={summary.overallScore.toFixed(2)}
              change={summary.changeVsPrevious}
            />
            <MiniKPI
              icon={<Users className="h-4 w-4" />}
              label="Respuestas"
              value={String(summary.totalResponses)}
            />
            <MiniKPI
              icon={<Target className="h-4 w-4" />}
              label="Participación"
              value={`${summary.participationRate}%`}
            />
            <MiniKPI
              icon={<BarChart3 className="h-4 w-4" />}
              label="Insights Generados"
              value={String(mockInsights.length)}
              badge={`${alertCount} alertas`}
            />
          </div>

          <Separator />

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border bg-card p-3">
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-emerald-500" /> Mejor desempeño
              </p>
              <p className="text-sm font-medium">{summary.topPerformer.name}</p>
              <p className="text-lg font-bold font-display text-emerald-600">{summary.topPerformer.score.toFixed(2)}<span className="text-xs font-normal text-muted-foreground"> / 5.0</span></p>
            </div>
            <div className="rounded-lg border bg-card p-3">
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3 text-destructive" /> Requiere atención
              </p>
              <p className="text-sm font-medium">{summary.needsAttention.name}</p>
              <p className="text-lg font-bold font-display text-destructive">{summary.needsAttention.score.toFixed(2)}<span className="text-xs font-normal text-muted-foreground"> / 5.0</span></p>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Hallazgos Clave</p>
            <ul className="space-y-1.5">
              {summary.keyFindings.map((finding, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                  <span className="text-muted-foreground">{finding}</span>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            <SelectItem value="alert">Alertas</SelectItem>
            <SelectItem value="recommendation">Recomendaciones</SelectItem>
            <SelectItem value="highlight">Destacados</SelectItem>
            <SelectItem value="trend">Tendencias</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterPriority} onValueChange={setFilterPriority}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Prioridad" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="high">Alta</SelectItem>
            <SelectItem value="medium">Media</SelectItem>
            <SelectItem value="low">Baja</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground">{filtered.length} insights</span>
      </div>

      {/* Insights list */}
      <div className="space-y-3">
        {filtered.map(insight => {
          const tc = typeConfig[insight.type];
          const pc = priorityConfig[insight.priority];
          return (
            <Card
              key={insight.id}
              className="cursor-pointer transition-all hover:shadow-md hover:border-primary/30"
              onClick={() => setSelectedInsight(insight)}
            >
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg shrink-0', tc.color)}>
                    {tc.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h4 className="text-sm font-semibold">{insight.title}</h4>
                      <Badge variant={pc.variant} className="text-[10px]">{pc.label}</Badge>
                      <Badge variant="outline" className="text-[10px]">{tc.label}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{insight.description}</p>
                    <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{insight.relatedEntity.name}</span>
                      {insight.metric && (
                        <span className="flex items-center gap-1">
                          {insight.metric.change > 0 ? (
                            <ArrowUpRight className="h-3 w-3 text-emerald-500" />
                          ) : (
                            <ArrowDownRight className="h-3 w-3 text-destructive" />
                          )}
                          {insight.metric.label}: {insight.metric.value}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTimeAgo(insight.generatedAt)}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Detail dialog */}
      {selectedInsight && (
        <Dialog open onOpenChange={() => setSelectedInsight(null)}>
          <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center gap-2 mb-1">
                <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg', typeConfig[selectedInsight.type].color)}>
                  {typeConfig[selectedInsight.type].icon}
                </div>
                <div>
                  <Badge variant={priorityConfig[selectedInsight.priority].variant} className="text-[10px] mb-1">
                    Prioridad {priorityConfig[selectedInsight.priority].label}
                  </Badge>
                  <DialogTitle className="text-base">{selectedInsight.title}</DialogTitle>
                </div>
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {new Date(selectedInsight.generatedAt).toLocaleString('es')}
                {' · '}
                {selectedInsight.relatedEntity.name}
              </p>
            </DialogHeader>

            <div className="space-y-4 mt-2">
              {selectedInsight.metric && (
                <div className="rounded-lg bg-muted/50 p-4 text-center">
                  <p className="text-xs text-muted-foreground mb-1">{selectedInsight.metric.label}</p>
                  <p className="text-3xl font-bold font-display">{selectedInsight.metric.value}</p>
                  <p className={cn('text-sm flex items-center justify-center gap-1 mt-1', selectedInsight.metric.change > 0 ? 'text-emerald-600' : 'text-destructive')}>
                    {selectedInsight.metric.change > 0 ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                    {selectedInsight.metric.change > 0 ? '+' : ''}{selectedInsight.metric.change}
                  </p>
                </div>
              )}

              <div>
                <h4 className="text-sm font-semibold mb-2">Análisis Detallado</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{selectedInsight.details}</p>
              </div>

              <Separator />

              <div>
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                  <Lightbulb className="h-4 w-4 text-amber-500" />
                  Acciones Sugeridas
                </h4>
                <ul className="space-y-2">
                  {selectedInsight.suggestedActions.map((action, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span className="text-muted-foreground">{action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function MiniKPI({ icon, label, value, change, badge }: { icon: React.ReactNode; label: string; value: string; change?: number; badge?: string }) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">{icon} {label}</p>
      <div className="flex items-end gap-1.5">
        <span className="text-xl font-bold font-display">{value}</span>
        {change != null && (
          <span className={cn('text-xs flex items-center mb-0.5', change > 0 ? 'text-emerald-600' : 'text-destructive')}>
            {change > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {change > 0 ? '+' : ''}{change}
          </span>
        )}
        {badge && <Badge variant="destructive" className="text-[10px] ml-auto">{badge}</Badge>}
      </div>
    </div>
  );
}

function formatTimeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return 'Hace minutos';
  if (hours < 24) return `Hace ${hours}h`;
  const days = Math.floor(hours / 24);
  return `Hace ${days}d`;
}
