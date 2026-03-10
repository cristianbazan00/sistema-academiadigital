import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Plus, X } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classId: string | null;
  className: string;
}

interface Member {
  user_id: string;
  role: string;
  full_name: string;
}

interface Facilitator {
  id: string;
  full_name: string;
}

export function ClassMembersDialog({ open, onOpenChange, classId, className }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [members, setMembers] = useState<Member[]>([]);
  const [facilitators, setFacilitators] = useState<Facilitator[]>([]);
  const [selectedFacilitator, setSelectedFacilitator] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchMembers = async () => {
    if (!classId) return;
    setLoading(true);
    const { data } = await supabase
      .from("class_members")
      .select("user_id, role")
      .eq("class_id", classId);
    if (!data || data.length === 0) { setMembers([]); setLoading(false); return; }
    const userIds = data.map((m) => m.user_id);
    const { data: profiles } = await supabase.from("profiles").select("id, full_name").in("id", userIds);
    const profileMap = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));
    setMembers(data.map((m) => ({ ...m, full_name: profileMap.get(m.user_id) ?? "—" })));
    setLoading(false);
  };

  const fetchFacilitators = async () => {
    if (!user) return;
    const { data: instId } = await supabase.rpc("get_user_institution_id", { _user_id: user.id });
    if (!instId) return;
    const { data: roles } = await supabase.from("user_roles").select("user_id").eq("role", "facilitator");
    if (!roles || roles.length === 0) { setFacilitators([]); return; }
    const facIds = roles.map((r) => r.user_id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", facIds)
      .eq("institution_id", instId as string);
    setFacilitators((profiles as Facilitator[]) ?? []);
  };

  useEffect(() => {
    if (!open || !classId) return;
    fetchMembers();
    fetchFacilitators();
    setSelectedFacilitator("");
  }, [open, classId]);

  const assignedFacilitatorIds = new Set(members.filter((m) => m.role === "facilitator").map((m) => m.user_id));
  const availableFacilitators = facilitators.filter((f) => !assignedFacilitatorIds.has(f.id));

  const handleAdd = async () => {
    if (!classId || !selectedFacilitator) return;
    const { error } = await supabase.from("class_members").insert({
      class_id: classId,
      user_id: selectedFacilitator,
      role: "facilitator" as any,
    });
    if (error) {
      toast({ title: "Erro ao adicionar facilitador", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Facilitador adicionado à turma" });
    setSelectedFacilitator("");
    fetchMembers();
  };

  const handleRemove = async (userId: string) => {
    if (!classId) return;
    const { error } = await supabase
      .from("class_members")
      .delete()
      .eq("class_id", classId)
      .eq("user_id", userId)
      .eq("role", "facilitator" as any);
    if (error) {
      toast({ title: "Erro ao remover facilitador", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Facilitador removido da turma" });
    fetchMembers();
  };

  const roleLabels: Record<string, string> = { student: "Aluno", facilitator: "Facilitador" };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Membros — {className}</DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-2">
          <Select value={selectedFacilitator} onValueChange={setSelectedFacilitator}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Selecione um facilitador..." />
            </SelectTrigger>
            <SelectContent>
              {availableFacilitators.length === 0 ? (
                <p className="px-3 py-2 text-sm text-muted-foreground">Nenhum facilitador disponível</p>
              ) : (
                availableFacilitators.map((f) => (
                  <SelectItem key={f.id} value={f.id}>{f.full_name}</SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          <Button size="sm" onClick={handleAdd} disabled={!selectedFacilitator}>
            <Plus className="h-4 w-4 mr-1" /> Adicionar
          </Button>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : members.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum membro nesta turma.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Papel</TableHead>
                <TableHead className="w-16">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((m) => (
                <TableRow key={m.user_id}>
                  <TableCell>{m.full_name}</TableCell>
                  <TableCell><Badge variant="secondary">{roleLabels[m.role] ?? m.role}</Badge></TableCell>
                  <TableCell>
                    {m.role === "facilitator" && (
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleRemove(m.user_id)}>
                        <X className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DialogContent>
    </Dialog>
  );
}
