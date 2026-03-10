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
import LoginInstitution from "./pages/LoginInstitution";
import ActivateAccount from "./pages/ActivateAccount";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminInstitutions from "./pages/admin/AdminInstitutions";
import AdminTrails from "./pages/admin/AdminTrails";
import AdminTrailEditor from "./pages/admin/AdminTrailEditor";
import StudentDashboard from "./pages/student/StudentDashboard";
import StudentTrail from "./pages/student/StudentTrail";
import StudentLesson from "./pages/student/StudentLesson";
import InstitutionDashboard from "./pages/institution/InstitutionDashboard";
import InstitutionClasses from "./pages/institution/InstitutionClasses";
import InstitutionFacilitators from "./pages/institution/InstitutionFacilitators";
import InstitutionImport from "./pages/institution/InstitutionImport";
import InstitutionReports from "./pages/institution/InstitutionReports";
import FacilitatorDashboard from "./pages/facilitator/FacilitatorDashboard";
import FacilitatorClasses from "./pages/facilitator/FacilitatorClasses";
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
                path="/institution"
                element={
                  <ProtectedRoute allowedRoles={["admin_institution"]}>
                    <InstitutionDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/institution/classes"
                element={
                  <ProtectedRoute allowedRoles={["admin_institution"]}>
                    <InstitutionClasses />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/institution/facilitators"
                element={
                  <ProtectedRoute allowedRoles={["admin_institution"]}>
                    <InstitutionFacilitators />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/institution/import"
                element={
                  <ProtectedRoute allowedRoles={["admin_institution"]}>
                    <InstitutionImport />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/institution/reports"
                element={
                  <ProtectedRoute allowedRoles={["admin_institution"]}>
                    <InstitutionReports />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/facilitator"
                element={
                  <ProtectedRoute allowedRoles={["facilitator"]}>
                    <FacilitatorDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/facilitator/classes"
                element={
                  <ProtectedRoute allowedRoles={["facilitator"]}>
                    <FacilitatorClasses />
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
              <Route
                path="/student/trail"
                element={
                  <ProtectedRoute allowedRoles={["student"]}>
                    <StudentTrail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/student/lesson/:lessonId"
                element={
                  <ProtectedRoute allowedRoles={["student"]}>
                    <StudentLesson />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/student/badges"
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
