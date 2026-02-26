import { useState } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { mockCourses as initialCourses, mockDepartments, mockProfessors } from '@/data/mock-data';
import { Course } from '@/types/domain';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>(initialCourses);
  const [editCourse, setEditCourse] = useState<Partial<Course> | null>(null);
  const [open, setOpen] = useState(false);

  const handleSave = () => {
    if (!editCourse?.name || !editCourse?.code || !editCourse?.departmentId || !editCourse?.professorId) {
      toast.error('Todos los campos son requeridos');
      return;
    }
    if (editCourse.id) {
      setCourses(prev => prev.map(c => c.id === editCourse.id ? { ...c, ...editCourse } as Course : c));
      toast.success('Clase actualizada');
    } else {
      const newCourse: Course = {
        id: `c${Date.now()}`, name: editCourse.name, code: editCourse.code,
        departmentId: editCourse.departmentId, professorId: editCourse.professorId,
        semester: editCourse.semester || '2026-1',
      };
      setCourses(prev => [...prev, newCourse]);
      toast.success('Clase creada');
    }
    setOpen(false);
    setEditCourse(null);
  };

  const getDeptName = (id: string) => mockDepartments.find(d => d.id === id)?.name || id;
  const getProfName = (id: string) => mockProfessors.find(p => p.id === id)?.name || id;

  return (
    <div>
      <PageHeader
        title="Clases"
        description="Gestiona las asignaturas del semestre"
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditCourse({})}>
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
                  <Input value={editCourse?.name || ''} onChange={e => setEditCourse(prev => ({ ...prev, name: e.target.value }))} />
                </div>
                <div>
                  <Label>Código</Label>
                  <Input value={editCourse?.code || ''} onChange={e => setEditCourse(prev => ({ ...prev, code: e.target.value }))} />
                </div>
                <div>
                  <Label>Departamento</Label>
                  <Select value={editCourse?.departmentId || ''} onValueChange={v => setEditCourse(prev => ({ ...prev, departmentId: v }))}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent>
                      {mockDepartments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Profesor</Label>
                  <Select value={editCourse?.professorId || ''} onValueChange={v => setEditCourse(prev => ({ ...prev, professorId: v }))}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent>
                      {mockProfessors.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Semestre</Label>
                  <Input value={editCourse?.semester || '2026-1'} onChange={e => setEditCourse(prev => ({ ...prev, semester: e.target.value }))} />
                </div>
                <Button onClick={handleSave} className="w-full">Guardar</Button>
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
              {courses.map(course => (
                <TableRow key={course.id}>
                  <TableCell className="font-mono text-sm font-medium">{course.code}</TableCell>
                  <TableCell>{course.name}</TableCell>
                  <TableCell>{getProfName(course.professorId)}</TableCell>
                  <TableCell><Badge variant="secondary">{getDeptName(course.departmentId)}</Badge></TableCell>
                  <TableCell>{course.semester}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => { setEditCourse(course); setOpen(true); }}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => { setCourses(prev => prev.filter(c => c.id !== course.id)); toast.success('Clase eliminada'); }}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
