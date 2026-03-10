import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { Building2, Users, BookOpen, TrendingUp } from "lucide-react";
import { format, subMonths, startOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

interface InstitutionStudents {
  name: string;
  students: number;
}

interface MonthlyGrowth {
  month: string;
  count: number;
}

interface RoleDistribution {
  name: string;
  value: number;
}

interface TopStudent {
  full_name: string;
  xp_total: number;
  level: number;
}

const COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--muted-foreground))", "hsl(var(--destructive))"];

const chartConfig = {
  students: { label: "Alunos", color: "hsl(var(--primary))" },
  count: { label: "Novos alunos", color: "hsl(var(--primary))" },
};

const AdminReports = () => {
  const [kpis, setKpis] = useState({ institutions: 0, students: 0, trails: 0, completion: 0 });
  const [instStudents, setInstStudents] = useState<InstitutionStudents[]>([]);
  const [monthlyGrowth, setMonthlyGrowth] = useState<MonthlyGrowth[]>([]);
  const [rolesDist, setRolesDist] = useState<RoleDistribution[]>([]);
  const [topStudents, setTopStudents] = useState<TopStudent[]>([]);

  useEffect(() => {
    const load = async () => {
      // KPIs
      const [{ count: instCount }, { count: studentCount }, { count: trailCount }] = await Promise.all([
        supabase.from("institutions").select("id", { count: "exact", head: true }),
        supabase.from("user_roles").select("id", { count: "exact", head: true }).eq("role", "student"),
        supabase.from("trails").select("id", { count: "exact", head: true }),
      ]);

      // Completion rate
      const { count: totalProgress } = await supabase.from("lesson_progress").select("id", { count: "exact", head: true });
      const { count: completedProgress } = await supabase.from("lesson_progress").select("id", { count: "exact", head: true }).eq("completed", true);
      const completion = totalProgress ? Math.round(((completedProgress ?? 0) / totalProgress) * 100) : 0;

      setKpis({
        institutions: instCount ?? 0,
        students: studentCount ?? 0,
        trails: trailCount ?? 0,
        completion,
      });

      // Students per institution
      const { data: institutions } = await supabase.from("institutions").select("id, name");
      if (institutions) {
        const results: InstitutionStudents[] = [];
        for (const inst of institutions.slice(0, 10)) {
          const { count } = await supabase
            .from("profiles")
            .select("id", { count: "exact", head: true })
            .eq("institution_id", inst.id);
          results.push({ name: inst.name, students: count ?? 0 });
        }
        setInstStudents(results.sort((a, b) => b.students - a.students));
      }

      // Monthly growth (last 6 months)
      const months: MonthlyGrowth[] = [];
      for (let i = 5; i >= 0; i--) {
        const start = startOfMonth(subMonths(new Date(), i));
        const end = startOfMonth(subMonths(new Date(), i - 1));
        const { count } = await supabase
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .gte("created_at", start.toISOString())
          .lt("created_at", end.toISOString());
        months.push({ month: format(start, "MMM", { locale: ptBR }), count: count ?? 0 });
      }
      setMonthlyGrowth(months);

      // Role distribution
      const roleNames: Record<string, string> = {
        admin_master: "Admin",
        admin_institution: "Instituição",
        facilitator: "Facilitador",
        student: "Aluno",
      };
      const { data: roles } = await supabase.from("user_roles").select("role");
      if (roles) {
        const counts: Record<string, number> = {};
        roles.forEach((r) => {
          counts[r.role] = (counts[r.role] || 0) + 1;
        });
        setRolesDist(Object.entries(counts).map(([k, v]) => ({ name: roleNames[k] || k, value: v })));
      }

      // Top 20 students
      const { data: top } = await supabase
        .from("profiles")
        .select("full_name, xp_total, level")
        .order("xp_total", { ascending: false })
        .limit(20);
      setTopStudents((top as TopStudent[]) ?? []);
    };
    load();
  }, []);

  const kpiCards = [
    { label: "Instituições", value: kpis.institutions, icon: Building2, color: "text-primary" },
    { label: "Alunos", value: kpis.students, icon: Users, color: "text-primary" },
    { label: "Trilhas", value: kpis.trails, icon: BookOpen, color: "text-primary" },
    { label: "Taxa de Conclusão", value: `${kpis.completion}%`, icon: TrendingUp, color: "text-primary" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-display font-bold">Relatórios</h1>

        {/* KPI Cards */}
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

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Students per institution */}
          <Card>
            <CardHeader><CardTitle>Alunos por Instituição</CardTitle></CardHeader>
            <CardContent>
              {instStudents.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sem dados.</p>
              ) : (
                <ChartContainer config={chartConfig} className="h-[300px] w-full">
                  <BarChart data={instStudents}>
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

          {/* Monthly growth */}
          <Card>
            <CardHeader><CardTitle>Novos Alunos por Mês</CardTitle></CardHeader>
            <CardContent>
              {monthlyGrowth.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sem dados.</p>
              ) : (
                <ChartContainer config={chartConfig} className="h-[300px] w-full">
                  <LineChart data={monthlyGrowth}>
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

        {/* Role distribution */}
        <Card>
          <CardHeader><CardTitle>Distribuição de Papéis</CardTitle></CardHeader>
          <CardContent className="flex justify-center">
            {rolesDist.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem dados.</p>
            ) : (
              <ChartContainer config={chartConfig} className="h-[300px] w-[400px]">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Pie data={rolesDist} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                    {rolesDist.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Top students */}
        <Card>
          <CardHeader><CardTitle>Top 20 Alunos por XP</CardTitle></CardHeader>
          <CardContent>
            {topStudents.length === 0 ? (
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
                  {topStudents.map((s, i) => (
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

export default AdminReports;
