import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Users, BookOpen, ClipboardList, TrendingUp, Trophy, AlertCircle } from "lucide-react";
import { DashboardSkeleton } from "@/components/DashboardSkeleton";
import { subMonths } from "date-fns";
import { DateRangeFilter } from "@/components/DateRangeFilter";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface DashboardData {
  kpis: { classes: number; students: number; extras: number; avg_completion: number };
  class_completions: { name: string; completion: number }[];
  student_ranking: { full_name: string; xp_total: number; level: number; class_name: string }[];
}

const chartConfig = {
  completion: { label: "Conclusão %", color: "hsl(var(--primary))" },
  xp_total: { label: "XP", color: "hsl(var(--primary))" },
};

const FacilitatorDashboard = () => {
  const { user, profile } = useAuth();
  const [startDate, setStartDate] = useState(() => subMonths(new Date(), 3));
  const [endDate, setEndDate] = useState(() => new Date());
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    const { data: result, error: rpcError } = await supabase.rpc("get_facilitator_dashboard_data", {
      _user_id: user.id,
      _start_date: startDate.toISOString(),
      _end_date: endDate.toISOString(),
    });
    if (rpcError) {
      setError("Não foi possível carregar os dados do painel. Tente novamente.");
      console.error("Facilitator dashboard RPC error:", rpcError);
    } else if (result) {
      setData(result as unknown as DashboardData);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [user, startDate, endDate]);

  const kpis = data?.kpis ?? { classes: 0, students: 0, extras: 0, avg_completion: 0 };

  const stats = [
    { label: "Minhas Turmas", value: kpis.classes, icon: BookOpen, color: "text-primary" },
    { label: "Alunos", value: kpis.students, icon: Users, color: "text-primary" },
    { label: "Atividades Extras", value: kpis.extras, icon: ClipboardList, color: "text-primary" },
    { label: "Conclusão Média", value: `${kpis.avg_completion}%`, icon: TrendingUp, color: "text-primary" },
  ];

  if (error) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <h1 className="text-3xl font-display font-bold">Olá, {profile?.full_name || "Facilitador"}! 👋</h1>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro ao carregar dados</AlertTitle>
            <AlertDescription className="flex items-center justify-between">
              <span>{error}</span>
              <Button variant="outline" size="sm" onClick={loadData}>Tentar novamente</Button>
            </AlertDescription>
          </Alert>
        </div>
      </DashboardLayout>
    );
  }

  if (loading) {
    return (
      <DashboardLayout>
        <DashboardSkeleton kpiCount={3} sections={2} />
      </DashboardLayout>
    );
  }

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
            {(data?.class_completions ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma turma encontrada.</p>
            ) : (
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <BarChart data={data!.class_completions}>
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
            {(data?.student_ranking ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem dados.</p>
            ) : (
              <>
                <ChartContainer config={chartConfig} className="h-[300px] w-full mb-6">
                  <BarChart data={data!.student_ranking.slice(0, 10)} layout="vertical">
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
                    {data!.student_ranking.map((s, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-bold">{i + 1}</TableCell>
                        <TableCell>{s.full_name}</TableCell>
                        <TableCell>{s.class_name}</TableCell>
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
