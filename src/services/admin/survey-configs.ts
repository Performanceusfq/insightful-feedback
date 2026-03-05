import { supabase } from '@/lib/supabase';
import type { Course, Question, SurveyConfig } from '@/types/domain';
import { fetchQuestions } from '@/services/admin/questions';
import { requireAdminRole } from '@/services/auth/guards';

export interface SurveyConfigInput extends Omit<SurveyConfig, 'id'> {
  id?: string;
}

export interface SurveyConfigPageData {
  courses: Pick<Course, 'id' | 'name' | 'code'>[];
  questions: Question[];
  configs: SurveyConfig[];
}

function uniqIds(values: string[]): string[] {
  return [...new Set(values)];
}

async function syncConfigQuestions(surveyConfigId: string, config: SurveyConfigInput): Promise<void> {
  const fixedQuestionIds = uniqIds(config.fixedQuestionIds || []);
  const randomQuestionIds = uniqIds((config.randomPool?.questionIds || []).filter((id) => !fixedQuestionIds.includes(id)));

  const randomCount = Math.max(0, Math.min(config.randomPool?.count || 0, randomQuestionIds.length));

  const { error: updateConfigError } = await supabase
    .from('survey_configs')
    .update({ random_count: randomCount })
    .eq('id', surveyConfigId);

  if (updateConfigError) {
    throw updateConfigError;
  }

  const [{ error: deleteFixedError }, { error: deleteRandomError }] = await Promise.all([
    supabase.from('survey_fixed_questions').delete().eq('survey_config_id', surveyConfigId),
    supabase.from('survey_random_questions').delete().eq('survey_config_id', surveyConfigId),
  ]);

  if (deleteFixedError) {
    throw deleteFixedError;
  }

  if (deleteRandomError) {
    throw deleteRandomError;
  }

  if (fixedQuestionIds.length > 0) {
    const fixedRows = fixedQuestionIds.map((questionId, index) => ({
      survey_config_id: surveyConfigId,
      question_id: questionId,
      position: index + 1,
    }));

    const { error: insertFixedError } = await supabase.from('survey_fixed_questions').insert(fixedRows);

    if (insertFixedError) {
      throw insertFixedError;
    }
  }

  if (randomQuestionIds.length > 0) {
    const randomRows = randomQuestionIds.map((questionId) => ({
      survey_config_id: surveyConfigId,
      question_id: questionId,
    }));

    const { error: insertRandomError } = await supabase.from('survey_random_questions').insert(randomRows);

    if (insertRandomError) {
      throw insertRandomError;
    }
  }
}

export async function fetchSurveyConfigPageData(): Promise<SurveyConfigPageData> {
  const [questions, coursesResult, configsResult, fixedResult, randomResult] = await Promise.all([
    fetchQuestions(),
    supabase.from('courses').select('id, name, code').order('name'),
    supabase
      .from('survey_configs')
      .select('id, course_id, name, random_count, active')
      .order('created_at', { ascending: false }),
    supabase
      .from('survey_fixed_questions')
      .select('survey_config_id, question_id, position')
      .order('survey_config_id')
      .order('position'),
    supabase.from('survey_random_questions').select('survey_config_id, question_id').order('survey_config_id'),
  ]);

  if (coursesResult.error) throw coursesResult.error;
  if (configsResult.error) throw configsResult.error;
  if (fixedResult.error) throw fixedResult.error;
  if (randomResult.error) throw randomResult.error;

  const fixedByConfig = new Map<string, { question_id: string; position: number }[]>();
  for (const row of fixedResult.data ?? []) {
    const existing = fixedByConfig.get(row.survey_config_id) ?? [];
    existing.push({ question_id: row.question_id, position: row.position });
    fixedByConfig.set(row.survey_config_id, existing);
  }

  const randomByConfig = new Map<string, string[]>();
  for (const row of randomResult.data ?? []) {
    const existing = randomByConfig.get(row.survey_config_id) ?? [];
    existing.push(row.question_id);
    randomByConfig.set(row.survey_config_id, existing);
  }

  const configs: SurveyConfig[] = (configsResult.data ?? []).map((config) => {
    const fixedRows = fixedByConfig.get(config.id) ?? [];
    const fixedQuestionIds = fixedRows
      .sort((a, b) => a.position - b.position)
      .map((row) => row.question_id);

    const randomQuestionIds = randomByConfig.get(config.id) ?? [];

    return {
      id: config.id,
      courseId: config.course_id,
      name: config.name,
      fixedQuestionIds,
      randomPool: {
        questionIds: randomQuestionIds,
        count: config.random_count,
      },
      active: config.active,
    };
  });

  return {
    courses: (coursesResult.data ?? []).map((course) => ({
      id: course.id,
      name: course.name,
      code: course.code,
    })),
    questions,
    configs,
  };
}

export async function upsertSurveyConfig(config: SurveyConfigInput): Promise<SurveyConfig> {
  await requireAdminRole();

  if (config.id) {
    const { error: updateError } = await supabase
      .from('survey_configs')
      .update({
        course_id: config.courseId,
        name: config.name,
        active: config.active,
      })
      .eq('id', config.id);

    if (updateError) {
      throw updateError;
    }

    await syncConfigQuestions(config.id, config);
    return { ...config, id: config.id };
  }

  const { data, error } = await supabase
    .from('survey_configs')
    .insert({
      course_id: config.courseId,
      name: config.name,
      active: config.active,
      random_count: 0,
    })
    .select('id')
    .single();

  if (error) {
    throw error;
  }

  const insertedConfig: SurveyConfig = {
    ...config,
    id: data.id,
  };

  await syncConfigQuestions(data.id, insertedConfig);
  return insertedConfig;
}

export async function deleteSurveyConfig(id: string): Promise<void> {
  await requireAdminRole();

  const { error } = await supabase.from('survey_configs').delete().eq('id', id);

  if (error) {
    throw error;
  }
}
