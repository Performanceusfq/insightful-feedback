import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { getDefaultRouteForRole } from '@/lib/role-routing';
import LoginPage from '@/pages/auth/LoginPage';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import DepartmentsPage from '@/pages/admin/DepartmentsPage';
import ProfessorsPage from '@/pages/admin/ProfessorsPage';
import CoursesPage from '@/pages/admin/CoursesPage';
import RolesPage from '@/pages/admin/RolesPage';
import QuestionBankPage from '@/pages/admin/QuestionBankPage';
import SurveyConfigPage from '@/pages/admin/SurveyConfigPage';
import EventConfigPage from '@/pages/admin/EventConfigPage';
import EventosQRPage from '@/pages/profesor/EventosQRPage';
import ProfesorDashboard from '@/pages/profesor/ProfesorDashboard';
import EstudianteDashboard from '@/pages/estudiante/EstudianteDashboard';
import SurveyResponsePage from '@/pages/estudiante/SurveyResponsePage';
import CoordinadorDashboard from '@/pages/coordinador/CoordinadorDashboard';
import CoordinadorAnaliticaPage from '@/pages/coordinador/CoordinadorAnaliticaPage';
import DirectorDashboard from '@/pages/director/DirectorDashboard';
import DirectorAnaliticaPage from '@/pages/director/DirectorAnaliticaPage';
import DirectorInsightsPage from '@/pages/director/DirectorInsightsPage';
import PlaceholderPage from '@/pages/placeholder/PlaceholderPage';
import NotFound from './pages/NotFound';

const queryClient = new QueryClient();

function DefaultRedirect() {
  const { currentUser, session, isAuthLoading } = useAuth();

  if (isAuthLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Cargando sesión...
      </div>
    );
  }

  if (!session || !currentUser) {
    return <Navigate to="/auth/login" replace />;
  }

  return <Navigate to={getDefaultRouteForRole(currentUser.activeRole)} replace />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<DefaultRedirect />} />
            <Route path="/auth/login" element={<LoginPage />} />
            <Route
              element={(
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              )}
            >
              <Route path="/admin" element={<RoleGuard allowedRoles={['admin']}><AdminDashboard /></RoleGuard>} />
              <Route path="/admin/departamentos" element={<RoleGuard allowedRoles={['admin']}><DepartmentsPage /></RoleGuard>} />
              <Route path="/admin/profesores" element={<RoleGuard allowedRoles={['admin']}><ProfessorsPage /></RoleGuard>} />
              <Route path="/admin/clases" element={<RoleGuard allowedRoles={['admin']}><CoursesPage /></RoleGuard>} />
              <Route path="/admin/roles" element={<RoleGuard allowedRoles={['admin']}><RolesPage /></RoleGuard>} />
              <Route path="/admin/preguntas" element={<RoleGuard allowedRoles={['admin']}><QuestionBankPage /></RoleGuard>} />
              <Route path="/admin/encuestas" element={<RoleGuard allowedRoles={['admin']}><SurveyConfigPage /></RoleGuard>} />
              <Route path="/admin/eventos" element={<RoleGuard allowedRoles={['admin']}><EventConfigPage /></RoleGuard>} />

              <Route path="/profesor" element={<RoleGuard allowedRoles={['profesor']}><ProfesorDashboard /></RoleGuard>} />
              <Route path="/profesor/clases" element={<RoleGuard allowedRoles={['profesor']}><PlaceholderPage title="Mis Clases" description="Sprint 3" /></RoleGuard>} />
              <Route path="/profesor/eventos" element={<RoleGuard allowedRoles={['profesor']}><EventosQRPage /></RoleGuard>} />

              <Route path="/estudiante" element={<RoleGuard allowedRoles={['estudiante']}><EstudianteDashboard /></RoleGuard>} />
              <Route path="/estudiante/encuesta/:token" element={<RoleGuard allowedRoles={['estudiante']}><SurveyResponsePage /></RoleGuard>} />
              <Route path="/estudiante/encuestas" element={<RoleGuard allowedRoles={['estudiante']}><EstudianteDashboard /></RoleGuard>} />

              <Route path="/coordinador" element={<RoleGuard allowedRoles={['coordinador']}><CoordinadorDashboard /></RoleGuard>} />
              <Route path="/coordinador/analitica" element={<RoleGuard allowedRoles={['coordinador']}><CoordinadorAnaliticaPage /></RoleGuard>} />

              <Route path="/director" element={<RoleGuard allowedRoles={['director']}><DirectorDashboard /></RoleGuard>} />
              <Route path="/director/analitica" element={<RoleGuard allowedRoles={['director']}><DirectorAnaliticaPage /></RoleGuard>} />
              <Route path="/director/insights" element={<RoleGuard allowedRoles={['director']}><DirectorInsightsPage /></RoleGuard>} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
