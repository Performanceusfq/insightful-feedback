import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AppRole, User } from '@/types/domain';
import { roleLabels } from '@/data/mock-data';
import { Plus, Trash2, Loader2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { fetchAdminUsers, createAdminUserAccount, deleteAdminUser } from '@/services/admin/users';

/**
 * Roles permitidos para creación desde esta página.
 */
const creatableRoles: AppRole[] = ['admin', 'coordinador', 'director'];

const roleBadgeVariant: Record<AppRole, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  admin: 'default',
  profesor: 'secondary',
  coordinador: 'secondary',
  profesor_coordinador: 'secondary',
  director: 'default',
  estudiante: 'outline',
};

export default function RolesPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: usersData, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['admin-users-list'],
    queryFn: fetchAdminUsers,
  });

  const users = usersData ?? [];

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<AppRole | ''>('');

  const createMutation = useMutation({
    mutationFn: createAdminUserAccount,
    onSuccess: () => {
      toast.success('Usuario creado de forma exitosa');
      setOpen(false);
      setName('');
      setEmail('');
      setPassword('');
      setRole('');
      queryClient.invalidateQueries({ queryKey: ['admin-users-list'] });
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Error al crear usuario');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAdminUser,
    onSuccess: () => {
      toast.success('Usuario eliminado');
      queryClient.invalidateQueries({ queryKey: ['admin-users-list'] });
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Error al eliminar usuario');
    }
  });

  const handleCreate = () => {
    if (!name || !email || !password || !role) {
      toast.error('Todos los campos son requeridos');
      return;
    }

    if (password.length < 8) {
      toast.error('La contraseña temporal debe tener al menos 8 caracteres');
      return;
    }

    createMutation.mutate({ name, email, password, role: role as AppRole });
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar este usuario administrativo?')) {
      deleteMutation.mutate({ userId: id });
    }
  };

  const isSubmitting = createMutation.isPending || deleteMutation.isPending;

  return (
    <div>
      <PageHeader
        title="Gestión de Usuarios"
        description="Crea usuarios administrativos, coordinadores o directores en el sistema."
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setName('');
                setEmail('');
                setPassword('');
                setRole('');
              }}>
                <Plus className="mr-2 h-4 w-4" /> Crear Usuario
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Crear Nuevo Usuario</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div>
                  <Label>Nombre completo</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej. Ana Pérez"
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="correo@uni.edu"
                  />
                </div>
                <div>
                  <Label>Contraseña temporal</Label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                  />
                </div>
                <div>
                  <Label>Rol del Usuario</Label>
                  <Select value={role} onValueChange={(v) => setRole(v as AppRole)}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar rol" /></SelectTrigger>
                    <SelectContent>
                      {creatableRoles.map((r) => (
                        <SelectItem key={r} value={r}>{roleLabels[r]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleCreate} className="w-full mt-4" disabled={isSubmitting}>
                  {createMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creando...</> : 'Crear Usuario'}
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
                <TableHead>Usuario</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="w-24 text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingUsers ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                    Cargando usuarios administrativos...
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                    No hay usuarios administrativos.
                  </TableCell>
                </TableRow>
              ) : (
                users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.name}</TableCell>
                    <TableCell>
                      {u.activeRole ? (
                        <Badge variant={roleBadgeVariant[u.activeRole]}>
                          {roleLabels[u.activeRole]}
                        </Badge>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{u.email}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(u.id)} disabled={isSubmitting}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
