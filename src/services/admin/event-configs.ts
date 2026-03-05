import { supabase } from '@/lib/supabase';
import { requireAdminRole } from '@/services/auth/guards';
import type { ClassEventConfig, Course, EventFrequency } from '@/types/domain';

export interface SurveyConfigOption {
  id: string;
  name: string;
  courseId: string;
}

export interface EventConfigPageData {
  courses: Pick<Course, 'id' | 'name' | 'code'>[];
  surveys: SurveyConfigOption[];
  configs: ClassEventConfig[];
}

export interface EventConfigUpsertInput {
  id?: string;
  courseId: string;
  surveyConfigId: string;
  frequency: EventFrequency;
  expirationMinutes: number;
  scheduledDays: number[];
  scheduledTime: string;
  active: boolean;
}

function normalizeTime(value: string): string {
  if (!value) {
    return '00:00';
  }

  return value.slice(0, 5);
}

export async function fetchEventConfigPageData(): Promise<EventConfigPageData> {
  const [coursesResult, surveysResult, configsResult] = await Promise.all([
    supabase.from('courses').select('id, name, code').order('name'),
    supabase.from('survey_configs').select('id, name, course_id').order('name'),
    supabase
      .from('event_configs')
      .select('id, course_id, survey_config_id, frequency, expiration_minutes, scheduled_days, scheduled_time, active')
      .order('updated_at', { ascending: false }),
  ]);

  if (coursesResult.error) throw coursesResult.error;
  if (surveysResult.error) throw surveysResult.error;
  if (configsResult.error) throw configsResult.error;

  return {
    courses: (coursesResult.data ?? []).map((course) => ({ id: course.id, name: course.name, code: course.code })),
    surveys: (surveysResult.data ?? []).map((survey) => ({
      id: survey.id,
      name: survey.name,
      courseId: survey.course_id,
    })),
    configs: (configsResult.data ?? []).map((config) => ({
      id: config.id,
      courseId: config.course_id,
      surveyConfigId: config.survey_config_id,
      frequency: config.frequency,
      expirationMinutes: config.expiration_minutes,
      scheduledDays: config.scheduled_days,
      scheduledTime: normalizeTime(config.scheduled_time),
      active: config.active,
    })),
  };
}

export async function upsertEventConfig(input: EventConfigUpsertInput): Promise<void> {
  await requireAdminRole();

  const payload = {
    course_id: input.courseId,
    survey_config_id: input.surveyConfigId,
    frequency: input.frequency,
    expiration_minutes: Math.max(1, Math.min(input.expirationMinutes, 240)),
    scheduled_days: [...new Set(input.scheduledDays)].sort((a, b) => a - b),
    scheduled_time: normalizeTime(input.scheduledTime),
    active: input.active,
  };

  if (input.id) {
    const { error } = await supabase.from('event_configs').update(payload).eq('id', input.id);
    if (error) throw error;
    return;
  }

  const { error } = await supabase.from('event_configs').insert(payload);
  if (error) throw error;
}
