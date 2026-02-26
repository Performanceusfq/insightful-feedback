import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import DepartmentsPage from "@/pages/admin/DepartmentsPage";
import ProfessorsPage from "@/pages/admin/ProfessorsPage";
import CoursesPage from "@/pages/admin/CoursesPage";
import RolesPage from "@/pages/admin/RolesPage";
import QuestionBankPage from "@/pages/admin/QuestionBankPage";
import SurveyConfigPage from "@/pages/admin/SurveyConfigPage";
import PlaceholderPage from "@/pages/placeholder/PlaceholderPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/admin" replace />} />
            <Route element={<AppLayout />}>
              {/* Admin */}
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/departamentos" element={<DepartmentsPage />} />
              <Route path="/admin/profesores" element={<ProfessorsPage />} />
              <Route path="/admin/clases" element={<CoursesPage />} />
              <Route path="/admin/roles" element={<RolesPage />} />
              <Route path="/admin/preguntas" element={<QuestionBankPage />} />
              <Route path="/admin/encuestas" element={<SurveyConfigPage />} />
              {/* Profesor */}
              <Route path="/profesor" element={<PlaceholderPage title="Dashboard del Profesor" description="Sprint 5" />} />
              <Route path="/profesor/clases" element={<PlaceholderPage title="Mis Clases" description="Sprint 3" />} />
              <Route path="/profesor/eventos" element={<PlaceholderPage title="Eventos QR" description="Sprint 3" />} />
              {/* Estudiante */}
              <Route path="/estudiante" element={<PlaceholderPage title="Inicio Estudiante" description="Sprint 4" />} />
              <Route path="/estudiante/encuestas" element={<PlaceholderPage title="Encuestas" description="Sprint 4" />} />
              {/* Coordinador */}
              <Route path="/coordinador" element={<PlaceholderPage title="Dashboard Coordinador" description="Sprint 6" />} />
              <Route path="/coordinador/analitica" element={<PlaceholderPage title="Analítica de Departamento" description="Sprint 6" />} />
              {/* Director */}
              <Route path="/director" element={<PlaceholderPage title="Dashboard Director" description="Sprint 6" />} />
              <Route path="/director/analitica" element={<PlaceholderPage title="Analítica Institucional" description="Sprint 6" />} />
              <Route path="/director/insights" element={<PlaceholderPage title="Insights IA" description="Sprint 7" />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
