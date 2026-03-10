import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { InstitutionDialog } from "@/components/admin/InstitutionDialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Pencil, Search, Trash2 } from "lucide-react";
import { format } from "date-fns";

type Institution = {
  id: string; name: string; slug: string; logo_url: string | null; is_active: boolean; created_at: string;
};

const AdminInstitutions = () => {
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Institution | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Institution | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("institutions").select("*").order("created_at", { ascending: false });
    if (data) setInstitutions(data);
  };

  useEffect(() => { load(); }, []);

  const toggleActive = async (inst: Institution) => {
    const { error } = await supabase.from("institutions").update({ is_active: !inst.is_active }).eq("id", inst.id);
    if (error) { toast.error(error.message); return; }
    load();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);

    const { data, error } = await supabase.functions.invoke("delete-institution", {
      body: { institution_id: deleteTarget.id },
    });

    setDeleting(false);
    setDeleteTarget(null);

    if (error) {
      toast.error(`Erro ao remover: ${error.message}`);
      return;
    }
    if (data?.error) {
      toast.error(`Erro ao remover: ${data.error}`);
      return;
    }

    toast.success("Instituição removida com sucesso");
    load();
  };

  const filtered = institutions.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold">Instituições</h1>
            <p className="text-muted-foreground mt-1">Gerencie as instituições da plataforma</p>
          </div>
          <Button onClick={() => { setEditing(null); setDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" /> Nova Instituição
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar por nome…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Criada em</TableHead>
                  <TableHead className="w-28">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 && (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Nenhuma instituição encontrada</TableCell></TableRow>
                )}
                {filtered.map((inst) => (
                  <TableRow key={inst.id}>
                    <TableCell className="font-medium">{inst.name}</TableCell>
                    <TableCell className="text-muted-foreground">{inst.slug}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch checked={inst.is_active} onCheckedChange={() => toggleActive(inst)} />
                        <Badge variant={inst.is_active ? "default" : "secondary"}>{inst.is_active ? "Ativa" : "Inativa"}</Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{format(new Date(inst.created_at), "dd/MM/yyyy")}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => { setEditing(inst); setDialogOpen(true); }}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setDeleteTarget(inst)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <InstitutionDialog open={dialogOpen} onOpenChange={setDialogOpen} institution={editing} onSaved={load} />

        <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remover instituição</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja remover <strong>{deleteTarget?.name}</strong>? Esta ação irá remover todas as turmas, membros e desvincular os usuários desta instituição. Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                {deleting ? "Removendo…" : "Remover"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
};

export default AdminInstitutions;
