import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Trophy } from "lucide-react";

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

const InstitutionReports = () => {
  const { user } = useAuth();
  const [classReports, setClassReports] = useState<ClassReport[]>([]);
  const [ranking, setRanking] = useState<StudentRank[]>([]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data: instId } = await supabase.rpc("get_user_institution_id", { _user_id: user.id });
      if (!instId) return;

      const { data: classes } = await supabase.from("classes").select("id, name").eq("institution_id", instId as string);
      if (!classes) return;

      const reports: ClassReport[] = [];
      for (const c of classes) {
        const { data: members } = await supabase.from("class_members").select("user_id").eq("class_id", c.id).eq("role", "student");
        reports.push({ id: c.id, name: c.name, studentCount: members?.length ?? 0, completionPct: 0 });
      }
      setClassReports(reports);

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

        <Card>
          <CardHeader><CardTitle>Conclusão por Turma</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {classReports.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma turma encontrada.</p>
            ) : (
              classReports.map((c) => (
                <div key={c.id} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{c.name}</span>
                    <span className="text-muted-foreground">{c.studentCount} alunos · {c.completionPct}%</span>
                  </div>
                  <Progress value={c.completionPct} className="h-2" />
                </div>
              ))
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
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default InstitutionReports;
