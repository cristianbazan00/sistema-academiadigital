import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Users, BookOpen, ClipboardList, TrendingUp } from "lucide-react";

const FacilitatorDashboard = () => {
  const { user, profile } = useAuth();
  const [counts, setCounts] = useState({ classes: 0, students: 0, extras: 0 });

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      // Get classes where facilitator is a member
      const { data: memberships } = await supabase
        .from("class_members")
        .select("class_id")
        .eq("user_id", user.id)
        .eq("role", "facilitator");

      const classIds = (memberships ?? []).map((m) => m.class_id);

      let studentCount = 0;
      if (classIds.length > 0) {
        const { data: studentMembers } = await supabase
          .from("class_members")
          .select("user_id")
          .in("class_id", classIds)
          .eq("role", "student");
        const uniqueStudents = new Set((studentMembers ?? []).map((s) => s.user_id));
        studentCount = uniqueStudents.size;
      }

      // Extra activities created by this facilitator
      const { count: extrasCount } = await supabase
        .from("extra_activities")
        .select("id", { count: "exact", head: true })
        .eq("created_by", user.id);

      setCounts({
        classes: classIds.length,
        students: studentCount,
        extras: extrasCount ?? 0,
      });
    };
    load();
  }, [user]);

  const stats = [
    { label: "Minhas Turmas", value: counts.classes, icon: BookOpen, color: "text-blue-500" },
    { label: "Alunos", value: counts.students, icon: Users, color: "text-green-500" },
    { label: "Atividades Extras", value: counts.extras, icon: ClipboardList, color: "text-orange-500" },
    { label: "Conclusão Média", value: "—", icon: TrendingUp, color: "text-purple-500" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold">
            Olá, {profile?.full_name || "Facilitador"}! 👋
          </h1>
          <p className="text-muted-foreground mt-1">Acompanhe o progresso das suas turmas</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <Card key={s.label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default FacilitatorDashboard;
