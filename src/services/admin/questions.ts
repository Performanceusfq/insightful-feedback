import { supabase } from '@/lib/supabase';
import type { Json } from '@/integrations/supabase/types';
import { requireAdminRole } from '@/services/auth/guards';
import type { Question } from '@/types/domain';

export interface QuestionUpsertInput {
  id?: string;
  text: string;
  type: Question['type'];
  category: Question['category'];
  options?: string[];
  likertScale?: number;
  required: boolean;
  active?: boolean;
  departmentId?: string | null;
}

function parseOptions(value: Json | null): string[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const options = value.filter((item): item is string => typeof item === 'string');
  return options.length > 0 ? options : undefined;
}

interface QuestionRow {
  id: string;
  text: string;
  type: Question['type'];
  category: Question['category'];
  options: Json | null;
  likert_scale: number | null;
  required: boolean;
  active: boolean;
  department_id: string | null;
}

function mapQuestion(row: QuestionRow): Question {
  return {
    id: row.id,
    text: row.text,
    type: row.type,
    category: row.category,
    options: parseOptions(row.options),
    likertScale: row.likert_scale ?? undefined,
    required: row.required,
    active: row.active,
    departmentId: row.department_id,
  };
}

export async function fetchQuestions(): Promise<Question[]> {
  const { data, error } = await supabase
    .from('questions')
    .select('id, text, type, category, options, likert_scale, required, active, department_id')
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return ((data ?? []) as unknown as QuestionRow[]).map(mapQuestion);
}

export async function upsertQuestion(input: QuestionUpsertInput): Promise<Question> {
  await requireAdminRole();

  const basePayload = {
    text: input.text,
    type: input.type,
    category: input.category,
    required: input.required,
    active: input.active ?? true,
    options: input.type === 'multiple_choice' ? input.options ?? [] : null,
    likert_scale: input.type === 'likert' ? input.likertScale ?? 5 : null,
    department_id: input.departmentId ?? null,
  };

  if (input.id) {
    const { data, error } = await supabase
      .from('questions')
      .update(basePayload as any)
      .eq('id', input.id)
      .select('id, text, type, category, options, likert_scale, required, active, department_id')
      .single();

    if (error) {
      throw error;
    }

    return mapQuestion(data as unknown as QuestionRow);
  }

  const { data, error } = await supabase
    .from('questions')
    .insert(basePayload as any)
    .select('id, text, type, category, options, likert_scale, required, active, department_id')
    .single();

  if (error) {
    throw error;
  }

  return mapQuestion(data as unknown as QuestionRow);
}

export async function setQuestionActive(id: string, active: boolean): Promise<void> {
  await requireAdminRole();

  const { error } = await supabase.from('questions').update({ active }).eq('id', id);

  if (error) {
    throw error;
  }
}

export async function deleteQuestion(id: string): Promise<void> {
  await requireAdminRole();

  const { error } = await supabase.from('questions').delete().eq('id', id);

  if (error) {
    throw error;
  }
}
