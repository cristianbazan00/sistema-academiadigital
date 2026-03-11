import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Plus, X } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  facilitatorId: string | null;
  facilitatorName: string;
  onSaved: () => void;
}

interface ClassInfo {
  id: string;
  name: string;
}

export function ManageFacilitatorClassesDialog({ open, onOpenChange, facilitatorId, facilitatorName, onSaved }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [assignedClasses, setAssignedClasses] = useState<ClassInfo[]>([]);
  const [allClasses, setAllClasses] = useState<ClassInfo[]>([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    if (!user || !facilitatorId) return;
    const { data: instId } = await supabase.rpc("get_user_institution_id", { _user_id: user.id });
    if (!instId) return;

    // All institution classes
    const { data: classes } = await supabase
      .from("classes")
      .select("id, name")
      .eq("institution_id", instId as string)
      .order("name");

    setAllClasses(classes ?? []);

    // Facilitator's assigned classes
    const { data: members } = await supabase
      .from("class_members")
      .select("class_id, classes(id, name)")
      .eq("user_id", facilitatorId)
      .eq("role", "facilitator");

    const assigned = (members ?? [])
      .map((m: any) => m.classes)
      .filter(Boolean) as ClassInfo[];

    setAssignedClasses(assigned);
  };

  useEffect(() => {
    if (open) {
      fetchData();
      setSelectedClassId("");
    }
  }, [open, facilitatorId]);

  const availableClasses = allClasses.filter(
    (c) => !assignedClasses.some((a) => a.id === c.id)
  );

  const handleAdd = async () => {
    if (!facilitatorId || !selectedClassId) return;
    setLoading(true);
    const { error } = await supabase.from("class_members").insert({
      class_id: selectedClassId,
      user_id: facilitatorId,
      role: "facilitator" as const,
    });
    setLoading(false);
    if (error) {
      toast({ title: "Erro ao adicionar turma", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Turma adicionada" });
      setSelectedClassId("");
      await fetchData();
      onSaved();
    }
  };

  const handleRemove = async (classId: string) => {
    if (!facilitatorId) return;
    setLoading(true);
    const { error } = await supabase
      .from("class_members")
      .delete()
      .eq("class_id", classId)
      .eq("user_id", facilitatorId)
      .eq("role", "facilitator");
    setLoading(false);
    if (error) {
      toast({ title: "Erro ao remover turma", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Turma removida" });
      await fetchData();
      onSaved();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Gerenciar Turmas</DialogTitle>
          <DialogDescription>Turmas atribuídas a {facilitatorName}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {assignedClasses.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma turma atribuída.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {assignedClasses.map((c) => (
                <Badge key={c.id} variant="secondary" className="gap-1 pr-1">
                  {c.name}
                  <button
                    onClick={() => handleRemove(c.id)}
                    disabled={loading}
                    className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          {availableClasses.length > 0 && (
            <div className="flex items-center gap-2">
              <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Selecionar turma" />
                </SelectTrigger>
                <SelectContent>
                  {availableClasses.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button size="sm" onClick={handleAdd} disabled={!selectedClassId || loading}>
                <Plus className="h-4 w-4 mr-1" /> Adicionar
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
