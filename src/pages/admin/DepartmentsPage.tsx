import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { getUserFacingErrorMessage } from '@/lib/error-messages';
import {
  deleteDepartment,
  fetchDepartments,
  upsertDepartment,
  type DepartmentUpsertInput,
} from '@/services/admin/departments';

export default function DepartmentsPage() {
  const queryClient = useQueryClient();
  const [editDept, setEditDept] = useState<Partial<DepartmentUpsertInput> | null>(null);
  const [open, setOpen] = useState(false);

  const departmentsQuery = useQuery({
    queryKey: ['admin-departments'],
    queryFn: fetchDepartments,
  });

  const upsertMutation = useMutation({
    mutationFn: upsertDepartment,
    onSuccess: (_, variables) => {
      toast.success(variables.id ? 'Departamento actualizado' : 'Departamento creado');
      setOpen(false);
      setEditDept(null);
      queryClient.invalidateQueries({ queryKey: ['admin-departments'] });
    },
    onError: (error: { message?: string }) => {
      toast.error(getUserFacingErrorMessage(error, 'No se pudo guardar el departamento'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteDepartment,
    onSuccess: () => {
      toast.success('Departamento eliminado');
      queryClient.invalidateQueries({ queryKey: ['admin-departments'] });
    },
    onError: (error: { message?: string }) => {
      toast.error(getUserFacingErrorMessage(error, 'No se pudo eliminar el departamento'));
    },
  });

  const handleSave = () => {
    if (!editDept?.name?.trim() || !editDept?.code?.trim()) {
      toast.error('Nombre y código son requeridos');
      return;
    }

    upsertMutation.mutate({
      id: editDept.id,
      name: editDept.name.trim(),
      code: editDept.code.trim(),
    });
  };

  const departments = departmentsQuery.data ?? [];

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
                  <Input
                    value={editDept?.name || ''}
                    onChange={(event) => setEditDept((prev) => ({ ...prev, name: event.target.value }))}
                    placeholder="Ingeniería de Software"
                  />
                </div>
                <div>
                  <Label>Código</Label>
                  <Input
                    value={editDept?.code || ''}
                    onChange={(event) => setEditDept((prev) => ({ ...prev, code: event.target.value }))}
                    placeholder="ISW"
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
                <TableHead className="w-24">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {departmentsQuery.isLoading ? (
                <TableRow>
                  <TableCell colSpan={3} className="py-8 text-center text-muted-foreground">Cargando departamentos...</TableCell>
                </TableRow>
              ) : departmentsQuery.isError ? (
                <TableRow>
                  <TableCell colSpan={3} className="py-8 text-center text-destructive">No se pudo cargar departamentos</TableCell>
                </TableRow>
              ) : (
                departments.map((department) => (
                  <TableRow key={department.id}>
                    <TableCell className="font-mono text-sm font-medium">{department.code}</TableCell>
                    <TableCell>{department.name}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditDept({ id: department.id, name: department.name, code: department.code });
                            setOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteMutation.mutate(department.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}

              {!departmentsQuery.isLoading && !departmentsQuery.isError && departments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="py-8 text-center text-muted-foreground">Sin departamentos</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
