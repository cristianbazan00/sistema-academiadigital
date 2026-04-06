import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Plus, Settings, Pencil, Trash2 } from "lucide-react";
import { FacilitatorDialog } from "@/components/institution/FacilitatorDialog";
import { ManageFacilitatorClassesDialog } from "@/components/institution/ManageFacilitatorClassesDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface FacilitatorClass {
  id: string;
  name: string;
}

interface Facilitator {
  id: string;
  full_name: string;
  classes: FacilitatorClass[];
}

const InstitutionFacilitators = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [facilitators, setFacilitators] = useState<Facilitator[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [selectedFacilitator, setSelectedFacilitator] = useState<Facilitator | null>(null);
  const [editFacilitator, setEditFacilitator] = useState<{ id: string; full_name: string } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Facilitator | null>(null);
  const [deleting, setDeleting] = useState(false);

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
      .select("user_id, classes!class_members_class_id_fkey(id, name)")
      .eq("role", "facilitator")
      .in("user_id", profileIds);

    const classMap: Record<string, FacilitatorClass[]> = {};
    (members ?? []).forEach((m: any) => {
      const cls = m.classes;
      if (!cls?.id) return;
      if (!classMap[m.user_id]) classMap[m.user_id] = [];
      classMap[m.user_id].push({ id: cls.id, name: cls.name });
    });

    setFacilitators(
      profiles.map((p) => ({ id: p.id, full_name: p.full_name, classes: classMap[p.id] ?? [] }))
    );
  };

  useEffect(() => { fetchFacilitators(); }, [user]);

  const openManage = (f: Facilitator) => {
    setSelectedFacilitator(f);
    setManageOpen(true);
  };

  const openEdit = (f: Facilitator) => {
    setEditFacilitator({ id: f.id, full_name: f.full_name });
    setDialogOpen(true);
  };

  const openCreate = () => {
    setEditFacilitator(null);
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const response = await supabase.functions.invoke("activate-account", {
        body: { action: "delete_facilitator", user_id: deleteTarget.id },
      });

      if (response.error || response.data?.error) {
        const msg = response.data?.error || String(response.error);
        toast({ title: "Erro ao remover facilitador", description: msg, variant: "destructive" });
      } else {
        toast({ title: "Facilitador removido com sucesso" });
        fetchFacilitators();
      }
    } catch {
      toast({ title: "Erro inesperado", variant: "destructive" });
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-display font-bold">Facilitadores</h1>
          <Button onClick={openCreate}>
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
                    <TableHead className="w-32">Ações</TableHead>
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
                              <Badge key={c.id} variant="secondary">{c.name}</Badge>
                            ))}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(f)} title="Editar">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => openManage(f)} title="Gerenciar turmas">
                            <Settings className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(f)} title="Remover">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <FacilitatorDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onSaved={fetchFacilitators}
          facilitator={editFacilitator}
        />
        <ManageFacilitatorClassesDialog
          open={manageOpen}
          onOpenChange={setManageOpen}
          facilitatorId={selectedFacilitator?.id ?? null}
          facilitatorName={selectedFacilitator?.full_name ?? ""}
          onSaved={fetchFacilitators}
        />

        <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remover facilitador</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja remover <strong>{deleteTarget?.full_name}</strong>? Esta ação é irreversível e removerá o facilitador de todas as turmas.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                {deleting ? "Removendo..." : "Remover"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
};

export default InstitutionFacilitators;
