import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrailDialog } from "@/components/admin/TrailDialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Pencil, ExternalLink } from "lucide-react";
import { format } from "date-fns";

type Trail = {
  id: string; title: string; description: string | null; cover_image_url: string | null;
  is_published: boolean; created_at: string;
};

const AdminTrails = () => {
  const navigate = useNavigate();
  const [trails, setTrails] = useState<Trail[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Trail | null>(null);

  const load = async () => {
    const { data } = await supabase.from("trails").select("*").order("created_at", { ascending: false });
    if (data) setTrails(data);
  };

  useEffect(() => { load(); }, []);

  const togglePublish = async (t: Trail) => {
    const { error } = await supabase.from("trails").update({ is_published: !t.is_published }).eq("id", t.id);
    if (error) { toast.error(error.message); return; }
    load();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold">Trilhas de Ensino</h1>
            <p className="text-muted-foreground mt-1">Crie e gerencie trilhas com módulos, aulas e atividades</p>
          </div>
          <Button onClick={() => { setEditing(null); setDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" /> Nova Trilha
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Criada em</TableHead>
                  <TableHead className="w-32">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trails.length === 0 && (
                  <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">Nenhuma trilha criada</TableCell></TableRow>
                )}
                {trails.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.title}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch checked={t.is_published} onCheckedChange={() => togglePublish(t)} />
                        <Badge variant={t.is_published ? "default" : "secondary"}>{t.is_published ? "Publicada" : "Rascunho"}</Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{format(new Date(t.created_at), "dd/MM/yyyy")}</TableCell>
                    <TableCell className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => { setEditing(t); setDialogOpen(true); }}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => navigate(`/admin/trails/${t.id}`)}>
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <TrailDialog open={dialogOpen} onOpenChange={setDialogOpen} trail={editing} onSaved={load} />
      </div>
    </DashboardLayout>
  );
};

export default AdminTrails;
