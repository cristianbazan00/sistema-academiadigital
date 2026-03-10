import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, TrendingUp, BookOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const AdminDashboard = () => {
  const [counts, setCounts] = useState({ institutions: 0, students: 0, trails: 0, completion: "—" });

  useEffect(() => {
    const load = async () => {
      const [instRes, studRes, trailRes] = await Promise.all([
        supabase.from("institutions").select("id", { count: "exact", head: true }),
        supabase.from("user_roles").select("id", { count: "exact", head: true }).eq("role", "student"),
        supabase.from("trails").select("id", { count: "exact", head: true }),
      ]);
      setCounts({
        institutions: instRes.count ?? 0,
        students: studRes.count ?? 0,
        trails: trailRes.count ?? 0,
        completion: "—",
      });
    };
    load();
  }, []);

  const stats = [
    { label: "Instituições", value: String(counts.institutions), icon: Building2, color: "text-primary" },
    { label: "Alunos Ativos", value: String(counts.students), icon: Users, color: "text-success" },
    { label: "Taxa de Conclusão", value: counts.completion, icon: TrendingUp, color: "text-warning" },
    { label: "Trilhas Criadas", value: String(counts.trails), icon: BookOpen, color: "text-accent" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold">Painel Admin Master</h1>
          <p className="text-muted-foreground mt-1">Visão global da plataforma</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <Card key={s.label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-display font-bold">{s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Atividade Recente</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">Nenhuma atividade registada ainda. Comece criando uma instituição e uma trilha de ensino.</p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
