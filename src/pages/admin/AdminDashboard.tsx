import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, TrendingUp, BookOpen } from "lucide-react";

const stats = [
  { label: "Instituições", value: "—", icon: Building2, color: "text-primary" },
  { label: "Alunos Ativos", value: "—", icon: Users, color: "text-success" },
  { label: "Taxa de Conclusão", value: "—", icon: TrendingUp, color: "text-warning" },
  { label: "Trilhas Criadas", value: "—", icon: BookOpen, color: "text-accent" },
];

const AdminDashboard = () => (
  <DashboardLayout>
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold">Painel Admin Master</h1>
        <p className="text-muted-foreground mt-1">Visão global da plataforma</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
              <s.icon className={`h-5 w-5 ${s.color}`} />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-display font-bold">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Atividade Recente</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">Nenhuma atividade registada ainda. Comece criando uma instituição e uma trilha de ensino.</p>
        </CardContent>
      </Card>
    </div>
  </DashboardLayout>
);

export default AdminDashboard;
