import {
  FunctionsFetchError,
  FunctionsHttpError,
  FunctionsRelayError,
} from '@supabase/supabase-js';
import { AppError } from '@/lib/app-errors';
import { supabase } from '@/lib/supabase';
import { requireAdminRole } from '@/services/auth/guards';

export interface DepartmentOption {
  id: string;
  name: string;
  code: string;
}

export interface ProfessorRecord {
  id: string;
  userId: string;
  name: string;
  email: string;
  departmentId: string;
  coursesCount: number;
}

export interface ProfessorsPageData {
  departments: DepartmentOption[];
  professors: ProfessorRecord[];
}

export interface CreateProfessorAccountInput {
  name: string;
  email: string;
  password: string;
  departmentId: string;
  keepStudentRole: boolean;
}

export interface UpdateProfessorInput {
  professorId: string;
  name: string;
  departmentId: string;
}

export interface DeleteProfessorInput {
  professorId: string;
  replacementProfessorId?: string | null;
}

export interface DeleteProfessorResult {
  deletedProfessorId: string;
  movedCourses: number;
}

async function fetchDepartmentOptions(): Promise<DepartmentOption[]> {
  const { data, error } = await supabase
    .from('departments')
    .select('id, name, code')
    .order('name');

  if (error) {
    throw error;
  }

  return data ?? [];
}

async function fetchProfessors(): Promise<ProfessorRecord[]> {
  const { data: professorRows, error: professorError } = await supabase
    .from('professors')
    .select('id, user_id, department_id');

  if (professorError) {
    throw professorError;
  }

  if (!professorRows || professorRows.length === 0) {
    return [];
  }

  const userIds = professorRows.map((professor) => professor.user_id);

  const [{ data: profiles, error: profilesError }, { data: courses, error: coursesError }] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, name, email')
      .in('id', userIds),
    supabase
      .from('courses')
      .select('professor_id')
      .in('professor_id', professorRows.map((professor) => professor.id)),
  ]);

  if (profilesError) {
    throw profilesError;
  }

  if (coursesError) {
    throw coursesError;
  }

  const profileById = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
  const coursesCountByProfessor = new Map<string, number>();

  for (const course of courses ?? []) {
    const currentCount = coursesCountByProfessor.get(course.professor_id) ?? 0;
    coursesCountByProfessor.set(course.professor_id, currentCount + 1);
  }

  return professorRows
    .map((professor) => {
      const profile = profileById.get(professor.user_id);
      if (!profile) {
        return null;
      }

      return {
        id: professor.id,
        userId: professor.user_id,
        name: profile.name,
        email: profile.email,
        departmentId: professor.department_id,
        coursesCount: coursesCountByProfessor.get(professor.id) ?? 0,
      };
    })
    .filter((professor): professor is ProfessorRecord => professor !== null)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function fetchProfessorsPageData(): Promise<ProfessorsPageData> {
  const [departments, professors] = await Promise.all([
    fetchDepartmentOptions(),
    fetchProfessors(),
  ]);

  return {
    departments,
    professors,
  };
}

async function getFunctionErrorMessage(error: FunctionsHttpError): Promise<string> {
  try {
    const payload = await error.context.json() as { error?: string; message?: string };
    return payload.error ?? payload.message ?? error.message;
  } catch {
    return error.message;
  }
}

export async function createProfessorAccount(input: CreateProfessorAccountInput): Promise<ProfessorRecord> {
  await requireAdminRole();

  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const password = input.password;
  const departmentId = input.departmentId;
  const keepStudentRole = input.keepStudentRole;

  if (!name || !email || !password || !departmentId) {
    throw new Error('Todos los campos son requeridos.');
  }

  const { data, error } = await supabase.functions.invoke('admin-professors-create', {
    body: {
      name,
      email,
      password,
      departmentId,
      keepStudentRole,
    },
  });

  if (error instanceof FunctionsHttpError) {
    const status = error.context.status;
    const message = await getFunctionErrorMessage(error);

    if (status === 400) {
      throw new Error(message || 'Datos inválidos para crear el profesor.');
    }

    if (status === 403) {
      throw new AppError('FORBIDDEN', 'No tienes permisos para realizar esta acción.');
    }

    if (status === 409) {
      throw new Error('Ya existe un usuario con ese correo.');
    }

    throw new Error(message || 'No se pudo crear el profesor.');
  }

  if (error instanceof FunctionsRelayError || error instanceof FunctionsFetchError) {
    throw new Error('No se pudo conectar con el servicio de creación de profesores.');
  }

  if (error) {
    throw error;
  }

  const created = data as {
    professorId: string;
    userId: string;
    name: string;
    email: string;
    departmentId: string;
  } | null;

  if (!created) {
    throw new Error('No se recibió respuesta válida al crear el profesor.');
  }

  return {
    id: created.professorId,
    userId: created.userId,
    name: created.name,
    email: created.email,
    departmentId: created.departmentId,
    coursesCount: 0,
  };
}

export async function updateProfessor(input: UpdateProfessorInput): Promise<ProfessorRecord> {
  await requireAdminRole();

  const professorId = input.professorId;
  const name = input.name.trim();
  const departmentId = input.departmentId;

  if (!professorId || !name || !departmentId) {
    throw new Error('Nombre y departamento son requeridos.');
  }

  const { data: professorRow, error: professorRowError } = await supabase
    .from('professors')
    .select('id, user_id, department_id')
    .eq('id', professorId)
    .single();

  if (professorRowError) {
    throw professorRowError;
  }

  const [{ data: updatedProfessor, error: updateProfessorError }, { data: updatedProfile, error: updateProfileError }] = await Promise.all([
    supabase
      .from('professors')
      .update({ department_id: departmentId })
      .eq('id', professorId)
      .select('id, user_id, department_id')
      .single(),
    supabase
      .from('profiles')
      .update({ name, department_id: departmentId })
      .eq('id', professorRow.user_id)
      .select('id, name, email')
      .single(),
  ]);

  if (updateProfessorError) {
    throw updateProfessorError;
  }

  if (updateProfileError) {
    throw updateProfileError;
  }

  return {
    id: updatedProfessor.id,
    userId: updatedProfessor.user_id,
    name: updatedProfile.name,
    email: updatedProfile.email,
    departmentId: updatedProfessor.department_id,
    coursesCount: 0,
  };
}

export async function deleteProfessor(input: DeleteProfessorInput): Promise<DeleteProfessorResult> {
  await requireAdminRole();

  const professorId = input.professorId;
  const replacementProfessorId = input.replacementProfessorId ?? null;

  if (!professorId) {
    throw new Error('Profesor inválido.');
  }

  if (replacementProfessorId === professorId) {
    throw new Error('El profesor de reemplazo debe ser diferente.');
  }

  const { data, error } = await supabase.rpc('admin_delete_professor', {
    p_professor_id: professorId,
    p_replacement_professor_id: replacementProfessorId,
  });

  if (error) {
    throw error;
  }

  const response = (data ?? {}) as { deleted_professor_id?: string; moved_courses?: number };

  return {
    deletedProfessorId: response.deleted_professor_id ?? professorId,
    movedCourses: Number(response.moved_courses ?? 0),
  };
}
