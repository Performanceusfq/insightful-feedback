import type { AppRole } from '@/types/domain';

export function getDefaultRouteForRole(role: AppRole): string {
  switch (role) {
    case 'admin':
      return '/admin';
    case 'profesor':
      return '/profesor';
    case 'estudiante':
      return '/estudiante';
    case 'coordinador':
      return '/coordinador';
    case 'director':
      return '/director';
  }
}
