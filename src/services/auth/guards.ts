import type { Session } from '@supabase/supabase-js';
import { AppError } from '@/lib/app-errors';
import { supabase } from '@/lib/supabase';
import type { AppRole } from '@/types/domain';

export async function requireSession(): Promise<Session> {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    throw new Error('No se pudo validar la sesión actual de Supabase.');
  }

  if (!session) {
    throw new AppError('AUTH_REQUIRED', 'Debes iniciar sesión para realizar esta acción.');
  }

  return session;
}

export async function requireRole(role: AppRole): Promise<Session> {
  const session = await requireSession();

  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', session.user.id)
    .eq('role', role)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new AppError('FORBIDDEN', 'No tienes permisos para realizar esta acción.');
  }

  return session;
}

export async function requireAdminRole(): Promise<Session> {
  return requireRole('admin');
}
