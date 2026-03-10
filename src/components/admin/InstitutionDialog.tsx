import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, UserCog } from "lucide-react";

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

  // Current admin info (edit mode)
  const [currentAdmin, setCurrentAdmin] = useState<{ id: string; full_name: string; email: string } | null>(null);
  const [loadingAdmin, setLoadingAdmin] = useState(false);

  useEffect(() => {
    if (institution) {
      setName(institution.name);
      setSlug(institution.slug);
      setLogoUrl(institution.logo_url ?? "");
      setAdminEmail("");
      setAdminName("");
      fetchCurrentAdmin(institution.id);
    } else {
      setName("");
      setSlug("");
      setLogoUrl("");
      setAdminEmail("");
      setAdminName("");
      setCurrentAdmin(null);
    }
  }, [institution, open]);

  const fetchCurrentAdmin = async (institutionId: string) => {
    setLoadingAdmin(true);
    try {
      // Find profiles with this institution_id that have admin_institution role
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .eq("institution_id", institutionId);

      if (profiles && profiles.length > 0) {
        // Check which one has admin_institution role
        for (const profile of profiles) {
          const { data: role } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", profile.id)
            .eq("role", "admin_institution")
            .maybeSingle();

          if (role) {
            // We can't read auth.users email from client, so we show name + id
            setCurrentAdmin({
              id: profile.id,
              full_name: profile.full_name,
              email: "", // Will be shown as "não disponível via client"
            });
            break;
          }
        }
      }
      if (!profiles || profiles.length === 0) {
        setCurrentAdmin(null);
      }
    } catch {
      setCurrentAdmin(null);
    }
    setLoadingAdmin(false);
  };

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
      if (error) {
        setSaving(false);
        toast.error(error.message);
        return;
      }

      // If new admin data provided, invoke edge function to change admin
      if (adminEmail.trim() && adminName.trim()) {
        const { data: fnData, error: fnError } = await supabase.functions.invoke(
          "create-institution-admin",
          {
            body: {
              institution_id: institution.id,
              admin_email: adminEmail.trim(),
              admin_name: adminName.trim(),
            },
          }
        );

        if (fnError) {
          toast.error(`Instituição atualizada, mas erro ao alterar admin: ${fnError.message}`);
        } else if (fnData?.error) {
          toast.error(`Instituição atualizada, mas erro ao alterar admin: ${fnData.error}`);
        } else {
          const msg = fnData?.is_existing
            ? "Instituição atualizada e usuário existente vinculado como admin"
            : "Instituição atualizada e novo admin criado (email de recuperação enviado)";
          toast.success(msg);
        }
      } else {
        toast.success("Instituição atualizada");
      }

      setSaving(false);
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

          {/* Admin section */}
          <div className="border-t pt-4 mt-2">
            <p className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
              <UserCog className="h-4 w-4" />
              Administrador da Instituição
            </p>
          </div>

          {/* Show current admin when editing */}
          {institution && (
            <div className="space-y-2">
              {loadingAdmin ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Carregando admin atual…
                </div>
              ) : currentAdmin ? (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Admin atual:</span>
                  <Badge variant="secondary">{currentAdmin.full_name || "Sem nome"}</Badge>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhum admin vinculado</p>
              )}
              <p className="text-xs text-muted-foreground">
                Preencha os campos abaixo para vincular/alterar o administrador
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label>{institution ? "Nome do Novo Admin (opcional)" : "Nome do Admin"}</Label>
            <Input value={adminName} onChange={(e) => setAdminName(e.target.value)} placeholder="Nome completo do administrador" />
          </div>
          <div className="space-y-2">
            <Label>{institution ? "Email do Novo Admin (opcional)" : "Email do Admin"}</Label>
            <Input type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} placeholder="admin@instituicao.com" />
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
