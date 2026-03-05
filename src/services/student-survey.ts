import { supabase } from '@/lib/supabase';
import type { Json } from '@/integrations/supabase/types';

export type SurveyLookupStatus = 'invalid_qr' | 'expired' | 'already_submitted' | 'not_enrolled' | 'ok';
export type SubmitSurveyStatus = 'invalid_qr' | 'expired' | 'already_submitted' | 'ok';

export interface SurveyQuestion {
  id: string;
  text: string;
  type: 'likert' | 'open' | 'multiple_choice';
  required: boolean;
  likertScale: number | null;
  options: string[] | null;
  position: number;
}

export interface SurveyByQrResult {
  status: SurveyLookupStatus;
  eventId: string | null;
  courseName: string | null;
  surveyName: string | null;
  expiresAt: string | null;
  questions: SurveyQuestion[];
}

export interface SubmitSurveyResult {
  status: SubmitSurveyStatus;
  responseId: string | null;
  submittedAt: string | null;
}

function parseSurveyQuestion(json: Json): SurveyQuestion | null {
  if (!json || typeof json !== 'object' || Array.isArray(json)) {
    return null;
  }

  const record = json as Record<string, Json | undefined>;
  const id = record.id;
  const text = record.text;
  const type = record.type;
  const required = record.required;
  const likertScale = record.likert_scale;
  const options = record.options;
  const position = record.position;

  if (typeof id !== 'string' || typeof text !== 'string') {
    return null;
  }

  if (type !== 'likert' && type !== 'open' && type !== 'multiple_choice') {
    return null;
  }

  const parsedOptions = Array.isArray(options) && options.every((option) => typeof option === 'string')
    ? options
    : null;

  return {
    id,
    text,
    type,
    required: typeof required === 'boolean' ? required : true,
    likertScale: typeof likertScale === 'number' ? likertScale : null,
    options: parsedOptions,
    position: typeof position === 'number' ? position : Number.MAX_SAFE_INTEGER,
  };
}

function normalizeLookupStatus(status: string | null | undefined): SurveyLookupStatus {
  if (status === 'ok' || status === 'expired' || status === 'already_submitted' || status === 'not_enrolled') {
    return status;
  }

  return 'invalid_qr';
}

function normalizeSubmitStatus(status: string | null | undefined): SubmitSurveyStatus {
  if (status === 'ok' || status === 'expired' || status === 'already_submitted') {
    return status;
  }

  return 'invalid_qr';
}

export function mapLookupStatusToFlowState(status: SurveyLookupStatus): 'invalid' | 'expired' | 'already_done' | 'intro' {
  if (status === 'ok') return 'intro';
  if (status === 'expired') return 'expired';
  if (status === 'already_submitted') return 'already_done';
  return 'invalid';
}

export function mapSubmitStatusToFlowState(status: SubmitSurveyStatus): 'invalid' | 'expired' | 'already_done' | 'success' {
  if (status === 'ok') return 'success';
  if (status === 'expired') return 'expired';
  if (status === 'already_submitted') return 'already_done';
  return 'invalid';
}

export async function fetchSurveyByQr(qrCode: string): Promise<SurveyByQrResult> {
  const { data, error } = await supabase.rpc('get_event_survey_by_qr', {
    p_qr_code: qrCode,
  });

  if (error) {
    throw error;
  }

  const row = data?.[0];
  if (!row) {
    return {
      status: 'invalid_qr',
      eventId: null,
      courseName: null,
      surveyName: null,
      expiresAt: null,
      questions: [],
    };
  }

  const parsedQuestions = Array.isArray(row.questions)
    ? row.questions
        .map((question) => parseSurveyQuestion(question as Json))
        .filter((question): question is SurveyQuestion => question !== null)
        .sort((a, b) => a.position - b.position)
    : [];

  return {
    status: normalizeLookupStatus(row.status),
    eventId: row.event_id,
    courseName: row.course_name,
    surveyName: row.survey_name,
    expiresAt: row.expires_at,
    questions: parsedQuestions,
  };
}

export async function submitSurveyResponse(
  qrCode: string,
  answers: Record<string, string>,
): Promise<SubmitSurveyResult> {
  const { data, error } = await supabase.rpc('submit_event_response', {
    p_qr_code: qrCode,
    p_answers: answers,
  });

  if (error) {
    throw error;
  }

  const row = data?.[0];

  if (!row) {
    return {
      status: 'invalid_qr',
      responseId: null,
      submittedAt: null,
    };
  }

  return {
    status: normalizeSubmitStatus(row.status),
    responseId: row.response_id,
    submittedAt: row.submitted_at,
  };
}
