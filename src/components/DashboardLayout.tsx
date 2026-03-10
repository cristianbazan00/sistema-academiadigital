import { ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { LogOut, LayoutDashboard, Users, BookOpen, GraduationCap, BarChart3 } from "lucide-react";
import { NotificationsPopover } from "@/components/NotificationsPopover";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";

const roleLabels: Record<string, string> = {
  admin_master: "Admin Master",
  admin_institution: "Admin Instituição",
  facilitator: "Facilitador",
  student: "Aluno",
};

const navByRole: Record<string, { to: string; label: string; icon: ReactNode }[]> = {
  admin_master: [
    { to: "/admin", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
    { to: "/admin/institutions", label: "Instituições", icon: <Users className="h-4 w-4" /> },
    { to: "/admin/trails", label: "Trilhas", icon: <BookOpen className="h-4 w-4" /> },
    
  ],
  admin_institution: [
    { to: "/institution", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
    { to: "/institution/classes", label: "Turmas", icon: <Users className="h-4 w-4" /> },
    { to: "/institution/facilitators", label: "Facilitadores", icon: <Users className="h-4 w-4" /> },
    { to: "/institution/import", label: "Importar Alunos", icon: <GraduationCap className="h-4 w-4" /> },
    { to: "/institution/reports", label: "Relatórios", icon: <BookOpen className="h-4 w-4" /> },
  ],
  facilitator: [
    { to: "/facilitator", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
    { to: "/facilitator/classes", label: "Minhas Turmas", icon: <Users className="h-4 w-4" /> },
    { to: "/facilitator/reports", label: "Relatórios", icon: <BarChart3 className="h-4 w-4" /> },
  ],
  student: [
    { to: "/student", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
    { to: "/student/trail", label: "Minha Trilha", icon: <GraduationCap className="h-4 w-4" /> },
    { to: "/student/badges", label: "Conquistas", icon: <BookOpen className="h-4 w-4" /> },
    { to: "/student/reports", label: "Relatórios", icon: <BarChart3 className="h-4 w-4" /> },
  ],
};

export function DashboardLayout({ children }: { children: ReactNode }) {
  const { userRole, profile, signOut } = useAuth();
  const links = navByRole[userRole ?? "student"] ?? [];

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-border bg-card p-4 gap-2">
        <div className="flex items-center gap-2 mb-6 px-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <GraduationCap className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-lg">Empregabilidade</span>
        </div>

        <nav className="flex-1 space-y-1">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )
              }
            >
              {link.icon}
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-border pt-4 mt-auto">
          <p className="text-xs text-muted-foreground px-2 truncate">{profile?.full_name || "Utilizador"}</p>
          <p className="text-xs font-medium text-primary px-2">{roleLabels[userRole ?? ""]}</p>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col">
        <header className="flex items-center justify-between border-b border-border bg-card px-6 py-3">
          <h2 className="font-display font-semibold text-lg">{roleLabels[userRole ?? ""]}</h2>
          <div className="flex items-center gap-2">
            <NotificationsPopover />
            <ThemeToggle />
            <Button variant="ghost" size="icon" onClick={signOut}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-auto animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}
