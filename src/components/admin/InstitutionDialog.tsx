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
  const [adminEmail, setAdminEmail] = useState("");
  const [adminName, setAdminName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (institution) {
      setName(institution.name);
      setSlug(institution.slug);
      setLogoUrl(institution.logo_url ?? "");
      setAdminEmail("");
      setAdminName("");
    } else {
      setName("");
      setSlug("");
      setLogoUrl("");
      setAdminEmail("");
      setAdminName("");
    }
  }, [institution, open]);

  const handleNameChange = (v: string) => {
    setName(v);
    if (!institution) {
      setSlug(v.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""));
    }
  };

  const handleSave = async () => {
    if (!name.trim() || !slug.trim()) {
      toast.error("Nome e slug são obrigatórios");
      return;
    }

    if (!institution && (!adminEmail.trim() || !adminName.trim())) {
      toast.error("Email e nome do administrador são obrigatórios para novas instituições");
      return;
    }

    setSaving(true);
    const payload = { name: name.trim(), slug: slug.trim(), logo_url: logoUrl.trim() || null };

    if (institution) {
      const { error } = await supabase.from("institutions").update(payload).eq("id", institution.id);
      setSaving(false);
      if (error) { toast.error(error.message); return; }
      toast.success("Instituição atualizada");
    } else {
      // Create institution
      const { data: newInst, error } = await supabase
        .from("institutions")
        .insert(payload)
        .select("id")
        .single();

      if (error || !newInst) {
        setSaving(false);
        toast.error(error?.message || "Erro ao criar instituição");
        return;
      }

      // Create admin user via edge function
      const { data: session } = await supabase.auth.getSession();
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        "create-institution-admin",
        {
          body: {
            institution_id: newInst.id,
            admin_email: adminEmail.trim(),
            admin_name: adminName.trim(),
          },
        }
      );

      setSaving(false);

      if (fnError) {
        toast.error(`Instituição criada, mas erro ao criar admin: ${fnError.message}`);
      } else if (fnData?.error) {
        toast.error(`Instituição criada, mas erro ao criar admin: ${fnData.error}`);
      } else {
        const msg = fnData?.is_existing
          ? "Instituição criada e usuário existente vinculado como admin"
          : "Instituição criada e admin criado (email de recuperação enviado)";
        toast.success(msg);
      }
    }

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

          {!institution && (
            <>
              <div className="border-t pt-4 mt-2">
                <p className="text-sm font-medium text-muted-foreground mb-3">Administrador da Instituição</p>
              </div>
              <div className="space-y-2">
                <Label>Nome do Admin</Label>
                <Input value={adminName} onChange={(e) => setAdminName(e.target.value)} placeholder="Nome completo do administrador" />
              </div>
              <div className="space-y-2">
                <Label>Email do Admin</Label>
                <Input type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} placeholder="admin@instituicao.com" />
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? "Salvando…" : "Salvar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
