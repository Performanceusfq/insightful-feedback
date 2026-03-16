import { supabase } from '@/lib/supabase';
import { Department } from '@/types/domain';

export async function getCoordinatorDepartment(coordinatorId: string): Promise<Department[]> {
    const { data, error } = await supabase
        .from('departments')
        .select('*')
        .eq('coordinator_id', coordinatorId);

    if (error) throw error;

    return data.map(dept => ({
        id: dept.id,
        name: dept.name,
        code: dept.code,
        coordinatorId: dept.coordinator_id,
    }));
}

export async function getDepartmentSummary(departmentId: string) {
    // This is a placeholder that would ideally be replaced by a Supabase RPC call.
    return {
        departmentId,
        avgScore: 0,
        totalResponses: 0,
        participationRate: 0,
        professorsCount: 0,
        coursesCount: 0,
        categoryScores: {
            pedagogia: 0,
            contenido: 0,
            evaluacion: 0,
            comunicacion: 0,
            general: 0,
        },
        monthlyScores: [],
        trend: 'stable' as const,
    };
}

export async function getProfessorRankings(departmentId: string) {
    // Placeholder for real DB fetching.
    return [];
}
