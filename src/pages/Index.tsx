import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

const roleRedirects: Record<string, string> = {
  admin_master: "/admin",
  admin_institution: "/institution",
  facilitator: "/facilitator",
  student: "/student",
};

const Index = () => {
  const { user, userRole, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }
    if (userRole) {
      navigate(roleRedirects[userRole] || "/login", { replace: true });
    }
  }, [user, userRole, loading, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
};

export default Index;
