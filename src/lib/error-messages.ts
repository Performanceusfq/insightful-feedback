import { isAppError } from '@/lib/app-errors';

interface ErrorLike {
  code?: string;
  message?: string;
}

function getErrorLike(error: unknown): ErrorLike | null {
  if (!error || typeof error !== 'object') {
    return null;
  }

  return error as ErrorLike;
}

export function getUserFacingErrorMessage(error: unknown, fallbackMessage: string): string {
  if (isAppError(error)) {
    return error.message;
  }

  const errorLike = getErrorLike(error);
  const code = errorLike?.code;
  const message = errorLike?.message ?? '';

  if (code === '42501') {
    return 'No tienes permisos para realizar esta acción.';
  }

  if (message.includes('JWT') || message.includes('Auth session missing') || message.includes('Not authenticated')) {
    return 'Debes iniciar sesión para realizar esta acción.';
  }

  if (message.includes('Invalid login credentials')) {
    return 'Correo o contraseña inválidos.';
  }

  if (message.includes('Email already exists')) {
    return 'Ya existe un usuario con ese correo.';
  }

  if (message.includes('Replacement professor is required')) {
    return 'Debes seleccionar un profesor de reemplazo para continuar.';
  }

  if (message.includes('Replacement professor must be different')) {
    return 'El profesor de reemplazo debe ser diferente al profesor a eliminar.';
  }

  if (message.includes('Professor not found')) {
    return 'El profesor seleccionado no existe o ya fue eliminado.';
  }

  return fallbackMessage;
}
