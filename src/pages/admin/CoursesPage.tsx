import { useState, useMemo } from 'react';
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
import { Plus, Pencil, Trash2, Loader2, Building2, X, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
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
  const [filterDeptId, setFilterDeptId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

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

  const filteredCourses = useMemo(() => {
    let result = filterDeptId === 'all' ? courses : courses.filter((c) => c.departmentId === filterDeptId);
    const q = searchQuery.toLowerCase().trim();
    if (q) {
      result = result.filter((c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.semester?.toLowerCase().includes(q) ||
        (professorNameById.get(c.professorId) ?? '').toLowerCase().includes(q) ||
        (departmentNameById.get(c.departmentId) ?? '').toLowerCase().includes(q)
      );
    }
    return result;
  }, [courses, filterDeptId, searchQuery, professorNameById, departmentNameById]);

  const selectedDeptName = filterDeptId === 'all' ? null : departmentNameById.get(filterDeptId);

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

      {/* Filter bar */}
      <div className="mb-4 flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => setFilterDeptId('all')}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-1.5 text-sm font-medium transition-colors',
            filterDeptId === 'all'
              ? 'border-primary bg-primary text-primary-foreground shadow-sm'
              : 'border-border bg-card text-muted-foreground hover:bg-accent hover:text-accent-foreground',
          )}
        >
          Todas
        </button>

        <div className="h-6 w-px bg-border" />

        <Select
          value={filterDeptId === 'all' ? '__none__' : filterDeptId}
          onValueChange={(v) => setFilterDeptId(v === '__none__' ? 'all' : v)}
        >
          <SelectTrigger
            className={cn(
              'h-9 w-52 rounded-xl border text-sm font-medium transition-colors',
              filterDeptId !== 'all'
                ? 'border-primary bg-primary text-primary-foreground'
                : 'bg-card text-muted-foreground',
            )}
          >
            <Building2 className="mr-1.5 h-3.5 w-3.5 shrink-0" />
            <SelectValue placeholder="Por departamento…" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__" className="text-muted-foreground">Por departamento…</SelectItem>
            {departments.map((dept) => (
              <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {filterDeptId !== 'all' && selectedDeptName && (
          <Badge variant="secondary" className="gap-1 pr-1.5">
            {selectedDeptName}
            <button type="button" onClick={() => setFilterDeptId('all')} className="ml-0.5 rounded hover:opacity-70">
              <X className="h-3 w-3" />
            </button>
          </Badge>
        )}

        <span className="ml-auto flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar clases…"
              className="h-9 w-52 rounded-xl pl-8 text-sm"
            />
          </div>
          <span className="text-xs text-muted-foreground">
            {filteredCourses.length} clase{filteredCourses.length !== 1 ? 's' : ''}
          </span>
        </span>
      </div>

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
                filteredCourses.map((course) => (
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

              {!coursesQuery.isLoading && !coursesQuery.isError && filteredCourses.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                    {filterDeptId === 'all' ? 'Sin clases' : 'No hay clases para este departamento'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
