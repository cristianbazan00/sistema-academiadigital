import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  institution?: { id: string; name: string; slug: string; logo_url: string | null } | null;
  onSaved: () => void;
}

export function InstitutionDialog({ open, onOpenChange, institution, onSaved }: Props) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (institution) {
      setName(institution.name);
      setSlug(institution.slug);
      setLogoUrl(institution.logo_url ?? "");
    } else {
      setName("");
      setSlug("");
      setLogoUrl("");
    }
  }, [institution, open]);

  const handleNameChange = (v: string) => {
    setName(v);
    if (!institution) {
      setSlug(v.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""));
    }
  };

  const handleSave = async () => {
    if (!name.trim() || !slug.trim()) { toast.error("Nome e slug são obrigatórios"); return; }
    setSaving(true);
    const payload = { name: name.trim(), slug: slug.trim(), logo_url: logoUrl.trim() || null };

    const { error } = institution
      ? await supabase.from("institutions").update(payload).eq("id", institution.id)
      : await supabase.from("institutions").insert(payload);

    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(institution ? "Instituição atualizada" : "Instituição criada");
    onOpenChange(false);
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{institution ? "Editar Instituição" : "Nova Instituição"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Nome</Label>
            <Input value={name} onChange={(e) => handleNameChange(e.target.value)} placeholder="Nome da instituição" />
          </div>
          <div className="space-y-2">
            <Label>Slug</Label>
            <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="minha-instituicao" />
          </div>
          <div className="space-y-2">
            <Label>Logo URL (opcional)</Label>
            <Input value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://..." />
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
