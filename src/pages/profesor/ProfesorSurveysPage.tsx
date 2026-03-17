import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Pin, Shuffle } from 'lucide-react';
import { useState } from 'react';
import SurveyPreview from '../admin/SurveyPreview';
import { fetchSurveyConfigPageData } from '@/services/admin/survey-configs';

export default function ProfesorSurveysPage() {
  const [previewConfigId, setPreviewConfigId] = useState<string | null>(null);

  const configsQuery = useQuery({
    queryKey: ['profesor-survey-page'],
    queryFn: fetchSurveyConfigPageData,
  });

  const configs = configsQuery.data?.configs ?? [];
  const courses = configsQuery.data?.courses ?? [];
  const questions = configsQuery.data?.questions ?? [];

  const getCourseName = (courseId: string) => courses.find((course) => course.id === courseId)?.name || courseId;

  const previewConfig = previewConfigId ? configs.find((config) => config.id === previewConfigId) : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mis Encuestas"
        description="Previsualiza las encuestas configuradas para tus clases"
      />

      {configsQuery.isLoading ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">Cargando encuestas...</CardContent>
        </Card>
      ) : configsQuery.isError ? (
        <Card>
          <CardContent className="py-12 text-center text-destructive">No se pudieron cargar las encuestas</CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {configs.map((config) => (
            <Card key={config.id} className="overflow-hidden transition-all hover:shadow-md">
              <CardHeader className="flex flex-row items-start justify-between pb-3 bg-muted/30">
                <div>
                  <CardTitle className="text-base">{config.name}</CardTitle>
                  <p className="mt-0.5 text-sm text-muted-foreground">{getCourseName(config.courseId)}</p>
                </div>
                <Badge variant={config.active ? 'default' : 'secondary'}>
                  {config.active ? 'Activa' : 'Inactiva'}
                </Badge>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><Pin className="h-3 w-3" /> {config.fixedQuestionIds.length} fijas</span>
                  <span className="flex items-center gap-1"><Shuffle className="h-3 w-3" /> {config.randomPool.count} aleatorias</span>
                  <span className="font-semibold text-primary">· {config.fixedQuestionIds.length + config.randomPool.count} total</span>
                </div>
                <div className="mt-4">
                  <Button variant="outline" size="sm" onClick={() => setPreviewConfigId(config.id)} className="w-full">
                    <Eye className="mr-2 h-4 w-4" /> Vista previa
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {configs.length === 0 && (
            <Card className="col-span-2 border-dashed">
              <CardContent className="py-12 text-center text-muted-foreground">No hay encuestas configuradas para tus clases</CardContent>
            </Card>
          )}
        </div>
      )}

      {previewConfig && (
        <SurveyPreview
          config={previewConfig}
          questions={questions}
          courses={courses}
          onClose={() => setPreviewConfigId(null)}
        />
      )}
    </div>
  );
}
