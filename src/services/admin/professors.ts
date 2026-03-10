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
  accessToken?: string;
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

export async function createProfessorAccount(input: CreateProfessorAccountInput): Promise<ProfessorRecord> {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const password = input.password;
  const departmentId = input.departmentId;
  const keepStudentRole = input.keepStudentRole;
  const preferredAccessToken = input.accessToken?.trim() ?? '';

  if (!name || !email || !password || !departmentId) {
    throw new Error('Todos los campos son requeridos.');
  }

  const allowNonAsig = import.meta.env.VITE_ALLOW_NON_ASIG_EMAILS === 'true';
  if (!allowNonAsig && !email.includes('@asig')) {
    throw new Error('Solo se permite la creación de profesores con correos que contengan @asig.');
  }

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    throw new Error('No se pudo validar tu sesión actual.');
  }

  const sessionAccessToken = session?.access_token?.trim() ?? '';
  const accessTokenCandidates = [sessionAccessToken, preferredAccessToken].filter((token, index, array) => (
    Boolean(token) && array.indexOf(token) === index
  ));

  if (accessTokenCandidates.length === 0) {
    throw new AppError('AUTH_REQUIRED', 'Debes iniciar sesión para realizar esta acción.');
  }

  let accessToken: string | null = null;

  for (const tokenCandidate of accessTokenCandidates) {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(tokenCandidate);

    if (!userError && user) {
      accessToken = tokenCandidate;
      break;
    }
  }

  if (!accessToken) {
    throw new AppError('AUTH_REQUIRED', 'Tu sesión no es válida. Cierra sesión e inicia nuevamente.');
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (!supabaseUrl) {
    throw new Error('Falta configuración de Supabase en el cliente.');
  }

  const endpoint = `${supabaseUrl}/functions/v1/admin-professors-create`;

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        name,
        email,
        password,
        departmentId,
        keepStudentRole,
      }),
    });
  } catch {
    throw new Error('No se pudo conectar con el servicio de creación de profesores.');
  }

  const payload = await response.json().catch(() => null) as { error?: string; message?: string } | null;
  const message = payload?.error ?? payload?.message ?? '';

  if (!response.ok) {
    if (response.status === 400) {
      throw new Error(message || 'Datos inválidos para crear el profesor.');
    }

    if (response.status === 401) {
      throw new AppError('AUTH_REQUIRED', message || 'Debes iniciar sesión para realizar esta acción.');
    }

    if (response.status === 403) {
      throw new AppError('FORBIDDEN', message || 'No tienes permisos para realizar esta acción.');
    }

    if (response.status === 409) {
      throw new Error('Ya existe un usuario con ese correo.');
    }

    throw new Error(message || 'No se pudo crear el profesor.');
  }

  const created = payload as {
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
  const professorId = input.professorId;
  const replacementProfessorId = input.replacementProfessorId ?? null;

  if (!professorId) {
    throw new Error('Profesor inválido.');
  }

  if (replacementProfessorId === professorId) {
    throw new Error('El profesor de reemplazo debe ser diferente.');
  }

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session?.access_token) {
    throw new AppError('AUTH_REQUIRED', 'Debes iniciar sesión para realizar esta acción.');
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (!supabaseUrl) {
    throw new Error('Falta configuración de Supabase en el cliente.');
  }

  const endpoint = `${supabaseUrl}/functions/v1/admin-professors-delete`;

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        professorId,
        replacementProfessorId,
      }),
    });
  } catch {
    throw new Error('No se pudo conectar con el servicio de eliminación de profesores.');
  }

  const payload = await response.json().catch(() => null) as { error?: string; movedCourses?: number } | null;
  const message = payload?.error ?? '';

  if (!response.ok) {
    if (response.status === 400) {
      throw new Error(message || 'No se puede eliminar el profesor (puede tener clases asignadas sin reemplazo).');
    }
    if (response.status === 401) {
      throw new AppError('AUTH_REQUIRED', message || 'Debes iniciar sesión para realizar esta acción.');
    }
    if (response.status === 403) {
      throw new AppError('FORBIDDEN', message || 'No tienes permisos para realizar esta acción.');
    }
    throw new Error(message || 'No se pudo eliminar el profesor.');
  }

  return {
    deletedProfessorId: professorId,
    movedCourses: Number(payload?.movedCourses ?? 0),
  };
}
