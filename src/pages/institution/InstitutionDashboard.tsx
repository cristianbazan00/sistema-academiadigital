import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Users, GraduationCap, BookOpen, TrendingUp } from "lucide-react";

const InstitutionDashboard = () => {
  const { user } = useAuth();
  const [counts, setCounts] = useState({ classes: 0, students: 0, facilitators: 0, completion: "—" });

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data: instData } = await supabase.rpc("get_user_institution_id", { _user_id: user.id });
      const instId = instData as string | null;
      if (!instId) return;

      const [classesRes, membersRes] = await Promise.all([
        supabase.from("classes").select("id", { count: "exact", head: true }).eq("institution_id", instId),
        supabase.from("class_members").select("id, role, class_id, user_id").eq("role", "student"),
      ]);

      // Filter members by institution classes
      const { data: instClasses } = await supabase.from("classes").select("id").eq("institution_id", instId);
      const classIds = new Set((instClasses ?? []).map((c) => c.id));

      const allMembers = membersRes.data ?? [];
      const studentCount = allMembers.filter((m) => classIds.has(m.class_id) && m.role === "student").length;

      // Count facilitators
      const { data: facMembers } = await supabase.from("class_members").select("user_id, class_id, role").eq("role", "facilitator");
      const facCount = new Set((facMembers ?? []).filter((m) => classIds.has(m.class_id)).map((m) => m.user_id)).size;

      setCounts({
        classes: classesRes.count ?? 0,
        students: studentCount,
        facilitators: facCount,
        completion: "—",
      });
    };
    load();
  }, [user]);

  const stats = [
    { label: "Turmas", value: counts.classes, icon: BookOpen, color: "text-blue-500" },
    { label: "Alunos", value: counts.students, icon: GraduationCap, color: "text-green-500" },
    { label: "Facilitadores", value: counts.facilitators, icon: Users, color: "text-orange-500" },
    { label: "Conclusão Média", value: counts.completion, icon: TrendingUp, color: "text-purple-500" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-display font-bold">Dashboard da Instituição</h1>
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

export default InstitutionDashboard;
