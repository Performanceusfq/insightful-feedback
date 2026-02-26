import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { mockDepartments, mockProfessors, mockCourses, mockUsers } from '@/data/mock-data';
import { Building2, Users, BookOpen, GraduationCap } from 'lucide-react';

const stats = [
  { label: 'Departamentos', value: mockDepartments.length, icon: Building2, color: 'text-primary' },
  { label: 'Profesores', value: mockProfessors.length, icon: Users, color: 'text-accent' },
  { label: 'Clases', value: mockCourses.length, icon: BookOpen, color: 'text-warning' },
  { label: 'Usuarios', value: mockUsers.length, icon: GraduationCap, color: 'text-success' },
];

export default function AdminDashboard() {
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
              <div className="text-3xl font-bold font-display">{s.value}</div>
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
