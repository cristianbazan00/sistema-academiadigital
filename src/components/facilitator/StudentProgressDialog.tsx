import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Circle, Star, TrendingUp, Award } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Props {
  studentId: string;
  studentName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface LessonStatus {
  id: string;
  title: string;
  moduleName: string;
  completed: boolean;
}

interface XpEntry {
  id: string;
  xp_amount: number;
  reason: string;
  created_at: string;
}

export const StudentProgressDialog = ({ studentId, studentName, open, onOpenChange }: Props) => {
  const [loading, setLoading] = useState(true);
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(1);
  const [lessons, setLessons] = useState<LessonStatus[]>([]);
  const [xpLog, setXpLog] = useState<XpEntry[]>([]);

  useEffect(() => {
    if (!open || !studentId) return;
    setLoading(true);

    const load = async () => {
      // Profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("xp_total, level")
        .eq("id", studentId)
        .single();

      setXp(profile?.xp_total ?? 0);
      setLevel(profile?.level ?? 1);

      // Get student's class → trail → modules → lessons
      const { data: memberships } = await supabase
        .from("class_members")
        .select("class_id")
        .eq("user_id", studentId)
        .eq("role", "student");

      const classIds = (memberships ?? []).map((m) => m.class_id);
      let allLessons: LessonStatus[] = [];

      if (classIds.length > 0) {
        const { data: classes } = await supabase
          .from("classes")
          .select("trail_id")
          .in("id", classIds)
          .not("trail_id", "is", null);

        const trailIds = [...new Set((classes ?? []).map((c) => c.trail_id).filter(Boolean))] as string[];

        for (const trailId of trailIds) {
          const { data: modules } = await supabase
            .from("modules")
            .select("id, title, sort_order")
            .eq("trail_id", trailId)
            .order("sort_order");

          for (const mod of modules ?? []) {
            const { data: lessonRows } = await supabase
              .from("lessons")
              .select("id, title, sort_order")
              .eq("module_id", mod.id)
              .order("sort_order");

            for (const l of lessonRows ?? []) {
              allLessons.push({ id: l.id, title: l.title, moduleName: mod.title, completed: false });
            }
          }
        }

        // Get lesson_progress
        if (allLessons.length > 0) {
          const { data: progress } = await supabase
            .from("lesson_progress")
            .select("lesson_id, completed")
            .eq("user_id", studentId)
            .in("lesson_id", allLessons.map((l) => l.id));

          const completedSet = new Set((progress ?? []).filter((p) => p.completed).map((p) => p.lesson_id));
          allLessons = allLessons.map((l) => ({ ...l, completed: completedSet.has(l.id) }));
        }
      }

      setLessons(allLessons);

      // XP log
      const { data: log } = await supabase
        .from("user_xp_log")
        .select("id, xp_amount, reason, created_at")
        .eq("user_id", studentId)
        .order("created_at", { ascending: false })
        .limit(20);

      setXpLog(log ?? []);
      setLoading(false);
    };

    load();
  }, [open, studentId]);

  const completedCount = lessons.filter((l) => l.completed).length;
  const completionPct = lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Evolução de {studentName}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* KPIs */}
            <div className="grid grid-cols-3 gap-3">
              <Card>
                <CardContent className="pt-4 pb-3 text-center">
                  <Star className="h-5 w-5 text-primary mx-auto mb-1" />
                  <p className="text-2xl font-bold font-mono">{xp}</p>
                  <p className="text-xs text-muted-foreground">XP Total</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-3 text-center">
                  <Award className="h-5 w-5 text-primary mx-auto mb-1" />
                  <p className="text-2xl font-bold">{level}</p>
                  <p className="text-xs text-muted-foreground">Nível</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-3 text-center">
                  <TrendingUp className="h-5 w-5 text-primary mx-auto mb-1" />
                  <p className="text-2xl font-bold">{completionPct}%</p>
                  <p className="text-xs text-muted-foreground">Conclusão</p>
                </CardContent>
              </Card>
            </div>

            {/* Progress bar */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Progresso geral</span>
                <span className="font-medium">{completedCount}/{lessons.length} aulas</span>
              </div>
              <Progress value={completionPct} className="h-3" />
            </div>

            {/* Lessons */}
            {lessons.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2">Progresso por Aula</h4>
                <div className="space-y-1 max-h-60 overflow-y-auto pr-1">
                  {lessons.map((l) => (
                    <div key={l.id} className="flex items-center gap-2 text-sm py-1">
                      {l.completed ? (
                        <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                      ) : (
                        <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
                      )}
                      <span className={l.completed ? "" : "text-muted-foreground"}>
                        {l.title}
                      </span>
                      <span className="text-xs text-muted-foreground ml-auto shrink-0">
                        {l.moduleName}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* XP History */}
            {xpLog.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2">Histórico de XP Recente</h4>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {xpLog.map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between text-sm border-b border-border py-1.5">
                      <div>
                        <span className="font-medium text-green-600">+{entry.xp_amount} XP</span>
                        <span className="text-muted-foreground ml-2">{entry.reason}</span>
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {format(new Date(entry.created_at), "dd/MM/yy", { locale: ptBR })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
