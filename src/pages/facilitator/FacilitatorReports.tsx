import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Trophy } from "lucide-react";

interface ClassCompletion {
  name: string;
  completion: number;
}

interface StudentXp {
  full_name: string;
  xp_total: number;
  level: number;
  className: string;
}

const chartConfig = {
  completion: { label: "Conclusão %", color: "hsl(var(--primary))" },
  xp_total: { label: "XP", color: "hsl(var(--primary))" },
};

const FacilitatorReports = () => {
  const { user } = useAuth();
  const [classCompletions, setClassCompletions] = useState<ClassCompletion[]>([]);
  const [studentRanking, setStudentRanking] = useState<StudentXp[]>([]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      // Get facilitator's classes
      const { data: memberships } = await supabase
        .from("class_members")
        .select("class_id")
        .eq("user_id", user.id)
        .eq("role", "facilitator");

      if (!memberships || memberships.length === 0) return;
      const classIds = memberships.map((m) => m.class_id);

      const { data: classes } = await supabase
        .from("classes")
        .select("id, name, trail_id")
        .in("id", classIds);

      if (!classes) return;

      const completions: ClassCompletion[] = [];
      const allStudents: StudentXp[] = [];

      for (const cls of classes) {
        const { data: members } = await supabase
          .from("class_members")
          .select("user_id")
          .eq("class_id", cls.id)
          .eq("role", "student");

        const studentIds = members?.map((m) => m.user_id) ?? [];
        if (studentIds.length === 0) {
          completions.push({ name: cls.name, completion: 0 });
          continue;
        }

        // Completion
        let completionPct = 0;
        if (cls.trail_id) {
          const { data: modules } = await supabase.from("modules").select("id").eq("trail_id", cls.trail_id);
          const moduleIds = modules?.map((m) => m.id) ?? [];
          if (moduleIds.length > 0) {
            const { data: lessons } = await supabase.from("lessons").select("id").in("module_id", moduleIds);
            const totalLessons = lessons?.length ?? 0;
            if (totalLessons > 0) {
              const lessonIds = lessons!.map((l) => l.id);
              const { count } = await supabase
                .from("lesson_progress")
                .select("id", { count: "exact", head: true })
                .in("user_id", studentIds)
                .in("lesson_id", lessonIds)
                .eq("completed", true);
              completionPct = Math.round(((count ?? 0) / (totalLessons * studentIds.length)) * 100);
            }
          }
        }
        completions.push({ name: cls.name, completion: completionPct });

        // Student XP
        const { data: profiles } = await supabase
          .from("profiles")
          .select("full_name, xp_total, level")
          .in("id", studentIds);
        if (profiles) {
          profiles.forEach((p) =>
            allStudents.push({ ...p, className: cls.name })
          );
        }
      }

      setClassCompletions(completions);
      setStudentRanking(allStudents.sort((a, b) => b.xp_total - a.xp_total));
    };
    load();
  }, [user]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-display font-bold">Relatórios</h1>

        <Card>
          <CardHeader><CardTitle>Conclusão por Turma</CardTitle></CardHeader>
          <CardContent>
            {classCompletions.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma turma encontrada.</p>
            ) : (
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <BarChart data={classCompletions}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 100]} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="completion" fill="var(--color-completion)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" /> Ranking de Alunos por XP
            </CardTitle>
          </CardHeader>
          <CardContent>
            {studentRanking.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem dados.</p>
            ) : (
              <>
                <ChartContainer config={chartConfig} className="h-[300px] w-full mb-6">
                  <BarChart data={studentRanking.slice(0, 10)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="full_name" type="category" width={120} tick={{ fontSize: 12 }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="xp_total" fill="var(--color-xp_total)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ChartContainer>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Turma</TableHead>
                      <TableHead>Nível</TableHead>
                      <TableHead>XP</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {studentRanking.map((s, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-bold">{i + 1}</TableCell>
                        <TableCell>{s.full_name}</TableCell>
                        <TableCell>{s.className}</TableCell>
                        <TableCell>{s.level}</TableCell>
                        <TableCell className="font-mono">{s.xp_total}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default FacilitatorReports;
