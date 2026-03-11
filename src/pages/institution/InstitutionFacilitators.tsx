import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Plus } from "lucide-react";
import { FacilitatorDialog } from "@/components/institution/FacilitatorDialog";

interface Facilitator {
  id: string;
  full_name: string;
  classes: string[];
}

const InstitutionFacilitators = () => {
  const { user } = useAuth();
  const [facilitators, setFacilitators] = useState<Facilitator[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchFacilitators = async () => {
    if (!user) return;
    const { data: instId } = await supabase.rpc("get_user_institution_id", { _user_id: user.id });
    if (!instId) return;

    const { data: roles } = await supabase.from("user_roles").select("user_id").eq("role", "facilitator");
    const facUserIds = (roles ?? []).map((r) => r.user_id);
    if (facUserIds.length === 0) { setFacilitators([]); return; }

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name")
      .eq("institution_id", instId as string)
      .in("id", facUserIds);

    if (!profiles || profiles.length === 0) { setFacilitators([]); return; }

    const profileIds = profiles.map((p) => p.id);
    const { data: members } = await supabase
      .from("class_members")
      .select("user_id, classes(name)")
      .eq("role", "facilitator")
      .in("user_id", profileIds);

    const classMap: Record<string, string[]> = {};
    (members ?? []).forEach((m: any) => {
      const name = m.classes?.name;
      if (!name) return;
      if (!classMap[m.user_id]) classMap[m.user_id] = [];
      classMap[m.user_id].push(name);
    });

    setFacilitators(
      profiles.map((p) => ({ id: p.id, full_name: p.full_name, classes: classMap[p.id] ?? [] }))
    );
  };

  useEffect(() => { fetchFacilitators(); }, [user]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-display font-bold">Facilitadores</h1>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> Novo Facilitador
          </Button>
        </div>

        <Card>
          <CardHeader><CardTitle>Facilitadores da Instituição</CardTitle></CardHeader>
          <CardContent>
            {facilitators.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum facilitador cadastrado.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Turmas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {facilitators.map((f) => (
                    <TableRow key={f.id}>
                      <TableCell className="font-medium">{f.full_name}</TableCell>
                      <TableCell>
                        {f.classes.length === 0 ? (
                          <span className="text-sm text-muted-foreground">Nenhuma turma</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {f.classes.map((c) => (
                              <Badge key={c} variant="secondary">{c}</Badge>
                            ))}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <FacilitatorDialog open={dialogOpen} onOpenChange={setDialogOpen} onSaved={fetchFacilitators} />
      </div>
    </DashboardLayout>
  );
};

export default InstitutionFacilitators;
