import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { getUserFacingErrorMessage } from '@/lib/error-messages';
import {
  deleteCourse,
  fetchCoursesPageData,
  upsertCourse,
  type CourseRecord,
} from '@/services/admin/courses';

export default function CoursesPage() {
  const queryClient = useQueryClient();
  const [editCourse, setEditCourse] = useState<Partial<CourseRecord> | null>(null);
  const [open, setOpen] = useState(false);

  const coursesQuery = useQuery({
    queryKey: ['admin-courses-page'],
    queryFn: fetchCoursesPageData,
  });

  const upsertMutation = useMutation({
    mutationFn: upsertCourse,
    onSuccess: (_, variables) => {
      toast.success(variables.id ? 'Clase actualizada' : 'Clase creada');
      setOpen(false);
      setEditCourse(null);
      queryClient.invalidateQueries({ queryKey: ['admin-courses-page'] });
    },
    onError: (error: { message?: string }) => {
      toast.error(getUserFacingErrorMessage(error, 'No se pudo guardar la clase'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCourse,
    onSuccess: () => {
      toast.success('Clase eliminada');
      queryClient.invalidateQueries({ queryKey: ['admin-courses-page'] });
    },
    onError: (error: { message?: string }) => {
      toast.error(getUserFacingErrorMessage(error, 'No se pudo eliminar la clase'));
    },
  });

  const courses = coursesQuery.data?.courses ?? [];
  const departments = coursesQuery.data?.departments ?? [];
  const professors = coursesQuery.data?.professors ?? [];

  const departmentNameById = new Map(departments.map((department) => [department.id, department.name]));
  const professorNameById = new Map(professors.map((professor) => [professor.id, professor.name]));

  const handleSave = () => {
    if (
      !editCourse?.name?.trim()
      || !editCourse?.code?.trim()
      || !editCourse?.departmentId
      || !editCourse?.professorId
      || !editCourse?.semester?.trim()
    ) {
      toast.error('Todos los campos son requeridos');
      return;
    }

    upsertMutation.mutate({
      id: editCourse.id,
      name: editCourse.name.trim(),
      code: editCourse.code.trim(),
      departmentId: editCourse.departmentId,
      professorId: editCourse.professorId,
      semester: editCourse.semester.trim(),
    });
  };

  return (
    <div>
      <PageHeader
        title="Clases"
        description="Gestiona las asignaturas del semestre"
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => setEditCourse({ semester: '2026-1' })}
                disabled={departments.length === 0 || professors.length === 0}
              >
                <Plus className="mr-2 h-4 w-4" /> Nueva Clase
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editCourse?.id ? 'Editar' : 'Nueva'} Clase</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div>
                  <Label>Nombre</Label>
                  <Input
                    value={editCourse?.name || ''}
                    onChange={(event) => setEditCourse((prev) => ({ ...prev, name: event.target.value }))}
                  />
                </div>
                <div>
                  <Label>Código</Label>
                  <Input
                    value={editCourse?.code || ''}
                    onChange={(event) => setEditCourse((prev) => ({ ...prev, code: event.target.value }))}
                  />
                </div>
                <div>
                  <Label>Departamento</Label>
                  <Select
                    value={editCourse?.departmentId || ''}
                    onValueChange={(value) => setEditCourse((prev) => ({ ...prev, departmentId: value }))}
                  >
                    <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent>
                      {departments.map((department) => (
                        <SelectItem key={department.id} value={department.id}>{department.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Profesor</Label>
                  <Select
                    value={editCourse?.professorId || ''}
                    onValueChange={(value) => setEditCourse((prev) => ({ ...prev, professorId: value }))}
                  >
                    <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent>
                      {professors.map((professor) => (
                        <SelectItem key={professor.id} value={professor.id}>{professor.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Semestre</Label>
                  <Input
                    value={editCourse?.semester || '2026-1'}
                    onChange={(event) => setEditCourse((prev) => ({ ...prev, semester: event.target.value }))}
                  />
                </div>
                <Button onClick={handleSave} className="w-full" disabled={upsertMutation.isPending}>
                  {upsertMutation.isPending ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...</>
                  ) : (
                    'Guardar'
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Profesor</TableHead>
                <TableHead>Departamento</TableHead>
                <TableHead>Semestre</TableHead>
                <TableHead className="w-24">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {coursesQuery.isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">Cargando clases...</TableCell>
                </TableRow>
              ) : coursesQuery.isError ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-destructive">No se pudo cargar clases</TableCell>
                </TableRow>
              ) : (
                courses.map((course) => (
                  <TableRow key={course.id}>
                    <TableCell className="font-mono text-sm font-medium">{course.code}</TableCell>
                    <TableCell>{course.name}</TableCell>
                    <TableCell>{professorNameById.get(course.professorId) ?? '—'}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{departmentNameById.get(course.departmentId) ?? '—'}</Badge>
                    </TableCell>
                    <TableCell>{course.semester}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditCourse(course);
                            setOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteMutation.mutate(course.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}

              {!coursesQuery.isLoading && !coursesQuery.isError && courses.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">Sin clases</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
