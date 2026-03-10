import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { Building2, Users, BookOpen, TrendingUp, AlertCircle } from "lucide-react";
import { DashboardSkeleton } from "@/components/DashboardSkeleton";
import { format, subMonths, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DateRangeFilter } from "@/components/DateRangeFilter";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface DashboardData {
  kpis: { institutions: number; students: number; trails: number; completion_pct: number };
  students_per_institution: { name: string; students: number }[];
  monthly_growth: { month: string; count: number }[];
  roles_distribution: { role: string; count: number }[];
  top_students: { full_name: string; xp_total: number; level: number }[];
}

const COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--muted-foreground))", "hsl(var(--destructive))"];

const roleNames: Record<string, string> = {
  admin_master: "Admin", admin_institution: "Instituição", facilitator: "Facilitador", student: "Aluno",
};

const chartConfig = {
  students: { label: "Alunos", color: "hsl(var(--primary))" },
  count: { label: "Novos alunos", color: "hsl(var(--primary))" },
};

const AdminDashboard = () => {
  const [startDate, setStartDate] = useState(() => subMonths(new Date(), 6));
  const [endDate, setEndDate] = useState(() => new Date());
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    const { data: result, error: rpcError } = await supabase.rpc("get_admin_dashboard_data", {
      _start_date: startDate.toISOString(),
      _end_date: endDate.toISOString(),
    });
    if (rpcError) {
      setError("Não foi possível carregar os dados do painel. Tente novamente.");
      console.error("Admin dashboard RPC error:", rpcError);
    } else if (result) {
      setData(result as unknown as DashboardData);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [startDate, endDate]);

  const kpis = data?.kpis ?? { institutions: 0, students: 0, trails: 0, completion_pct: 0 };
  const monthlyFormatted = (data?.monthly_growth ?? []).map((m) => ({
    ...m,
    month: format(parseISO(m.month), "MMM yy", { locale: ptBR }),
  }));
  const rolesFormatted = (data?.roles_distribution ?? []).map((r) => ({
    name: roleNames[r.role] || r.role,
    value: r.count,
  }));

  const kpiCards = [
    { label: "Instituições", value: kpis.institutions, icon: Building2, color: "text-primary" },
    { label: "Alunos", value: kpis.students, icon: Users, color: "text-primary" },
    { label: "Trilhas", value: kpis.trails, icon: BookOpen, color: "text-primary" },
    { label: "Taxa de Conclusão", value: `${kpis.completion_pct}%`, icon: TrendingUp, color: "text-primary" },
  ];

  if (error) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <h1 className="text-3xl font-display font-bold">Painel Admin Master</h1>
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
        <DashboardSkeleton kpiCount={4} sections={4} />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold">Painel Admin Master</h1>
            <p className="text-muted-foreground mt-1">Visão global da plataforma</p>
          </div>
          <DateRangeFilter startDate={startDate} endDate={endDate} onStartDateChange={setStartDate} onEndDateChange={setEndDate} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiCards.map((k) => (
            <Card key={k.label}>
              <CardContent className="p-6 flex items-center gap-4">
                <k.icon className={`h-8 w-8 ${k.color}`} />
                <div>
                  <p className="text-sm text-muted-foreground">{k.label}</p>
                  <p className="text-2xl font-bold">{k.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle>Alunos por Instituição</CardTitle></CardHeader>
            <CardContent>
              {(data?.students_per_institution ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">Sem dados.</p>
              ) : (
                <ChartContainer config={chartConfig} className="h-[300px] w-full">
                  <BarChart data={data!.students_per_institution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="students" fill="var(--color-students)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Novos Alunos por Mês</CardTitle></CardHeader>
            <CardContent>
              {monthlyFormatted.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sem dados.</p>
              ) : (
                <ChartContainer config={chartConfig} className="h-[300px] w-full">
                  <LineChart data={monthlyFormatted}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line type="monotone" dataKey="count" stroke="var(--color-count)" strokeWidth={2} dot />
                  </LineChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle>Distribuição de Papéis</CardTitle></CardHeader>
          <CardContent className="flex justify-center">
            {rolesFormatted.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem dados.</p>
            ) : (
              <ChartContainer config={chartConfig} className="h-[300px] w-[400px]">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Pie data={rolesFormatted} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                    {rolesFormatted.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Top 20 Alunos por XP</CardTitle></CardHeader>
          <CardContent>
            {(data?.top_students ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem dados.</p>
            ) : (
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
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
