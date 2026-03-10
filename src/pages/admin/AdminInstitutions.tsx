import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { InstitutionDialog } from "@/components/admin/InstitutionDialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Pencil, Search } from "lucide-react";
import { format } from "date-fns";

type Institution = {
  id: string; name: string; slug: string; logo_url: string | null; is_active: boolean; created_at: string;
};

const AdminInstitutions = () => {
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Institution | null>(null);

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
                  <TableHead className="w-24">Ações</TableHead>
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
                      <Button variant="ghost" size="icon" onClick={() => { setEditing(inst); setDialogOpen(true); }}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <InstitutionDialog open={dialogOpen} onOpenChange={setDialogOpen} institution={editing} onSaved={load} />
      </div>
    </DashboardLayout>
  );
};

export default AdminInstitutions;
