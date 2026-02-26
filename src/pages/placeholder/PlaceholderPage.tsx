import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Construction } from 'lucide-react';

interface PlaceholderPageProps {
  title: string;
  description?: string;
}

export default function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <div>
      <PageHeader title={title} description={description} />
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <Construction className="mb-4 h-12 w-12 text-muted-foreground/50" />
          <h3 className="font-display text-lg font-semibold">En construcción</h3>
          <p className="mt-1 text-sm text-muted-foreground">Esta sección estará disponible en un próximo sprint.</p>
        </CardContent>
      </Card>
    </div>
  );
}
