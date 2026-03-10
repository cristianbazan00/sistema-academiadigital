import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

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

export function ClassMembersDialog({ open, onOpenChange, classId, className }: Props) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !classId) return;
    setLoading(true);
    supabase
      .from("class_members")
      .select("user_id, role")
      .eq("class_id", classId)
      .then(async ({ data }) => {
        if (!data || data.length === 0) { setMembers([]); setLoading(false); return; }
        const userIds = data.map((m) => m.user_id);
        const { data: profiles } = await supabase.from("profiles").select("id, full_name").in("id", userIds);
        const profileMap = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));
        setMembers(data.map((m) => ({ ...m, full_name: profileMap.get(m.user_id) ?? "—" })));
        setLoading(false);
      });
  }, [open, classId]);

  const roleLabels: Record<string, string> = { student: "Aluno", facilitator: "Facilitador" };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Membros — {className}</DialogTitle>
        </DialogHeader>
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((m) => (
                <TableRow key={m.user_id}>
                  <TableCell>{m.full_name}</TableCell>
                  <TableCell><Badge variant="secondary">{roleLabels[m.role] ?? m.role}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DialogContent>
    </Dialog>
  );
}
