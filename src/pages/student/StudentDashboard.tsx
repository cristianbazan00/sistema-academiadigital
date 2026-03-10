import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { Trophy, Zap, Target } from "lucide-react";

const StudentDashboard = () => {
  const { profile } = useAuth();
  const xp = profile?.xp_total ?? 0;
  const level = profile?.level ?? 1;
  const xpForNext = level * 200;
  const progress = Math.min((xp / xpForNext) * 100, 100);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold">
            Olá, {profile?.full_name || "Aluno"}! 👋
          </h1>
          <p className="text-muted-foreground mt-1">Continue sua jornada de empregabilidade</p>
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
              <p className="text-muted-foreground text-sm">Nenhuma trilha atribuída ainda. Aguarde a matrícula pela sua instituição.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center gap-2 pb-2">
              <Trophy className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Conquistas</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">Complete atividades para ganhar badges!</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentDashboard;
