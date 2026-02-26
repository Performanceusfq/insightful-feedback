import { useState } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { mockUsers, mockUserRoles as initialRoles, roleLabels } from '@/data/mock-data';
import { UserRole, AppRole } from '@/types/domain';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const allRoles: AppRole[] = ['estudiante', 'profesor', 'admin', 'coordinador', 'director'];

const roleBadgeVariant: Record<AppRole, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  admin: 'default',
  profesor: 'secondary',
  coordinador: 'secondary',
  director: 'default',
  estudiante: 'outline',
};

export default function RolesPage() {
  const [roles, setRoles] = useState<UserRole[]>(initialRoles);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState<AppRole | ''>('');
  const [open, setOpen] = useState(false);

  const handleAdd = () => {
    if (!selectedUserId || !selectedRole) {
      toast.error('Selecciona usuario y rol');
      return;
    }
    if (roles.find(r => r.userId === selectedUserId && r.role === selectedRole)) {
      toast.error('El usuario ya tiene este rol');
      return;
    }
    setRoles(prev => [...prev, { id: `ur${Date.now()}`, userId: selectedUserId, role: selectedRole as AppRole }]);
    toast.success('Rol asignado');
    setOpen(false);
    setSelectedUserId('');
    setSelectedRole('');
  };

  const handleDelete = (id: string) => {
    setRoles(prev => prev.filter(r => r.id !== id));
    toast.success('Rol removido');
  };

  const getUserName = (userId: string) => mockUsers.find(u => u.id === userId)?.name || userId;

  return (
    <div>
      <PageHeader
        title="Asignación de Roles"
        description="Gestiona los roles de cada usuario del sistema"
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { setSelectedUserId(''); setSelectedRole(''); }}>
                <Plus className="mr-2 h-4 w-4" /> Asignar Rol
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Asignar Rol</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div>
                  <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar usuario" /></SelectTrigger>
                    <SelectContent>
                      {mockUsers.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Select value={selectedRole} onValueChange={v => setSelectedRole(v as AppRole)}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar rol" /></SelectTrigger>
                    <SelectContent>
                      {allRoles.map(r => <SelectItem key={r} value={r}>{roleLabels[r]}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleAdd} className="w-full">Asignar</Button>
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
                <TableHead className="w-20">Acción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.map(ur => (
                <TableRow key={ur.id}>
                  <TableCell className="font-medium">{getUserName(ur.userId)}</TableCell>
                  <TableCell>
                    <Badge variant={roleBadgeVariant[ur.role]}>{roleLabels[ur.role]}</Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(ur.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
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
