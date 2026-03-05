import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { getDefaultRouteForRole } from '@/lib/role-routing';
import type { AppRole } from '@/types/domain';

interface RoleGuardProps {
  allowedRoles: AppRole[];
  children: ReactNode;
}

export function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const { currentUser, isAuthLoading, switchRole } = useAuth();

  const matchedRole = currentUser
    ? allowedRoles.find((role) => currentUser.roles.includes(role)) ?? null
    : null;

  useEffect(() => {
    if (!currentUser || !matchedRole) {
      return;
    }

    if (currentUser.activeRole !== matchedRole) {
      switchRole(matchedRole);
    }
  }, [currentUser, matchedRole, switchRole]);

  if (isAuthLoading) {
    return (
      <div className="py-10 text-center text-sm text-muted-foreground">
        Validando permisos...
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/auth/login" replace />;
  }

  if (!matchedRole) {
    return <Navigate to={getDefaultRouteForRole(currentUser.activeRole)} replace />;
  }

  if (currentUser.activeRole !== matchedRole) {
    return (
      <div className="py-10 text-center text-sm text-muted-foreground">
        Ajustando rol activo...
      </div>
    );
  }

  return <>{children}</>;
}
