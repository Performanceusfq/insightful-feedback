import { supabase } from '@/lib/supabase';
import type { Database } from '@/integrations/supabase/types';

export interface ProfessorCourse {
  id: string;
  name: string;
  code: string;
}

export interface ProfessorEvent {
  id: string;
  courseId: string;
  qrCode: string;
  status: Database['public']['Enums']['event_status'];
  createdAt: string;
  expiresAt: string;
  responsesCount: number;
}

export interface ProfessorEventsPayload {
  courses: ProfessorCourse[];
  events: ProfessorEvent[];
}

export async function fetchProfessorEvents(userId: string): Promise<ProfessorEventsPayload> {
  const { data: professorRows, error: professorError } = await supabase
    .from('professors')
    .select('id')
    .eq('user_id', userId);

  if (professorError) {
    throw professorError;
  }

  if (!professorRows || professorRows.length === 0) {
    return { courses: [], events: [] };
  }

  const professorIds = professorRows.map((professor) => professor.id);

  const { data: courses, error: coursesError } = await supabase
    .from('courses')
    .select('id, name, code')
    .in('professor_id', professorIds)
    .order('name');

  if (coursesError) {
    throw coursesError;
  }

  if (!courses || courses.length === 0) {
    return { courses: [], events: [] };
  }

  const courseIds = courses.map((course) => course.id);

  const { data: events, error: eventsError } = await supabase
    .from('class_events')
    .select('id, course_id, qr_code, status, created_at, expires_at')
    .in('course_id', courseIds)
    .order('created_at', { ascending: false });

  if (eventsError) {
    throw eventsError;
  }

  if (!events || events.length === 0) {
    return { courses, events: [] };
  }

  const eventIds = events.map((event) => event.id);
  const { data: receipts, error: receiptsError } = await supabase
    .from('response_receipts')
    .select('event_id')
    .in('event_id', eventIds);

  if (receiptsError) {
    throw receiptsError;
  }

  const receiptCountByEvent = new Map<string, number>();

  for (const receipt of receipts ?? []) {
    const currentCount = receiptCountByEvent.get(receipt.event_id) ?? 0;
    receiptCountByEvent.set(receipt.event_id, currentCount + 1);
  }

  return {
    courses,
    events: events.map((event) => ({
      id: event.id,
      courseId: event.course_id,
      qrCode: event.qr_code,
      status: event.status,
      createdAt: event.created_at,
      expiresAt: event.expires_at,
      responsesCount: receiptCountByEvent.get(event.id) ?? 0,
    })),
  };
}

export async function generateProfessorEvent(courseId: string) {
  const { data, error } = await supabase.rpc('generate_class_event', {
    p_course_id: courseId,
  });

  if (error) {
    throw error;
  }

  return data?.[0] ?? null;
}
