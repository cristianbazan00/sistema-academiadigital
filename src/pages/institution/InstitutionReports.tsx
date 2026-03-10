import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Trophy } from "lucide-react";
import { format, subWeeks, startOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ClassReport {
  id: string;
  name: string;
  studentCount: number;
  completionPct: number;
}

interface StudentRank {
  full_name: string;
  xp_total: number;
  level: number;
}

interface WeeklyCompletion {
  week: string;
  completions: number;
}

const chartConfig = {
  completionPct: { label: "Conclusão %", color: "hsl(var(--primary))" },
  completions: { label: "Conclusões", color: "hsl(var(--primary))" },
  xp_total: { label: "XP", color: "hsl(var(--primary))" },
};

const InstitutionReports = () => {
  const { user } = useAuth();
  const [classReports, setClassReports] = useState<ClassReport[]>([]);
  const [ranking, setRanking] = useState<StudentRank[]>([]);
  const [weeklyData, setWeeklyData] = useState<WeeklyCompletion[]>([]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data: instId } = await supabase.rpc("get_user_institution_id", { _user_id: user.id });
      if (!instId) return;

      const { data: classes } = await supabase.from("classes").select("id, name, trail_id").eq("institution_id", instId as string);
      if (!classes) return;

      const reports: ClassReport[] = [];
      const allStudentIds: string[] = [];
      const allLessonIds: string[] = [];

      for (const c of classes) {
        const { data: members } = await supabase.from("class_members").select("user_id").eq("class_id", c.id).eq("role", "student");
        const studentIds = members?.map((m) => m.user_id) ?? [];
        allStudentIds.push(...studentIds);
        let completionPct = 0;

        if (c.trail_id && studentIds.length > 0) {
          const { data: modules } = await supabase.from("modules").select("id").eq("trail_id", c.trail_id);
          const moduleIds = modules?.map((m) => m.id) ?? [];
          if (moduleIds.length > 0) {
            const { data: lessons } = await supabase.from("lessons").select("id").in("module_id", moduleIds);
            const totalLessons = lessons?.length ?? 0;
            if (totalLessons > 0) {
              const lessonIds = lessons!.map((l) => l.id);
              allLessonIds.push(...lessonIds);
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
        reports.push({ id: c.id, name: c.name, studentCount: studentIds.length, completionPct });
      }
      setClassReports(reports);

      // Weekly completion trend (last 8 weeks)
      if (allStudentIds.length > 0) {
        const weeks: WeeklyCompletion[] = [];
        for (let i = 7; i >= 0; i--) {
          const start = startOfWeek(subWeeks(new Date(), i), { weekStartsOn: 1 });
          const end = startOfWeek(subWeeks(new Date(), i - 1), { weekStartsOn: 1 });
          const { count } = await supabase
            .from("lesson_progress")
            .select("id", { count: "exact", head: true })
            .in("user_id", allStudentIds.slice(0, 100))
            .eq("completed", true)
            .gte("completed_at", start.toISOString())
            .lt("completed_at", end.toISOString());
          weeks.push({ week: format(start, "dd/MM", { locale: ptBR }), completions: count ?? 0 });
        }
        setWeeklyData(weeks);
      }

      // XP ranking
      const { data: profiles } = await supabase
        .from("profiles")
        .select("full_name, xp_total, level")
        .eq("institution_id", instId as string)
        .order("xp_total", { ascending: false })
        .limit(20);
      setRanking((profiles as StudentRank[]) ?? []);
    };
    load();
  }, [user]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-display font-bold">Relatórios</h1>

        {/* Completion by class - BarChart */}
        <Card>
          <CardHeader><CardTitle>Conclusão por Turma</CardTitle></CardHeader>
          <CardContent>
            {classReports.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma turma encontrada.</p>
            ) : (
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <BarChart data={classReports}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 100]} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="completionPct" fill="var(--color-completionPct)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Weekly completion trend */}
        <Card>
          <CardHeader><CardTitle>Evolução de Conclusões por Semana</CardTitle></CardHeader>
          <CardContent>
            {weeklyData.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem dados.</p>
            ) : (
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <LineChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="completions" stroke="var(--color-completions)" strokeWidth={2} dot />
                </LineChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* XP Ranking */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" /> Ranking de XP
            </CardTitle>
          </CardHeader>
          <CardContent>
            {ranking.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem dados ainda.</p>
            ) : (
              <>
                <ChartContainer config={chartConfig} className="h-[300px] w-full mb-6">
                  <BarChart data={ranking.slice(0, 10)} layout="vertical">
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
                      <TableHead>Nível</TableHead>
                      <TableHead>XP</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ranking.map((s, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-bold">{i + 1}</TableCell>
                        <TableCell>{s.full_name}</TableCell>
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

export default InstitutionReports;
