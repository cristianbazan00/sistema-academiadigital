import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classData?: { id: string; name: string; description: string | null; trail_id?: string | null } | null;
  onSaved: () => void;
}

interface Trail {
  id: string;
  title: string;
}

export function ClassDialog({ open, onOpenChange, classData, onSaved }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [trailId, setTrailId] = useState<string | null>(null);
  const [trails, setTrails] = useState<Trail[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName(classData?.name ?? "");
      setDescription(classData?.description ?? "");
      setTrailId(classData?.trail_id ?? null);
      fetchTrails();
    }
  }, [open, classData]);

  const fetchTrails = async () => {
    const { data } = await supabase
      .from("trails")
      .select("id, title")
      .eq("is_published", true)
      .order("title");
    setTrails(data ?? []);
  };

  const handleSave = async () => {
    if (!name.trim() || !user) return;
    setSaving(true);
    try {
      const { data: instId } = await supabase.rpc("get_user_institution_id", { _user_id: user.id });
      if (!instId) {
        toast({ title: "Erro", description: "Instituição não encontrada", variant: "destructive" });
        return;
      }

      const payload = {
        name: name.trim(),
        description: description.trim() || null,
        trail_id: trailId || null,
      };

      if (classData) {
        await supabase.from("classes").update(payload).eq("id", classData.id);
      } else {
        await supabase.from("classes").insert({ ...payload, institution_id: instId as string });
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
          <div className="space-y-2">
            <Label>Nome da turma</Label>
            <Input placeholder="Nome da turma" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Descrição (opcional)</Label>
            <Textarea placeholder="Descrição" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Trilha de aprendizagem</Label>
            <Select value={trailId ?? "none"} onValueChange={(v) => setTrailId(v === "none" ? null : v)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma trilha" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhuma trilha</SelectItem>
                {trails.map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving || !name.trim()}>{saving ? "Salvando..." : "Salvar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
