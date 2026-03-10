import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Users, BookOpen, ClipboardList, TrendingUp, Trophy } from "lucide-react";
import { subMonths } from "date-fns";
import { DateRangeFilter } from "@/components/DateRangeFilter";

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

const FacilitatorDashboard = () => {
  const { user, profile } = useAuth();
  const [startDate, setStartDate] = useState(() => subMonths(new Date(), 3));
  const [endDate, setEndDate] = useState(() => new Date());
  const [counts, setCounts] = useState({ classes: 0, students: 0, extras: 0, completion: 0 });
  const [classCompletions, setClassCompletions] = useState<ClassCompletion[]>([]);
  const [studentRanking, setStudentRanking] = useState<StudentXp[]>([]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const startIso = startDate.toISOString();
      const endIso = endDate.toISOString();

      const { data: memberships } = await supabase
        .from("class_members")
        .select("class_id")
        .eq("user_id", user.id)
        .eq("role", "facilitator");

      if (!memberships || memberships.length === 0) {
        setCounts({ classes: 0, students: 0, extras: 0, completion: 0 });
        return;
      }
      const classIds = memberships.map((m) => m.class_id);

      const { data: classes } = await supabase
        .from("classes")
        .select("id, name, trail_id")
        .in("id", classIds);

      if (!classes) return;

      const completions: ClassCompletion[] = [];
      const allStudents: StudentXp[] = [];
      let totalStudentCount = 0;

      for (const cls of classes) {
        const { data: members } = await supabase
          .from("class_members")
          .select("user_id")
          .eq("class_id", cls.id)
          .eq("role", "student");

        const studentIds = members?.map((m) => m.user_id) ?? [];
        totalStudentCount += studentIds.length;
        if (studentIds.length === 0) {
          completions.push({ name: cls.name, completion: 0 });
          continue;
        }

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
                .eq("completed", true)
                .gte("completed_at", startIso)
                .lte("completed_at", endIso);
              completionPct = Math.round(((count ?? 0) / (totalLessons * studentIds.length)) * 100);
            }
          }
        }
        completions.push({ name: cls.name, completion: completionPct });

        const { data: profiles } = await supabase
          .from("profiles")
          .select("full_name, xp_total, level")
          .in("id", studentIds);
        if (profiles) {
          profiles.forEach((p) => allStudents.push({ ...p, className: cls.name }));
        }
      }

      // Extra activities
      const { count: extrasCount } = await supabase
        .from("extra_activities")
        .select("id", { count: "exact", head: true })
        .eq("created_by", user.id);

      const avgCompletion = completions.length > 0
        ? Math.round(completions.reduce((sum, c) => sum + c.completion, 0) / completions.length)
        : 0;

      setCounts({
        classes: classIds.length,
        students: totalStudentCount,
        extras: extrasCount ?? 0,
        completion: avgCompletion,
      });
      setClassCompletions(completions);
      setStudentRanking(allStudents.sort((a, b) => b.xp_total - a.xp_total));
    };
    load();
  }, [user, startDate, endDate]);

  const stats = [
    { label: "Minhas Turmas", value: counts.classes, icon: BookOpen, color: "text-blue-500" },
    { label: "Alunos", value: counts.students, icon: Users, color: "text-green-500" },
    { label: "Atividades Extras", value: counts.extras, icon: ClipboardList, color: "text-orange-500" },
    { label: "Conclusão Média", value: `${counts.completion}%`, icon: TrendingUp, color: "text-purple-500" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold">
              Olá, {profile?.full_name || "Facilitador"}! 👋
            </h1>
            <p className="text-muted-foreground mt-1">Acompanhe o progresso das suas turmas</p>
          </div>
          <DateRangeFilter startDate={startDate} endDate={endDate} onStartDateChange={setStartDate} onEndDateChange={setEndDate} />
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

export default FacilitatorDashboard;
