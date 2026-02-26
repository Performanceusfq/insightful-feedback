import type { ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';
import { roleLabels } from '@/data/mock-data';
import { AppRole } from '@/types/domain';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  GraduationCap,
  BookOpen,
  Settings,
  Users,
  Building2,
  LayoutDashboard,
  FileQuestion,
  QrCode,
  BarChart3,
  BrainCircuit,
  ChevronDown,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { mockUsers } from '@/data/mock-data';

const roleIconMap: Record<AppRole, ReactNode> = {
  estudiante: <GraduationCap className="h-4 w-4" />,
  profesor: <BookOpen className="h-4 w-4" />,
  admin: <Settings className="h-4 w-4" />,
  coordinador: <Users className="h-4 w-4" />,
  director: <Building2 className="h-4 w-4" />,
};

interface NavItem {
  label: string;
  to: string;
  icon: ReactNode;
}

function getNavItems(role: AppRole): NavItem[] {
  switch (role) {
    case 'admin':
      return [
        { label: 'Panel General', to: '/admin', icon: <LayoutDashboard className="h-4 w-4" /> },
        { label: 'Departamentos', to: '/admin/departamentos', icon: <Building2 className="h-4 w-4" /> },
        { label: 'Profesores', to: '/admin/profesores', icon: <Users className="h-4 w-4" /> },
        { label: 'Clases', to: '/admin/clases', icon: <BookOpen className="h-4 w-4" /> },
        { label: 'Banco de Preguntas', to: '/admin/preguntas', icon: <FileQuestion className="h-4 w-4" /> },
        { label: 'Encuestas', to: '/admin/encuestas', icon: <FileQuestion className="h-4 w-4" /> },
        { label: 'Eventos', to: '/admin/eventos', icon: <QrCode className="h-4 w-4" /> },
        { label: 'Roles', to: '/admin/roles', icon: <Settings className="h-4 w-4" /> },
      ];
    case 'profesor':
      return [
        { label: 'Mi Dashboard', to: '/profesor', icon: <LayoutDashboard className="h-4 w-4" /> },
        { label: 'Mis Clases', to: '/profesor/clases', icon: <BookOpen className="h-4 w-4" /> },
        { label: 'Eventos QR', to: '/profesor/eventos', icon: <QrCode className="h-4 w-4" /> },
      ];
    case 'estudiante':
      return [
        { label: 'Inicio', to: '/estudiante', icon: <LayoutDashboard className="h-4 w-4" /> },
        { label: 'Encuestas', to: '/estudiante/encuestas', icon: <FileQuestion className="h-4 w-4" /> },
      ];
    case 'coordinador':
      return [
        { label: 'Dashboard', to: '/coordinador', icon: <LayoutDashboard className="h-4 w-4" /> },
        { label: 'Analítica', to: '/coordinador/analitica', icon: <BarChart3 className="h-4 w-4" /> },
      ];
    case 'director':
      return [
        { label: 'Dashboard', to: '/director', icon: <LayoutDashboard className="h-4 w-4" /> },
        { label: 'Analítica', to: '/director/analitica', icon: <BarChart3 className="h-4 w-4" /> },
        { label: 'Insights IA', to: '/director/insights', icon: <BrainCircuit className="h-4 w-4" /> },
      ];
  }
}

export function AppSidebar() {
  const { currentUser, switchRole, switchUser } = useAuth();
  const navItems = getNavItems(currentUser.activeRole);

  return (
    <aside className="z-10 flex w-full flex-col border-b border-sidebar-border/80 bg-sidebar/90 px-3 py-3 text-sidebar-foreground backdrop-blur md:h-screen md:w-72 md:shrink-0 md:border-b-0 md:border-r md:px-4 md:py-5">
      {/* Logo */}
      <div className="flex items-center gap-3 rounded-2xl border border-sidebar-border/60 bg-card/70 px-3 py-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sidebar-primary shadow-[0_14px_24px_-16px_hsl(var(--sidebar-primary)/0.9)]">
          <GraduationCap className="h-5 w-5 text-sidebar-primary-foreground" />
        </div>
        <div>
          <h1 className="font-display text-base font-extrabold leading-tight tracking-tight">EvalDocente</h1>
          <p className="text-xs text-muted-foreground">Gestión del Desempeño</p>
        </div>
      </div>

      {/* Role selector */}
      <div className="mt-3 px-1">
        <DropdownMenu>
          <DropdownMenuTrigger className="flex h-11 w-full items-center gap-2 rounded-xl border border-sidebar-border/70 bg-sidebar-accent/60 px-3 text-sm font-semibold text-sidebar-accent-foreground transition-colors hover:bg-sidebar-accent">
            {roleIconMap[currentUser.activeRole]}
            <span className="flex-1 text-left">{roleLabels[currentUser.activeRole]}</span>
            <ChevronDown className="h-3 w-3 opacity-60" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            {currentUser.roles.map(role => (
              <DropdownMenuItem key={role} onClick={() => switchRole(role)}>
                {roleIconMap[role]}
                <span className="ml-2">{roleLabels[role]}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Navigation */}
      <nav className="grid flex-1 grid-cols-1 gap-1.5 px-1 py-3 sm:grid-cols-2 md:block md:space-y-1.5">
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/admin' || item.to === '/profesor' || item.to === '/estudiante' || item.to === '/coordinador' || item.to === '/director'}
            className={({ isActive }) =>
              cn(
                'flex h-11 items-center gap-3 rounded-xl px-3 text-sm transition-all',
                isActive
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground font-semibold shadow-[0_12px_30px_-18px_hsl(var(--sidebar-primary)/0.95)]'
                  : 'text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              )
            }
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* User switcher (dev only) */}
      <div className="border-t border-sidebar-border/80 px-1 pt-3">
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/80">Dev: cambiar usuario</p>
        <DropdownMenu>
          <DropdownMenuTrigger className="flex h-11 w-full items-center gap-2 rounded-xl border border-sidebar-border/70 bg-card/70 px-3 text-sm transition-colors hover:bg-sidebar-accent/60">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-primary text-xs font-bold text-sidebar-primary-foreground">
              {currentUser.name.charAt(0)}
            </div>
            <span className="flex-1 truncate text-left text-xs font-semibold">{currentUser.name}</span>
            <ChevronDown className="h-3 w-3 opacity-60" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            {mockUsers.map(user => (
              <DropdownMenuItem key={user.id} onClick={() => switchUser(user.id)}>
                <span className="mr-2 text-xs">{roleIconMap[user.activeRole]}</span>
                <span className="flex-1 truncate">{user.name}</span>
                <span className="text-xs text-muted-foreground">{roleLabels[user.activeRole]}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
