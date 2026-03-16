import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { fetchAdminDashboardStats } from '@/services/admin/dashboard';
import { Building2, Users, BookOpen, GraduationCap, Loader2 } from 'lucide-react';

export default function AdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-dashboard-stats'],
    queryFn: fetchAdminDashboardStats,
  });

  const stats = [
    { label: 'Departamentos', value: data?.departmentsCount ?? 0, icon: Building2, color: 'text-primary' },
    { label: 'Profesores', value: data?.professorsCount ?? 0, icon: Users, color: 'text-accent' },
    { label: 'Clases', value: data?.coursesCount ?? 0, icon: BookOpen, color: 'text-warning' },
    { label: 'Usuarios', value: data?.adminUsersCount ?? 0, icon: GraduationCap, color: 'text-success' },
  ];

  return (
    <div>
      <PageHeader title="Panel de Administración" description="Gestiona la estructura académica del sistema" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(s => (
          <Card key={s.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
              <s.icon className={cn('h-5 w-5', s.color)} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-display flex items-center h-[36px]">
                {isLoading ? <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /> : s.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function cn(...classes: (string | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
