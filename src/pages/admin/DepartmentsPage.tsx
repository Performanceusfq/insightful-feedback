import { useState } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { mockDepartments as initialDepts } from '@/data/mock-data';
import { Department } from '@/types/domain';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>(initialDepts);
  const [editDept, setEditDept] = useState<Partial<Department> | null>(null);
  const [open, setOpen] = useState(false);

  const handleSave = () => {
    if (!editDept?.name || !editDept?.code) {
      toast.error('Nombre y código son requeridos');
      return;
    }
    if (editDept.id) {
      setDepartments(prev => prev.map(d => d.id === editDept.id ? { ...d, ...editDept } as Department : d));
      toast.success('Departamento actualizado');
    } else {
      const newDept: Department = { id: `d${Date.now()}`, name: editDept.name, code: editDept.code };
      setDepartments(prev => [...prev, newDept]);
      toast.success('Departamento creado');
    }
    setOpen(false);
    setEditDept(null);
  };

  const handleDelete = (id: string) => {
    setDepartments(prev => prev.filter(d => d.id !== id));
    toast.success('Departamento eliminado');
  };

  return (
    <div>
      <PageHeader
        title="Departamentos"
        description="Gestiona los departamentos académicos"
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditDept({})}>
                <Plus className="mr-2 h-4 w-4" /> Nuevo Departamento
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editDept?.id ? 'Editar' : 'Nuevo'} Departamento</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div>
                  <Label>Nombre</Label>
                  <Input value={editDept?.name || ''} onChange={e => setEditDept(prev => ({ ...prev, name: e.target.value }))} placeholder="Ingeniería de Software" />
                </div>
                <div>
                  <Label>Código</Label>
                  <Input value={editDept?.code || ''} onChange={e => setEditDept(prev => ({ ...prev, code: e.target.value }))} placeholder="ISW" />
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
                <TableHead className="w-24">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {departments.map(dept => (
                <TableRow key={dept.id}>
                  <TableCell className="font-mono text-sm font-medium">{dept.code}</TableCell>
                  <TableCell>{dept.name}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => { setEditDept(dept); setOpen(true); }}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(dept.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {departments.length === 0 && (
                <TableRow><TableCell colSpan={3} className="py-8 text-center text-muted-foreground">Sin departamentos</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
