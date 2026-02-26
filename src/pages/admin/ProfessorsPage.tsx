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
import { mockProfessors as initialProfs, mockDepartments } from '@/data/mock-data';
import { Professor } from '@/types/domain';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ProfessorsPage() {
  const [professors, setProfessors] = useState<Professor[]>(initialProfs);
  const [editProf, setEditProf] = useState<Partial<Professor> | null>(null);
  const [open, setOpen] = useState(false);

  const handleSave = () => {
    if (!editProf?.name || !editProf?.email || !editProf?.departmentId) {
      toast.error('Todos los campos son requeridos');
      return;
    }
    if (editProf.id) {
      setProfessors(prev => prev.map(p => p.id === editProf.id ? { ...p, ...editProf } as Professor : p));
      toast.success('Profesor actualizado');
    } else {
      const newProf: Professor = {
        id: `p${Date.now()}`, userId: `u${Date.now()}`,
        name: editProf.name, email: editProf.email, departmentId: editProf.departmentId,
      };
      setProfessors(prev => [...prev, newProf]);
      toast.success('Profesor creado');
    }
    setOpen(false);
    setEditProf(null);
  };

  const getDeptName = (id: string) => mockDepartments.find(d => d.id === id)?.name || id;

  return (
    <div>
      <PageHeader
        title="Profesores"
        description="Gestiona el directorio de profesores"
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditProf({})}>
                <Plus className="mr-2 h-4 w-4" /> Nuevo Profesor
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editProf?.id ? 'Editar' : 'Nuevo'} Profesor</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div>
                  <Label>Nombre completo</Label>
                  <Input value={editProf?.name || ''} onChange={e => setEditProf(prev => ({ ...prev, name: e.target.value }))} />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input type="email" value={editProf?.email || ''} onChange={e => setEditProf(prev => ({ ...prev, email: e.target.value }))} />
                </div>
                <div>
                  <Label>Departamento</Label>
                  <Select value={editProf?.departmentId || ''} onValueChange={v => setEditProf(prev => ({ ...prev, departmentId: v }))}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent>
                      {mockDepartments.map(d => (
                        <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                <TableHead>Nombre</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Departamento</TableHead>
                <TableHead className="w-24">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {professors.map(prof => (
                <TableRow key={prof.id}>
                  <TableCell className="font-medium">{prof.name}</TableCell>
                  <TableCell className="text-muted-foreground">{prof.email}</TableCell>
                  <TableCell><Badge variant="secondary">{getDeptName(prof.departmentId)}</Badge></TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => { setEditProf(prof); setOpen(true); }}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => { setProfessors(prev => prev.filter(p => p.id !== prof.id)); toast.success('Profesor eliminado'); }}>
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
