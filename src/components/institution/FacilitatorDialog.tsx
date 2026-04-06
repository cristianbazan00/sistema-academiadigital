import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { CpfInput } from "@/components/CpfInput";
import { isValidCpf } from "@/lib/cpf";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
  facilitator?: { id: string; full_name: string } | null;
}

export function FacilitatorDialog({ open, onOpenChange, onSaved, facilitator = null }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [cpf, setCpf] = useState("");
  const [saving, setSaving] = useState(false);

  const isEditing = !!facilitator;

  useEffect(() => {
    if (facilitator) {
      setFullName(facilitator.full_name);
      setEmail("");
      setCpf("");
    } else {
      setFullName("");
      setEmail("");
      setCpf("");
    }
  }, [facilitator, open]);

  const handleSave = async () => {
    if (!user) return;

    if (isEditing) {
      if (!fullName.trim()) return;
      setSaving(true);
      try {
        const response = await supabase.functions.invoke("activate-account", {
          body: {
            action: "update_facilitator",
            user_id: facilitator!.id,
            full_name: fullName.trim(),
          },
        });

        if (response.error || response.data?.error) {
          const msg = response.data?.error || String(response.error);
          toast({ title: "Erro ao atualizar facilitador", description: msg, variant: "destructive" });
        } else {
          toast({ title: "Facilitador atualizado com sucesso" });
          onOpenChange(false);
          onSaved();
        }
      } catch {
        toast({ title: "Erro inesperado", variant: "destructive" });
      } finally {
        setSaving(false);
      }
      return;
    }

    // Create mode
    if (!email.trim() || !fullName.trim() || !isValidCpf(cpf)) return;
    setSaving(true);
    try {
      const { data: instId } = await supabase.rpc("get_user_institution_id", { _user_id: user.id });
      if (!instId) {
        toast({ title: "Instituição não encontrada", variant: "destructive" });
        return;
      }

      const response = await supabase.functions.invoke("activate-account", {
        body: {
          action: "create_facilitator",
          email: email.trim(),
          full_name: fullName.trim(),
          cpf,
          institution_id: instId as string,
        },
      });

      if (response.error) {
        const msg = response.error?.context?.body ? (await response.error.context.json?.())?.error : String(response.error);
        toast({ title: "Erro ao criar facilitador", description: msg || "Erro desconhecido", variant: "destructive" });
      } else if (response.data?.error) {
        toast({ title: "Erro ao criar facilitador", description: response.data.error, variant: "destructive" });
      } else {
        toast({ title: "Facilitador cadastrado com sucesso" });
        setEmail("");
        setFullName("");
        setCpf("");
        onOpenChange(false);
        onSaved();
      }
    } catch {
      toast({ title: "Erro inesperado", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Facilitador" : "Cadastrar Facilitador"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Nome completo</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Nome do facilitador" />
          </div>
          {!isEditing && (
            <>
              <div>
                <Label>CPF</Label>
                <CpfInput value={cpf} onValueChange={setCpf} />
                {cpf.length === 11 && !isValidCpf(cpf) && (
                  <p className="text-sm text-destructive mt-1">CPF inválido</p>
                )}
              </div>
              <div>
                <Label>E-mail</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@exemplo.com" />
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button
            onClick={handleSave}
            disabled={saving || !fullName.trim() || (!isEditing && (!email.trim() || !isValidCpf(cpf)))}
          >
            {saving ? (isEditing ? "Salvando..." : "Cadastrando...") : (isEditing ? "Salvar" : "Cadastrar")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
