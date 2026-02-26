import { createContext, useContext, useState, ReactNode } from 'react';
import { User, AppRole } from '@/types/domain';
import { mockUsers } from '@/data/mock-data';

interface AuthContextType {
  currentUser: User;
  setCurrentUser: (user: User) => void;
  switchRole: (role: AppRole) => void;
  switchUser: (userId: string) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User>(mockUsers[0]);

  const switchRole = (role: AppRole) => {
    if (currentUser.roles.includes(role)) {
      setCurrentUser({ ...currentUser, activeRole: role });
    }
  };

  const switchUser = (userId: string) => {
    const user = mockUsers.find(u => u.id === userId);
    if (user) setCurrentUser(user);
  };

  return (
    <AuthContext.Provider value={{ currentUser, setCurrentUser, switchRole, switchUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
