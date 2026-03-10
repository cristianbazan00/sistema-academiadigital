import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Users, GraduationCap, BookOpen, TrendingUp, Trophy, AlertCircle, Loader2 } from "lucide-react";
import { format, subMonths, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DateRangeFilter } from "@/components/DateRangeFilter";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface DashboardData {
  kpis: { classes: number; students: number; facilitators: number; avg_completion: number };
  class_reports: { name: string; student_count: number; completion_pct: number }[];
  weekly_completions: { week_start: string; completions: number }[];
  top_students: { full_name: string; xp_total: number; level: number }[];
}

const chartConfig = {
  completion_pct: { label: "Conclusão %", color: "hsl(var(--primary))" },
  completions: { label: "Conclusões", color: "hsl(var(--primary))" },
  xp_total: { label: "XP", color: "hsl(var(--primary))" },
};

const InstitutionDashboard = () => {
  const { user } = useAuth();
  const [startDate, setStartDate] = useState(() => subMonths(new Date(), 2));
  const [endDate, setEndDate] = useState(() => new Date());
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    const { data: result, error: rpcError } = await supabase.rpc("get_institution_dashboard_data", {
      _user_id: user.id,
      _start_date: startDate.toISOString(),
      _end_date: endDate.toISOString(),
    });
    if (rpcError) {
      setError("Não foi possível carregar os dados do painel. Tente novamente.");
      console.error("Institution dashboard RPC error:", rpcError);
    } else if (result) {
      setData(result as unknown as DashboardData);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [user, startDate, endDate]);

  const kpis = data?.kpis ?? { classes: 0, students: 0, facilitators: 0, avg_completion: 0 };
  const weeklyFormatted = (data?.weekly_completions ?? []).map((w) => ({
    ...w,
    week: format(parseISO(w.week_start), "dd/MM", { locale: ptBR }),
  }));

  const stats = [
    { label: "Turmas", value: kpis.classes, icon: BookOpen, color: "text-primary" },
    { label: "Alunos", value: kpis.students, icon: GraduationCap, color: "text-primary" },
    { label: "Facilitadores", value: kpis.facilitators, icon: Users, color: "text-primary" },
    { label: "Conclusão Média", value: `${kpis.avg_completion}%`, icon: TrendingUp, color: "text-primary" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-3xl font-display font-bold">Dashboard da Instituição</h1>
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
            {(data?.class_reports ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma turma encontrada.</p>
            ) : (
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <BarChart data={data!.class_reports}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 100]} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="completion_pct" fill="var(--color-completion_pct)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Evolução de Conclusões por Semana</CardTitle></CardHeader>
          <CardContent>
            {weeklyFormatted.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem dados.</p>
            ) : (
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <LineChart data={weeklyFormatted}>
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
            {(data?.top_students ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem dados ainda.</p>
            ) : (
              <>
                <ChartContainer config={chartConfig} className="h-[300px] w-full mb-6">
                  <BarChart data={data!.top_students.slice(0, 10)} layout="vertical">
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
                    {data!.top_students.map((s, i) => (
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

export default InstitutionDashboard;
