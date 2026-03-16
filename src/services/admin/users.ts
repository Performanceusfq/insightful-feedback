import { AppError } from '@/lib/app-errors';
import { supabase } from '@/lib/supabase';
import { requireAdminRole } from '@/services/auth/guards';
import { AppRole, User } from '@/types/domain';

export interface CreateAdminUserInput {
    name: string;
    email: string;
    password: string;
    role: AppRole;
    accessToken?: string;
}

export interface DeleteAdminUserInput {
    userId: string;
}

export async function fetchAdminUsers(): Promise<User[]> {
    const { data: userRoles, error: userRolesError } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('role', ['admin', 'coordinador', 'director']);

    if (userRolesError) {
        throw userRolesError;
    }

    if (!userRoles || userRoles.length === 0) {
        return [];
    }

    const userIds = [...new Set(userRoles.map((ur) => ur.user_id))];

    const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, email, active_role')
        .in('id', userIds);

    if (profilesError) {
        throw profilesError;
    }

    const roleMap = new Map<string, AppRole[]>();
    userRoles.forEach((ur) => {
        const roles = roleMap.get(ur.user_id) || [];
        roles.push(ur.role as AppRole);
        roleMap.set(ur.user_id, roles);
    });

    return (profiles || []).map((prof) => ({
        id: prof.id,
        name: prof.name,
        email: prof.email,
        roles: roleMap.get(prof.id) || [],
        activeRole: prof.active_role as AppRole,
    }));
}

export async function createAdminUserAccount(input: CreateAdminUserInput): Promise<User> {
    const name = input.name.trim();
    const email = input.email.trim().toLowerCase();
    const password = input.password;
    const role = input.role;

    if (!name || !email || !password || !role) {
        throw new Error('Todos los campos son requeridos.');
    }

    const {
        data: { session },
        error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.access_token) {
        throw new AppError('AUTH_REQUIRED', 'Debes iniciar sesión para realizar esta acción.');
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (!supabaseUrl) {
        throw new Error('Falta configuración de Supabase en el cliente.');
    }

    const endpoint = `${supabaseUrl}/functions/v1/admin-users-create`;

    let response: Response;
    try {
        response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
                name,
                email,
                password,
                role,
            }),
        });
    } catch {
        throw new Error('No se pudo conectar con el servicio de creación de usuarios.');
    }

    const payload = await response.json().catch(() => null) as { error?: string; message?: string } | null;
    const message = payload?.error ?? payload?.message ?? '';

    if (!response.ok) {
        if (response.status === 400) throw new Error(message || 'Datos inválidos para crear el usuario.');
        if (response.status === 401) throw new AppError('AUTH_REQUIRED', message || 'Debes iniciar sesión para realizar esta acción.');
        if (response.status === 403) throw new AppError('FORBIDDEN', message || 'No tienes permisos para realizar esta acción.');
        if (response.status === 409) throw new Error('Ya existe un usuario con ese correo.');
        throw new Error(message || 'No se pudo crear el usuario.');
    }

    const created = payload as { userId: string, id: string, name: string, email: string, roles: string[] } | null;
    if (!created) {
        throw new Error('No se recibió respuesta válida al crear el usuario.');
    }

    return {
        id: created.userId,
        name,
        email,
        roles: [role],
        activeRole: role,
    };
}

export async function deleteAdminUser(input: DeleteAdminUserInput): Promise<void> {
    if (!input.userId) {
        throw new Error('ID de usuario inválido.');
    }

    const {
        data: { session },
        error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.access_token) {
        throw new AppError('AUTH_REQUIRED', 'Debes iniciar sesión para realizar esta acción.');
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const endpoint = `${supabaseUrl}/functions/v1/admin-users-delete`;

    let response: Response;
    try {
        response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ userId: input.userId }),
        });
    } catch {
        throw new Error('No se pudo conectar con el servicio de eliminación de usuarios.');
    }

    const payload = await response.json().catch(() => null) as { error?: string } | null;
    const message = payload?.error ?? '';

    if (!response.ok) {
        if (response.status === 400) throw new Error(message || 'Datos inválidos.');
        if (response.status === 401) throw new AppError('AUTH_REQUIRED', message || 'Inicia sesión.');
        if (response.status === 403) throw new AppError('FORBIDDEN', message || 'No tienes permisos.');
        throw new Error(message || 'No se pudo eliminar el usuario.');
    }
}
