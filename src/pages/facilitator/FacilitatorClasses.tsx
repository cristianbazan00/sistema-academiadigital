import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ChevronDown, Plus, ClipboardList } from "lucide-react";
import { ExtraActivityDialog } from "@/components/facilitator/ExtraActivityDialog";
import { StudentProgressDialog } from "@/components/facilitator/StudentProgressDialog";

interface ClassInfo {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  students: { id: string; full_name: string; xp_total: number; level: number }[];
  extras: { id: string; title: string; created_at: string }[];
}

const FacilitatorClasses = () => {
  const { user } = useAuth();
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [extraDialogOpen, setExtraDialogOpen] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [selectedStudent, setSelectedStudent] = useState<{ id: string; name: string } | null>(null);

  const fetchClasses = async () => {
    if (!user) return;
    setLoading(true);

    // Get classes this facilitator belongs to
    const { data: memberships } = await supabase
      .from("class_members")
      .select("class_id")
      .eq("user_id", user.id)
      .eq("role", "facilitator");

    const classIds = (memberships ?? []).map((m) => m.class_id);
    if (classIds.length === 0) { setClasses([]); setLoading(false); return; }

    const { data: classRows } = await supabase
      .from("classes")
      .select("id, name, description, is_active")
      .in("id", classIds);

    const result: ClassInfo[] = [];

    for (const c of classRows ?? []) {
      // Get students in this class
      const { data: studentMembers } = await supabase
        .from("class_members")
        .select("user_id")
        .eq("class_id", c.id)
        .eq("role", "student");

      const studentIds = (studentMembers ?? []).map((s) => s.user_id);
      let students: ClassInfo["students"] = [];
      if (studentIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, xp_total, level")
          .in("id", studentIds)
          .order("xp_total", { ascending: false });
        students = (profiles ?? []).map((p) => ({
          id: p.id,
          full_name: p.full_name,
          xp_total: p.xp_total,
          level: p.level,
        }));
      }

      // Get extra activities for this class
      const { data: extras } = await supabase
        .from("extra_activities")
        .select("id, title, created_at")
        .eq("class_id", c.id)
        .eq("created_by", user.id)
        .order("created_at", { ascending: false });

      result.push({
        id: c.id,
        name: c.name,
        description: c.description,
        is_active: c.is_active,
        students,
        extras: extras ?? [],
      });
    }

    setClasses(result);
    setLoading(false);
  };

  useEffect(() => { fetchClasses(); }, [user]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-display font-bold">Minhas Turmas</h1>

        {loading ? (
          <p className="text-muted-foreground">Carregando...</p>
        ) : classes.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground">Você ainda não foi alocado em nenhuma turma.</p>
            </CardContent>
          </Card>
        ) : (
          classes.map((c) => (
            <Collapsible key={c.id} defaultOpen>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </CollapsibleTrigger>
                      <CardTitle className="text-lg">{c.name}</CardTitle>
                      <Badge variant={c.is_active ? "secondary" : "outline"}>
                        {c.is_active ? "Ativa" : "Inativa"}
                      </Badge>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => { setSelectedClassId(c.id); setExtraDialogOpen(true); }}
                    >
                      <Plus className="h-4 w-4 mr-1" /> Atividade Extra
                    </Button>
                  </div>
                </CardHeader>
                <CollapsibleContent>
                  <CardContent className="space-y-4">
                    {/* Students */}
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Alunos ({c.students.length})</h4>
                      {c.students.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Nenhum aluno nesta turma.</p>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Nome</TableHead>
                              <TableHead>Nível</TableHead>
                              <TableHead>XP</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {c.students.map((s) => (
                              <TableRow key={s.id}>
                                <TableCell>
                                  <button
                                    className="text-primary hover:underline font-medium text-left"
                                    onClick={() => setSelectedStudent({ id: s.id, name: s.full_name })}
                                  >
                                    {s.full_name}
                                  </button>
                                </TableCell>
                                <TableCell>{s.level}</TableCell>
                                <TableCell className="font-mono">{s.xp_total}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </div>

                    {/* Extra activities */}
                    {c.extras.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold mb-2 flex items-center gap-1">
                          <ClipboardList className="h-4 w-4" /> Atividades Extras
                        </h4>
                        <ul className="space-y-1">
                          {c.extras.map((ex) => (
                            <li key={ex.id} className="text-sm flex items-center justify-between border-b border-border py-1.5">
                              <span>{ex.title}</span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(ex.created_at).toLocaleDateString("pt-BR")}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          ))
        )}

        <ExtraActivityDialog
          open={extraDialogOpen}
          onOpenChange={setExtraDialogOpen}
          classId={selectedClassId}
          onSaved={fetchClasses}
        />

        <StudentProgressDialog
          studentId={selectedStudent?.id ?? ""}
          studentName={selectedStudent?.name ?? ""}
          open={!!selectedStudent}
          onOpenChange={(open) => { if (!open) setSelectedStudent(null); }}
        />
      </div>
    </DashboardLayout>
  );
};

export default FacilitatorClasses;
