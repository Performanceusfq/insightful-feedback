import { supabase } from '@/lib/supabase';
import { requireAdminRole } from '@/services/auth/guards';

export interface AdminDashboardStats {
    departmentsCount: number;
    professorsCount: number;
    coursesCount: number;
    adminUsersCount: number;
}

export async function fetchAdminDashboardStats(): Promise<AdminDashboardStats> {
    await requireAdminRole();

    const [
        { count: departmentsCount },
        { count: professorsCount },
        { count: coursesCount },
        { data: adminRoles }
    ] = await Promise.all([
        supabase.from('departments').select('id', { count: 'exact', head: true }),
        supabase.from('professors').select('id', { count: 'exact', head: true }),
        supabase.from('courses').select('id', { count: 'exact', head: true }),
        supabase.from('user_roles').select('user_id').in('role', ['admin', 'coordinador', 'director'])
    ]);

    // Contamos usuarios únicos con roles administrativos
    const uniqueAdminUsers = new Set((adminRoles || []).map(r => r.user_id));

    return {
        departmentsCount: departmentsCount || 0,
        professorsCount: professorsCount || 0,
        coursesCount: coursesCount || 0,
        adminUsersCount: uniqueAdminUsers.size,
    };
}
