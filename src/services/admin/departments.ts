import { supabase } from '@/lib/supabase';
import { requireAdminRole } from '@/services/auth/guards';

export interface DepartmentRecord {
  id: string;
  name: string;
  code: string;
  coordinatorId?: string;
}

export interface DepartmentUpsertInput {
  id?: string;
  name: string;
  code: string;
}

export async function fetchDepartments(): Promise<DepartmentRecord[]> {
  const { data, error } = await supabase
    .from('departments')
    .select('id, name, code, coordinator_id')
    .order('name', { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []).map((department) => ({
    id: department.id,
    name: department.name,
    code: department.code,
    coordinatorId: department.coordinator_id ?? undefined,
  }));
}

export async function upsertDepartment(input: DepartmentUpsertInput): Promise<DepartmentRecord> {
  await requireAdminRole();

  if (input.id) {
    const { data, error } = await supabase
      .from('departments')
      .update({ name: input.name, code: input.code })
      .eq('id', input.id)
      .select('id, name, code, coordinator_id')
      .single();

    if (error) {
      throw error;
    }

    return {
      id: data.id,
      name: data.name,
      code: data.code,
      coordinatorId: data.coordinator_id ?? undefined,
    };
  }

  const { data, error } = await supabase
    .from('departments')
    .insert({ name: input.name, code: input.code })
    .select('id, name, code, coordinator_id')
    .single();

  if (error) {
    throw error;
  }

  return {
    id: data.id,
    name: data.name,
    code: data.code,
    coordinatorId: data.coordinator_id ?? undefined,
  };
}

export async function deleteDepartment(id: string): Promise<void> {
  await requireAdminRole();

  const { error } = await supabase.from('departments').delete().eq('id', id);

  if (error) {
    throw error;
  }
}
