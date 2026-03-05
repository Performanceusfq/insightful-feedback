import { supabase } from '@/lib/supabase';
import { requireAdminRole } from '@/services/auth/guards';

export interface DepartmentOption {
  id: string;
  name: string;
  code: string;
}

export interface ProfessorOption {
  id: string;
  userId: string;
  name: string;
  email: string;
  departmentId: string;
}

export interface CourseRecord {
  id: string;
  name: string;
  code: string;
  semester: string;
  departmentId: string;
  professorId: string;
}

export interface CourseUpsertInput {
  id?: string;
  name: string;
  code: string;
  semester: string;
  departmentId: string;
  professorId: string;
}

export interface CoursesPageData {
  departments: DepartmentOption[];
  professors: ProfessorOption[];
  courses: CourseRecord[];
}

async function fetchDepartmentOptions(): Promise<DepartmentOption[]> {
  const { data, error } = await supabase.from('departments').select('id, name, code').order('name');

  if (error) {
    throw error;
  }

  return data ?? [];
}

async function fetchProfessorOptions(): Promise<ProfessorOption[]> {
  const { data: professors, error: professorsError } = await supabase
    .from('professors')
    .select('id, user_id, department_id');

  if (professorsError) {
    throw professorsError;
  }

  if (!professors || professors.length === 0) {
    return [];
  }

  const userIds = professors.map((professor) => professor.user_id);

  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, name, email')
    .in('id', userIds);

  if (profilesError) {
    throw profilesError;
  }

  const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile]));

  return professors
    .map((professor) => {
      const profile = profileMap.get(professor.user_id);
      if (!profile) {
        return null;
      }

      return {
        id: professor.id,
        userId: professor.user_id,
        name: profile.name,
        email: profile.email,
        departmentId: professor.department_id,
      };
    })
    .filter((professor): professor is ProfessorOption => professor !== null)
    .sort((a, b) => a.name.localeCompare(b.name));
}

async function fetchCourses(): Promise<CourseRecord[]> {
  const { data, error } = await supabase
    .from('courses')
    .select('id, name, code, semester, department_id, professor_id')
    .order('name');

  if (error) {
    throw error;
  }

  return (data ?? []).map((course) => ({
    id: course.id,
    name: course.name,
    code: course.code,
    semester: course.semester,
    departmentId: course.department_id,
    professorId: course.professor_id,
  }));
}

export async function fetchCoursesPageData(): Promise<CoursesPageData> {
  const [departments, professors, courses] = await Promise.all([
    fetchDepartmentOptions(),
    fetchProfessorOptions(),
    fetchCourses(),
  ]);

  return {
    departments,
    professors,
    courses,
  };
}

export async function upsertCourse(input: CourseUpsertInput): Promise<CourseRecord> {
  await requireAdminRole();

  const payload = {
    name: input.name,
    code: input.code,
    semester: input.semester,
    department_id: input.departmentId,
    professor_id: input.professorId,
  };

  if (input.id) {
    const { data, error } = await supabase
      .from('courses')
      .update(payload)
      .eq('id', input.id)
      .select('id, name, code, semester, department_id, professor_id')
      .single();

    if (error) {
      throw error;
    }

    return {
      id: data.id,
      name: data.name,
      code: data.code,
      semester: data.semester,
      departmentId: data.department_id,
      professorId: data.professor_id,
    };
  }

  const { data, error } = await supabase
    .from('courses')
    .insert(payload)
    .select('id, name, code, semester, department_id, professor_id')
    .single();

  if (error) {
    throw error;
  }

  return {
    id: data.id,
    name: data.name,
    code: data.code,
    semester: data.semester,
    departmentId: data.department_id,
    professorId: data.professor_id,
  };
}

export async function deleteCourse(id: string): Promise<void> {
  await requireAdminRole();

  const { error } = await supabase.from('courses').delete().eq('id', id);

  if (error) {
    throw error;
  }
}
