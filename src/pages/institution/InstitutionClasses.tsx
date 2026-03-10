import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Users } from "lucide-react";
import { ClassDialog } from "@/components/institution/ClassDialog";
import { ClassMembersDialog } from "@/components/institution/ClassMembersDialog";

interface ClassRow {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  trail_id: string | null;
  trails?: { title: string } | null;
}

const InstitutionClasses = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editClass, setEditClass] = useState<ClassRow | null>(null);
  const [membersOpen, setMembersOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<{ id: string; name: string } | null>(null);

  const fetchClasses = async () => {
    if (!user) return;
    const { data: instId } = await supabase.rpc("get_user_institution_id", { _user_id: user.id });
    if (!instId) return;
    const { data } = await supabase.from("classes").select("*, trails(title)").eq("institution_id", instId as string).order("created_at", { ascending: false });
    setClasses((data as ClassRow[]) ?? []);
  };

  useEffect(() => { fetchClasses(); }, [user]);

  const toggleActive = async (c: ClassRow) => {
    await supabase.from("classes").update({ is_active: !c.is_active }).eq("id", c.id);
    toast({ title: c.is_active ? "Turma desativada" : "Turma ativada" });
    fetchClasses();
  };

  const filtered = classes.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-display font-bold">Turmas</h1>
          <Button onClick={() => { setEditClass(null); setDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" /> Nova Turma
          </Button>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar turma..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>

        <Card>
          <CardHeader><CardTitle>Todas as Turmas</CardTitle></CardHeader>
          <CardContent>
            {filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma turma encontrada.</p>
            ) : (
              <Table>
                <TableHeader>
                    <TableRow>
                     <TableHead>Nome</TableHead>
                     <TableHead>Trilha</TableHead>
                     <TableHead>Descrição</TableHead>
                     <TableHead>Ativa</TableHead>
                     <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{c.description || "—"}</TableCell>
                      <TableCell>
                        <Switch checked={c.is_active} onCheckedChange={() => toggleActive(c)} />
                      </TableCell>
                      <TableCell className="space-x-2">
                        <Button size="sm" variant="outline" onClick={() => { setEditClass(c); setDialogOpen(true); }}>Editar</Button>
                        <Button size="sm" variant="ghost" onClick={() => { setSelectedClass({ id: c.id, name: c.name }); setMembersOpen(true); }}>
                          <Users className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <ClassDialog open={dialogOpen} onOpenChange={setDialogOpen} classData={editClass} onSaved={fetchClasses} />
        <ClassMembersDialog open={membersOpen} onOpenChange={setMembersOpen} classId={selectedClass?.id ?? null} className={selectedClass?.name ?? ""} />
      </div>
    </DashboardLayout>
  );
};

export default InstitutionClasses;
