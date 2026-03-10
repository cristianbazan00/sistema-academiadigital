import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classData?: { id: string; name: string; description: string | null } | null;
  onSaved: () => void;
}

export function ClassDialog({ open, onOpenChange, classData, onSaved }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName(classData?.name ?? "");
      setDescription(classData?.description ?? "");
    }
  }, [open, classData]);

  const handleSave = async () => {
    if (!name.trim() || !user) return;
    setSaving(true);
    try {
      const { data: instId } = await supabase.rpc("get_user_institution_id", { _user_id: user.id });
      if (!instId) {
        toast({ title: "Erro", description: "Instituição não encontrada", variant: "destructive" });
        return;
      }

      if (classData) {
        await supabase.from("classes").update({ name: name.trim(), description: description.trim() || null }).eq("id", classData.id);
      } else {
        await supabase.from("classes").insert({ name: name.trim(), description: description.trim() || null, institution_id: instId as string });
      }
      toast({ title: classData ? "Turma atualizada" : "Turma criada" });
      onOpenChange(false);
      onSaved();
    } catch {
      toast({ title: "Erro ao salvar", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{classData ? "Editar Turma" : "Nova Turma"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input placeholder="Nome da turma" value={name} onChange={(e) => setName(e.target.value)} />
          <Textarea placeholder="Descrição (opcional)" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving || !name.trim()}>{saving ? "Salvando..." : "Salvar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
