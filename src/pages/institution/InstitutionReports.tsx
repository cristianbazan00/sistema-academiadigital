import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Trophy } from "lucide-react";
import { format, subMonths, subWeeks, startOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DateRangeFilter } from "@/components/DateRangeFilter";

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
  const [startDate, setStartDate] = useState(() => subMonths(new Date(), 2));
  const [endDate, setEndDate] = useState(() => new Date());
  const [classReports, setClassReports] = useState<ClassReport[]>([]);
  const [ranking, setRanking] = useState<StudentRank[]>([]);
  const [weeklyData, setWeeklyData] = useState<WeeklyCompletion[]>([]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const startIso = startDate.toISOString();
      const endIso = endDate.toISOString();

      const { data: instId } = await supabase.rpc("get_user_institution_id", { _user_id: user.id });
      if (!instId) return;

      const { data: classes } = await supabase.from("classes").select("id, name, trail_id").eq("institution_id", instId as string);
      if (!classes) return;

      const reports: ClassReport[] = [];
      const allStudentIds: string[] = [];

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
        reports.push({ id: c.id, name: c.name, studentCount: studentIds.length, completionPct });
      }
      setClassReports(reports);

      // Weekly completion trend within range
      if (allStudentIds.length > 0) {
        const weekCount = Math.ceil((endDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
        const weeksToShow = Math.min(weekCount, 12);
        const weeks: WeeklyCompletion[] = [];
        for (let i = weeksToShow - 1; i >= 0; i--) {
          const wStart = startOfWeek(subWeeks(endDate, i), { weekStartsOn: 1 });
          const wEnd = startOfWeek(subWeeks(endDate, i - 1), { weekStartsOn: 1 });
          if (wStart < startDate) continue;
          const { count } = await supabase
            .from("lesson_progress")
            .select("id", { count: "exact", head: true })
            .in("user_id", allStudentIds.slice(0, 100))
            .eq("completed", true)
            .gte("completed_at", wStart.toISOString())
            .lt("completed_at", wEnd.toISOString());
          weeks.push({ week: format(wStart, "dd/MM", { locale: ptBR }), completions: count ?? 0 });
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
  }, [user, startDate, endDate]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-3xl font-display font-bold">Relatórios</h1>
          <DateRangeFilter startDate={startDate} endDate={endDate} onStartDateChange={setStartDate} onEndDateChange={setEndDate} />
        </div>

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
