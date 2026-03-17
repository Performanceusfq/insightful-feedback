import { useState, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Plus, Pencil, Trash2, Loader2, AlertTriangle, Building2, X, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
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
  assignCoordinatorRole: boolean;
}

const defaultFormState: ProfessorFormState = {
  name: '',
  email: '',
  password: '',
  departmentId: '',
  assignCoordinatorRole: false,
};

export default function ProfessorsPage() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const [formState, setFormState] = useState<ProfessorFormState>(defaultFormState);
  const [open, setOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ProfessorRecord | null>(null);
  const [replacementProfessorId, setReplacementProfessorId] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const professorsQuery = useQuery({
    queryKey: ['admin-professors-page'],
    queryFn: fetchProfessorsPageData,
  });

  const departments = professorsQuery.data?.departments ?? [];
  const professors = professorsQuery.data?.professors ?? [];

  const departmentNameById = new Map(departments.map((department) => [department.id, department.name]));
  const selectedDeptName = departmentFilter === 'all' ? null : departmentNameById.get(departmentFilter);

  const filteredProfessors = useMemo(() => {
    let result = departmentFilter === 'all' ? professors : professors.filter((p) => p.departmentId === departmentFilter);
    const q = searchQuery.toLowerCase().trim();
    if (q) {
      result = result.filter((p) =>
        p.name.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q) ||
        (departmentNameById.get(p.departmentId) ?? '').toLowerCase().includes(q)
      );
    }
    return result;
  }, [professors, departmentFilter, searchQuery, departmentNameById]);

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
      assignCoordinatorRole: false,
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
      assignCoordinatorRole: formState.assignCoordinatorRole,
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
                      <Label htmlFor="assign-coordinator-role">Asignar rol de Coordinador</Label>
                      <p className="text-xs text-muted-foreground">Si está activo, el nuevo usuario tendrá roles de Profesor y Coordinador simultáneamente.</p>
                    </div>
                    <Switch
                      id="assign-coordinator-role"
                      checked={formState.assignCoordinatorRole}
                      onCheckedChange={(checked) => setFormState((prev) => ({ ...prev, assignCoordinatorRole: checked }))}
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

      {/* Filter bar */}
      <div className="mt-4 mb-4 flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => setDepartmentFilter('all')}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-1.5 text-sm font-medium transition-colors',
            departmentFilter === 'all'
              ? 'border-primary bg-primary text-primary-foreground shadow-sm'
              : 'border-border bg-card text-muted-foreground hover:bg-accent hover:text-accent-foreground',
          )}
        >
          Todos
        </button>

        <div className="h-6 w-px bg-border" />

        <Select
          value={departmentFilter === 'all' ? '__none__' : (departmentFilter ?? '__none__')}
          onValueChange={(v) => setDepartmentFilter(v === '__none__' ? 'all' : v)}
        >
          <SelectTrigger
            className={cn(
              'h-9 w-52 rounded-xl border text-sm font-medium transition-colors',
              departmentFilter !== 'all'
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

        {departmentFilter !== 'all' && selectedDeptName && (
          <Badge variant="secondary" className="gap-1 pr-1.5">
            {selectedDeptName}
            <button type="button" onClick={() => setDepartmentFilter('all')} className="ml-0.5 rounded hover:opacity-70">
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
              placeholder="Buscar profesores…"
              className="h-9 w-52 rounded-xl pl-8 text-sm"
            />
          </div>
          <span className="text-xs text-muted-foreground">
            {filteredProfessors.length} profesor{filteredProfessors.length !== 1 ? 'es' : ''}
          </span>
        </span>
      </div>

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
                filteredProfessors.map((professor) => (
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

              {!professorsQuery.isLoading && !professorsQuery.isError && filteredProfessors.length === 0 && (
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
