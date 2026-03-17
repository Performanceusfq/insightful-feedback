import { supabase } from '@/lib/supabase';
import type { Course, ClassEvent } from '@/types/domain';

export async function getMyCourses(userId: string): Promise<Course[]> {
    // Step 1: Resolve professors.id from the auth user_id
    const { data: prof, error: profError } = await supabase
        .from('professors')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

    if (profError) throw profError;
    if (!prof) return [];

    // Step 2: Query courses using the resolved professors.id
    const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('professor_id', prof.id)
        .order('name');

    if (error) throw error;

    return (data ?? []).map(course => ({
        id: course.id,
        name: course.name,
        code: course.code,
        departmentId: course.department_id,
        professorId: course.professor_id,
        semester: course.semester,
    }));
}

export async function getCourseEvents(courseIds: string[]): Promise<ClassEvent[]> {
    if (!courseIds.length) return [];

    const { data, error } = await supabase
        .from('class_events')
        .select(`
      id,
      event_config_id,
      course_id,
      survey_config_id,
      qr_code,
      status,
      created_at,
      expires_at,
      responses (id)
    `)
        .in('course_id', courseIds);

    if (error) throw error;

    return data.map((event: any) => ({
        id: event.id,
        configId: event.event_config_id,
        courseId: event.course_id,
        qrCode: event.qr_code,
        status: event.status,
        createdAt: event.created_at,
        expiresAt: event.expires_at,
        responsesCount: event.responses[0]?.count || event.responses.length || 0,
    }));
}

// In a real app we would have a SQL view or RPC for aggregations.
// For now, let's fetch raw responses and aggregate them client side, or return empty mock structures if none exist.
export async function getAggregatedResponses(courseIds: string[]) {
    // This is a placeholder that would ideally be replaced by a Supabase RPC call.
    // For this migration phase, we will return an empty array until the RPC is built.
    return [];
}

export async function getTrends(courseIds: string[]) {
    // This is a placeholder that would ideally be replaced by a Supabase RPC call.
    return [];
}

export async function getCategoryScores(courseIds: string[]) {
    // This is a placeholder that would ideally be replaced by a Supabase RPC call.
    return [];
}
