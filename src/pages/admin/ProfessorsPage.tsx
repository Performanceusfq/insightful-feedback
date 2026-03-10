import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Plus, Pencil, Trash2, Loader2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { getUserFacingErrorMessage } from '@/lib/error-messages';
import {
  createProfessorAccount,
  deleteProfessor,
  fetchProfessorsPageData,
  type ProfessorRecord,
  updateProfessor,
} from '@/services/admin/professors';

interface ProfessorFormState {
  id?: string;
  name: string;
  email: string;
  password: string;
  departmentId: string;
  keepStudentRole: boolean;
}

const defaultFormState: ProfessorFormState = {
  name: '',
  email: '',
  password: '',
  departmentId: '',
  keepStudentRole: false,
};

export default function ProfessorsPage() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const [formState, setFormState] = useState<ProfessorFormState>(defaultFormState);
  const [open, setOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ProfessorRecord | null>(null);
  const [replacementProfessorId, setReplacementProfessorId] = useState('');

  const professorsQuery = useQuery({
    queryKey: ['admin-professors-page'],
    queryFn: fetchProfessorsPageData,
  });

  const departments = professorsQuery.data?.departments ?? [];
  const professors = professorsQuery.data?.professors ?? [];

  const departmentNameById = new Map(departments.map((department) => [department.id, department.name]));

  const invalidateProfessorRelatedQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-professors-page'] });
    queryClient.invalidateQueries({ queryKey: ['admin-courses-page'] });
  };

  const createMutation = useMutation({
    mutationFn: createProfessorAccount,
    onSuccess: () => {
      toast.success('Profesor creado');
      setOpen(false);
      setFormState(defaultFormState);
      invalidateProfessorRelatedQueries();
    },
    onError: (error: unknown) => {
      toast.error(getUserFacingErrorMessage(error, 'No se pudo crear el profesor'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateProfessor,
    onSuccess: () => {
      toast.success('Profesor actualizado');
      setOpen(false);
      setFormState(defaultFormState);
      invalidateProfessorRelatedQueries();
    },
    onError: (error: unknown) => {
      toast.error(getUserFacingErrorMessage(error, 'No se pudo actualizar el profesor'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProfessor,
    onSuccess: (result) => {
      if (result.movedCourses > 0) {
        toast.success(`Profesor eliminado. ${result.movedCourses} curso(s) reasignado(s).`);
      } else {
        toast.success('Profesor eliminado');
      }
      setDeleteTarget(null);
      setReplacementProfessorId('');
      invalidateProfessorRelatedQueries();
    },
    onError: (error: unknown) => {
      toast.error(getUserFacingErrorMessage(error, 'No se pudo eliminar el profesor'));
    },
  });

  const isEditing = Boolean(formState.id);
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const handleOpenCreate = () => {
    setFormState(defaultFormState);
    setOpen(true);
  };

  const handleOpenEdit = (professor: ProfessorRecord) => {
    setFormState({
      id: professor.id,
      name: professor.name,
      email: professor.email,
      password: '',
      departmentId: professor.departmentId,
      keepStudentRole: false,
    });
    setOpen(true);
  };

  const handleSave = () => {
    const name = formState.name.trim();
    const departmentId = formState.departmentId;

    if (!name || !departmentId) {
      toast.error('Nombre y departamento son requeridos');
      return;
    }

    if (isEditing && formState.id) {
      updateMutation.mutate({
        professorId: formState.id,
        name,
        departmentId,
      });
      return;
    }

    const email = formState.email.trim().toLowerCase();
    const password = formState.password;

    if (!email || !password) {
      toast.error('Correo y contraseña temporal son requeridos');
      return;
    }

    if (password.length < 8) {
      toast.error('La contraseña temporal debe tener al menos 8 caracteres');
      return;
    }

    if (!session?.access_token) {
      toast.error('Tu sesión expiró. Vuelve a iniciar sesión.');
      return;
    }

    createMutation.mutate({
      name,
      email,
      password,
      departmentId,
      keepStudentRole: formState.keepStudentRole,
      accessToken: session.access_token,
    });
  };

  const handleOpenDelete = (professor: ProfessorRecord) => {
    setDeleteTarget(professor);

    if (professor.coursesCount > 0) {
      const firstCandidateId = professors.find((candidate) => candidate.id !== professor.id)?.id ?? '';
      setReplacementProfessorId(firstCandidateId);
      return;
    }

    setReplacementProfessorId('');
  };

  const deleteCandidates = deleteTarget
    ? professors.filter((professor) => professor.id !== deleteTarget.id)
    : [];

  const requiresReplacement = Boolean(deleteTarget && deleteTarget.coursesCount > 0);
  const canConfirmDelete = !requiresReplacement || Boolean(replacementProfessorId);

  const handleConfirmDelete = () => {
    if (!deleteTarget) {
      return;
    }

    if (requiresReplacement && !replacementProfessorId) {
      toast.error('Selecciona un profesor de reemplazo para sus cursos');
      return;
    }

    deleteMutation.mutate({
      professorId: deleteTarget.id,
      replacementProfessorId: requiresReplacement ? replacementProfessorId : null,
    });
  };

  return (
    <div>
      <PageHeader
        title="Profesores"
        description="Gestiona el directorio de profesores"
        action={(
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleOpenCreate} disabled={departments.length === 0}>
                <Plus className="mr-2 h-4 w-4" /> Nuevo Profesor
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{isEditing ? 'Editar' : 'Nuevo'} Profesor</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div>
                  <Label>Nombre completo</Label>
                  <Input
                    value={formState.name}
                    onChange={(event) => setFormState((prev) => ({ ...prev, name: event.target.value }))}
                    placeholder="Dr. Juan Pérez"
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={formState.email}
                    onChange={(event) => setFormState((prev) => ({ ...prev, email: event.target.value }))}
                    readOnly={isEditing}
                    disabled={isEditing}
                    placeholder="jperez@uni.edu"
                  />
                </div>
                {!isEditing && (
                  <div>
                    <Label>Contraseña temporal</Label>
                    <Input
                      type="password"
                      value={formState.password}
                      onChange={(event) => setFormState((prev) => ({ ...prev, password: event.target.value }))}
                      placeholder="Mínimo 8 caracteres"
                    />
                  </div>
                )}
                <div>
                  <Label>Departamento</Label>
                  <Select
                    value={formState.departmentId}
                    onValueChange={(value) => setFormState((prev) => ({ ...prev, departmentId: value }))}
                  >
                    <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent>
                      {departments.map((department) => (
                        <SelectItem key={department.id} value={department.id}>{department.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {!isEditing && (
                  <div className="flex items-center justify-between rounded-md border px-3 py-2">
                    <div>
                      <Label htmlFor="keep-student-role">Mantener rol estudiante</Label>
                      <p className="text-xs text-muted-foreground">Si está activo, el nuevo usuario tendrá roles profesor + estudiante.</p>
                    </div>
                    <Switch
                      id="keep-student-role"
                      checked={formState.keepStudentRole}
                      onCheckedChange={(checked) => setFormState((prev) => ({ ...prev, keepStudentRole: checked }))}
                    />
                  </div>
                )}
                <Button onClick={handleSave} className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...</>
                  ) : (
                    'Guardar'
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Departamento</TableHead>
                <TableHead className="text-center">Cursos</TableHead>
                <TableHead className="w-24">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {professorsQuery.isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">Cargando profesores...</TableCell>
                </TableRow>
              ) : professorsQuery.isError ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-destructive">No se pudo cargar profesores</TableCell>
                </TableRow>
              ) : (
                professors.map((professor) => (
                  <TableRow key={professor.id}>
                    <TableCell className="font-medium">{professor.name}</TableCell>
                    <TableCell className="text-muted-foreground">{professor.email}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{departmentNameById.get(professor.departmentId) ?? '—'}</Badge>
                    </TableCell>
                    <TableCell className="text-center font-medium">{professor.coursesCount}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenEdit(professor)}
                          disabled={isSubmitting || deleteMutation.isPending}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDelete(professor)}
                          disabled={isSubmitting || deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}

              {!professorsQuery.isLoading && !professorsQuery.isError && professors.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">Sin profesores</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog
        open={Boolean(deleteTarget)}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setDeleteTarget(null);
            setReplacementProfessorId('');
          }
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <div className="flex items-center gap-2 text-destructive mb-2">
              <AlertTriangle className="h-5 w-5" />
              <DialogTitle>Eliminar profesor permanentemente</DialogTitle>
            </div>
            <DialogDescription className="text-base">
              {deleteTarget
                ? <>Estás a punto de eliminar a <strong>{deleteTarget.name}</strong>. Esta acción borrará por completo su cuenta de acceso al sistema y no se puede deshacer.</>
                : 'Vas a eliminar este profesor.'}
            </DialogDescription>
          </DialogHeader>

          {requiresReplacement && (
            <div className="space-y-2">
              <Label>Profesor de reemplazo para {deleteTarget?.coursesCount} curso(s)</Label>
              <Select value={replacementProfessorId} onValueChange={setReplacementProfessorId}>
                <SelectTrigger><SelectValue placeholder="Seleccionar reemplazo" /></SelectTrigger>
                <SelectContent>
                  {deleteCandidates.map((candidate) => (
                    <SelectItem key={candidate.id} value={candidate.id}>{candidate.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {deleteCandidates.length === 0 && (
                <p className="text-sm text-destructive">No hay profesores disponibles para reasignar cursos.</p>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteTarget(null);
                setReplacementProfessorId('');
              }}
              disabled={deleteMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleteMutation.isPending || !canConfirmDelete || (requiresReplacement && deleteCandidates.length === 0)}
            >
              {deleteMutation.isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Eliminando...</>
              ) : (
                'Eliminar'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
