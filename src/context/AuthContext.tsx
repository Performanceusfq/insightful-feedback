import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { type Session } from '@supabase/supabase-js';
import { type AppRole, type User } from '@/types/domain';
import { supabase } from '@/lib/supabase';

interface AuthContextType {
  currentUser: User | null;
  session: Session | null;
  switchRole: (role: AppRole) => void;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  signInWithMicrosoft: () => Promise<void>;
  signOut: () => Promise<void>;
  isAuthLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

function inferNameFromSession(session: Session): string {
  const metadataName = session.user.user_metadata?.name;
  if (typeof metadataName === 'string' && metadataName.trim()) {
    return metadataName;
  }

  const emailPrefix = session.user.email?.split('@')[0];
  if (emailPrefix) {
    return emailPrefix;
  }

  return 'Usuario';
}

function dedupeRoles(roles: AppRole[]): AppRole[] {
  return [...new Set(roles)];
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const sessionResolutionIdRef = useRef(0);

  useEffect(() => {
    let isMounted = true;

    const resolveSessionUser = async (nextSession: Session | null) => {
      const resolutionId = ++sessionResolutionIdRef.current;

      if (!isMounted) {
        return;
      }

      setSession(nextSession);

      if (!nextSession) {
        setCurrentUser(null);
        setIsAuthLoading(false);
        return;
      }

      // DOMAIN RESTRICTION CHECK FOR PROFESSORS
      if (nextSession.user.app_metadata?.provider === 'azure') {
        const userEmail = nextSession.user.email?.toLowerCase() || '';

        // DOMAIN RESTRICTION CHECK
        const isTestModeAllowed = import.meta.env.VITE_ALLOW_NON_ASIG_EMAILS === 'true';

        // Check if the email belongs to a professor
        const isProfessorEmail = userEmail.endsWith('@asig.usfq.edu.ec') || userEmail.endsWith('@usfq.edu.ec');

        if (!isTestModeAllowed && !isProfessorEmail) {
          console.warn(`[AuthContext] Denied access to non-professor account: ${userEmail}`);
          await supabase.auth.signOut();
          setCurrentUser(null);
          setIsAuthLoading(false);
          // In a real app we might want to redirect with an error param, 
          // but logging them out immediately prevents access.
          return;
        }
      }

      setIsAuthLoading(true);

      const [{ data: profile, error: profileError }, { data: roleRows, error: rolesError }] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, email, name, active_role, department_id')
          .eq('id', nextSession.user.id)
          .maybeSingle(),
        supabase.from('user_roles').select('role').eq('user_id', nextSession.user.id),
      ]);

      if (!isMounted || resolutionId !== sessionResolutionIdRef.current) {
        return;
      }

      if (profileError) {
        console.error('[AuthContext] profile load error:', profileError.message);
      }

      if (rolesError) {
        console.error('[AuthContext] role load error:', rolesError.message);
      }

      const fetchedRoles = (roleRows ?? []).map((row) => row.role as AppRole);
      const fallbackRole = (profile?.active_role ?? 'estudiante') as AppRole;
      const roles = dedupeRoles(fetchedRoles.length > 0 ? fetchedRoles : [fallbackRole]);

      setCurrentUser((previous) => {
        const preservedActiveRole =
          previous?.id === nextSession.user.id && roles.includes(previous.activeRole)
            ? previous.activeRole
            : undefined;

        const activeRole = preservedActiveRole ?? (roles.includes(fallbackRole) ? fallbackRole : roles[0]);

        return {
          id: nextSession.user.id,
          email: profile?.email ?? nextSession.user.email ?? '',
          name: profile?.name ?? inferNameFromSession(nextSession),
          roles,
          activeRole,
          departmentId: profile?.department_id ?? undefined,
        };
      });

      setIsAuthLoading(false);
    };

    void supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (error) {
          console.error('[AuthContext] getSession error:', error.message);
        }

        return resolveSessionUser(data.session);
      })
      .catch((error: unknown) => {
        console.error('[AuthContext] unexpected getSession error:', error);
        setIsAuthLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      void resolveSessionUser(nextSession);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const switchRole = useCallback((role: AppRole) => {
    if (!currentUser || !currentUser.roles.includes(role)) {
      return;
    }

    setCurrentUser((previous) => (previous ? { ...previous, activeRole: role } : previous));

    if (session?.user.id === currentUser.id) {
      void supabase
        .from('profiles')
        .update({ active_role: role })
        .eq('id', session.user.id)
        .then(({ error }) => {
          if (error) {
            console.error('[AuthContext] active_role update error:', error.message);
          }
        });
    }
  }, [currentUser, session]);

  const signInWithPassword = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      throw error;
    }
  }, []);

  const signInWithMicrosoft = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'azure',
      options: {
        scopes: 'email profile',
      },
    });

    if (error) {
      throw error;
    }
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('[AuthContext] signOut error:', error.message);
      throw error;
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        session,
        switchRole,
        signInWithPassword,
        signInWithMicrosoft,
        signOut,
        isAuthLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}
