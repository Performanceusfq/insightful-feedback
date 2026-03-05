import { supabase } from '@/lib/supabase';
import type { Database } from '@/integrations/supabase/types';

export interface StudentActiveEvent {
  id: string;
  courseId: string;
  courseName: string;
  courseCode: string;
  qrCode: string;
  status: Database['public']['Enums']['event_status'];
  createdAt: string;
  expiresAt: string;
  responded: boolean;
}

export async function fetchStudentActiveEvents(): Promise<StudentActiveEvent[]> {
  const nowIso = new Date().toISOString();

  const { data: events, error: eventsError } = await supabase
    .from('class_events')
    .select('id, course_id, qr_code, status, created_at, expires_at')
    .eq('status', 'active')
    .gt('expires_at', nowIso)
    .order('created_at', { ascending: false });

  if (eventsError) {
    throw eventsError;
  }

  if (!events || events.length === 0) {
    return [];
  }

  const courseIds = [...new Set(events.map((event) => event.course_id))];
  const eventIds = events.map((event) => event.id);

  const [{ data: courses, error: coursesError }, { data: receipts, error: receiptsError }] = await Promise.all([
    supabase.from('courses').select('id, name, code').in('id', courseIds),
    supabase.from('response_receipts').select('event_id').in('event_id', eventIds),
  ]);

  if (coursesError) {
    throw coursesError;
  }

  if (receiptsError) {
    throw receiptsError;
  }

  const courseLookup = new Map((courses ?? []).map((course) => [course.id, course]));
  const respondedEventIds = new Set((receipts ?? []).map((receipt) => receipt.event_id));

  return events.map((event) => {
    const course = courseLookup.get(event.course_id);

    return {
      id: event.id,
      courseId: event.course_id,
      courseName: course?.name ?? 'Clase',
      courseCode: course?.code ?? '—',
      qrCode: event.qr_code,
      status: event.status,
      createdAt: event.created_at,
      expiresAt: event.expires_at,
      responded: respondedEventIds.has(event.id),
    };
  });
}
