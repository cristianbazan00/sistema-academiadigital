import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import ActivateAccount from "./pages/ActivateAccount";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminInstitutions from "./pages/admin/AdminInstitutions";
import AdminTrails from "./pages/admin/AdminTrails";
import AdminTrailEditor from "./pages/admin/AdminTrailEditor";
import StudentDashboard from "./pages/student/StudentDashboard";
import InstitutionDashboard from "./pages/institution/InstitutionDashboard";
import InstitutionClasses from "./pages/institution/InstitutionClasses";
import InstitutionFacilitators from "./pages/institution/InstitutionFacilitators";
import InstitutionImport from "./pages/institution/InstitutionImport";
import InstitutionReports from "./pages/institution/InstitutionReports";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/activate" element={<ActivateAccount />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={["admin_master"]}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/institutions"
                element={
                  <ProtectedRoute allowedRoles={["admin_master"]}>
                    <AdminInstitutions />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/trails"
                element={
                  <ProtectedRoute allowedRoles={["admin_master"]}>
                    <AdminTrails />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/trails/:id"
                element={
                  <ProtectedRoute allowedRoles={["admin_master"]}>
                    <AdminTrailEditor />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/student"
                element={
                  <ProtectedRoute allowedRoles={["student"]}>
                    <StudentDashboard />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
