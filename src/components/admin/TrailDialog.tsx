import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trail?: { id: string; title: string; description: string | null; cover_image_url: string | null } | null;
  onSaved: () => void;
}

export function TrailDialog({ open, onOpenChange, trail, onSaved }: Props) {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (trail) {
      setTitle(trail.title);
      setDescription(trail.description ?? "");
      setCoverUrl(trail.cover_image_url ?? "");
    } else {
      setTitle(""); setDescription(""); setCoverUrl("");
    }
  }, [trail, open]);

  const handleSave = async () => {
    if (!title.trim()) { toast.error("Título é obrigatório"); return; }
    setSaving(true);
    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      cover_image_url: coverUrl.trim() || null,
    };

    const { error } = trail
      ? await supabase.from("trails").update(payload).eq("id", trail.id)
      : await supabase.from("trails").insert({ ...payload, created_by: user?.id });

    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(trail ? "Trilha atualizada" : "Trilha criada");
    onOpenChange(false);
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{trail ? "Editar Trilha" : "Nova Trilha"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Título</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título da trilha" />
          </div>
          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descrição da trilha" />
          </div>
          <div className="space-y-2">
            <Label>Imagem de capa (URL)</Label>
            <Input value={coverUrl} onChange={(e) => setCoverUrl(e.target.value)} placeholder="https://..." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? "Salvando…" : "Salvar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
