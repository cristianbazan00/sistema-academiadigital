import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, RadialBarChart, RadialBar } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Zap, Target } from "lucide-react";
import { DateRangeFilter } from "@/components/DateRangeFilter";

interface XpPoint {
  date: string;
  xp: number;
}

interface XpLogEntry {
  reason: string;
  xp_amount: number;
  created_at: string;
}

const chartConfig = {
  xp: { label: "XP Acumulado", color: "hsl(var(--primary))" },
  progress: { label: "Progresso", color: "hsl(var(--primary))" },
};

const StudentReports = () => {
  const { user } = useAuth();
  const [startDate, setStartDate] = useState(() => subMonths(new Date(), 3));
  const [endDate, setEndDate] = useState(() => new Date());
  const [xpEvolution, setXpEvolution] = useState<XpPoint[]>([]);
  const [trailProgress, setTrailProgress] = useState(0);
  const [xpHistory, setXpHistory] = useState<XpLogEntry[]>([]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const startIso = startDate.toISOString();
      const endIso = endDate.toISOString();

      // XP evolution filtered by date range
      const { data: xpLogs } = await supabase
        .from("user_xp_log")
        .select("xp_amount, created_at, reason")
        .eq("user_id", user.id)
        .gte("created_at", startIso)
        .lte("created_at", endIso)
        .order("created_at", { ascending: true });

      if (xpLogs && xpLogs.length > 0) {
        let cumulative = 0;
        const points: XpPoint[] = [];
        xpLogs.forEach((log) => {
          cumulative += log.xp_amount;
          points.push({
            date: format(new Date(log.created_at), "dd/MM", { locale: ptBR }),
            xp: cumulative,
          });
        });
        setXpEvolution(points);
        setXpHistory(xpLogs.slice(-20).reverse() as XpLogEntry[]);
      } else {
        setXpEvolution([]);
        setXpHistory([]);
      }

      // Trail progress (not date-filtered - shows overall)
      const { data: membership } = await supabase
        .from("class_members")
        .select("class_id")
        .eq("user_id", user.id)
        .eq("role", "student")
        .limit(1)
        .maybeSingle();

      if (membership) {
        const { data: cls } = await supabase
          .from("classes")
          .select("trail_id")
          .eq("id", membership.class_id)
          .maybeSingle();

        if (cls?.trail_id) {
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
                .eq("user_id", user.id)
                .in("lesson_id", lessonIds)
                .eq("completed", true);
              setTrailProgress(Math.round(((count ?? 0) / totalLessons) * 100));
            }
          }
        }
      }
    };
    load();
  }, [user, startDate, endDate]);

  const radialData = [{ name: "Progresso", value: trailProgress, fill: "hsl(var(--primary))" }];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-3xl font-display font-bold">Meus Relatórios</h1>
          <DateRangeFilter startDate={startDate} endDate={endDate} onStartDateChange={setStartDate} onEndDateChange={setEndDate} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" /> Evolução de XP
              </CardTitle>
            </CardHeader>
            <CardContent>
              {xpEvolution.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum XP registrado no período.</p>
              ) : (
                <ChartContainer config={chartConfig} className="h-[300px] w-full">
                  <AreaChart data={xpEvolution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area type="monotone" dataKey="xp" stroke="var(--color-xp)" fill="var(--color-xp)" fillOpacity={0.2} strokeWidth={2} />
                  </AreaChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" /> Progresso na Trilha
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <ChartContainer config={chartConfig} className="h-[250px] w-[250px]">
                <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%" startAngle={90} endAngle={-270} data={radialData}>
                  <RadialBar dataKey="value" cornerRadius={10} background />
                </RadialBarChart>
              </ChartContainer>
              <p className="text-3xl font-bold text-primary mt-2">{trailProgress}%</p>
              <p className="text-sm text-muted-foreground">concluído</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle>Histórico de XP</CardTitle></CardHeader>
          <CardContent>
            {xpHistory.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum registro no período.</p>
            ) : (
              <div className="space-y-3">
                {xpHistory.map((entry, i) => (
                  <div key={i} className="flex items-center justify-between border-b border-border pb-2 last:border-0">
                    <div>
                      <p className="text-sm font-medium">{entry.reason}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(entry.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                    <span className="text-sm font-bold text-primary">+{entry.xp_amount} XP</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default StudentReports;
