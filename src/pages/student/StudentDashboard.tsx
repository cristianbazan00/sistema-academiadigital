import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { BadgesList } from "@/components/student/BadgesList";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, Zap, Target, ArrowRight } from "lucide-react";

const StudentDashboard = () => {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const xp = profile?.xp_total ?? 0;
  const level = profile?.level ?? 1;
  const xpForNext = level * 200;
  const progress = Math.min(xp / xpForNext * 100, 100);

  const [trailProgress, setTrailProgress] = useState({ completed: 0, total: 0 });
  const [hasTrail, setHasTrail] = useState(false);

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      const { data: memberships } = await supabase.
      from("class_members").
      select("class_id").
      eq("user_id", user.id).
      eq("role", "student");

      if (!memberships?.length) return;

      const classIds = memberships.map((m) => m.class_id);
      const { data: classes } = await supabase.
      from("classes").
      select("trail_id").
      in("id", classIds).
      not("trail_id", "is", null).
      limit(1);

      const trailId = classes?.[0]?.trail_id;
      if (!trailId) return;
      setHasTrail(true);

      const { data: mods } = await supabase.
      from("modules").
      select("id").
      eq("trail_id", trailId);

      if (!mods?.length) return;

      const { data: lessons } = await supabase.
      from("lessons").
      select("id").
      in("module_id", mods.map((m) => m.id));

      const total = lessons?.length ?? 0;

      const { data: prog } = await supabase.
      from("lesson_progress").
      select("lesson_id").
      eq("user_id", user.id).
      eq("completed", true);

      const lessonIds = new Set(lessons?.map((l) => l.id) || []);
      const completed = (prog || []).filter((p) => lessonIds.has(p.lesson_id)).length;

      setTrailProgress({ completed, total });
    };

    load();
  }, [user]);

  const trailPct = trailProgress.total > 0 ?
  Math.round(trailProgress.completed / trailProgress.total * 100) :
  0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold">
            Olá, {profile?.full_name || "Aluno"}! 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            Mantenha a sua jornada ativa, cumpra todos os módulos e ganhe todas as conquistas!
          </p>
        </div>

        {/* XP & Level */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                <span className="font-display font-bold text-lg">Nível {level}</span>
              </div>
              <span className="text-sm text-muted-foreground">{xp} / {xpForNext} XP</span>
            </div>
            <Progress value={progress} className="h-3" />
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center gap-2 pb-2">
              <Target className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Minha Trilha</CardTitle>
            </CardHeader>
            <CardContent>
              {hasTrail ? <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Progresso</span>
                    <span className="font-medium">{trailPct}%</span>
                  </div>
                  <Progress value={trailPct} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {trailProgress.completed} de {trailProgress.total} aulas concluídas
                  </p>
                  <Button size="sm" onClick={() => navigate("/student/trail")} className="w-full">
                    Continuar Trilha <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </div> :

              <p className="text-muted-foreground text-sm">
                  Nenhuma trilha atribuída ainda. Aguarde a matrícula pela sua instituição.
                </p>
              }
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center gap-2 pb-2">
              <Trophy className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Conquistas</CardTitle>
            </CardHeader>
            <CardContent>
              <BadgesList />
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>);

};

export default StudentDashboard;