import { useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { LessonSection } from "./LessonSection";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ChevronDown, Plus, Trash2, Layers } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type StepType = Database["public"]["Enums"]["lesson_step_type"];

interface Module { id: string; title: string; description: string | null; sort_order: number; }
interface Lesson { id: string; title: string; sort_order: number; description: string | null; min_score: number | null; module_id: string; }
interface Step {
  id: string; title: string; step_type: StepType; content_url: string | null;
  content_body: string | null; activity_id: string | null; sort_order: number; lesson_id: string;
}

interface Props {
  trailId: string;
  modules: Module[];
  lessons: Lesson[];
  steps: Step[];
  onUpdated: () => void;
}

export function ModuleSection({ trailId, modules, lessons, steps, onUpdated }: Props) {
  const [addingTitle, setAddingTitle] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  const handleAdd = async () => {
    if (!addingTitle.trim()) return;
    const { error } = await supabase.from("modules").insert({
      trail_id: trailId, title: addingTitle.trim(), sort_order: modules.length,
    });
    if (error) { toast.error(error.message); return; }
    setAddingTitle(""); setShowAdd(false);
    onUpdated();
  };

  const handleDelete = async (moduleId: string) => {
    const modLessons = lessons.filter((l) => l.module_id === moduleId);
    for (const l of modLessons) {
      await supabase.from("lesson_steps").delete().eq("lesson_id", l.id);
    }
    await supabase.from("lessons").delete().eq("module_id", moduleId);
    await supabase.from("modules").delete().eq("id", moduleId);
    onUpdated();
  };

  const stepsMap: Record<string, Step[]> = {};
  steps.forEach((s) => { (stepsMap[s.lesson_id] ??= []).push(s); });

  return (
    <div className="space-y-3">
      {modules.map((mod) => {
        const modLessons = lessons.filter((l) => l.module_id === mod.id).sort((a, b) => a.sort_order - b.sort_order);
        return (
          <Card key={mod.id}>
            <Collapsible defaultOpen>
              <CardContent className="p-0">
                <div className="flex items-center gap-3 p-4">
                  <CollapsibleTrigger className="flex items-center gap-2 flex-1 text-left">
                    <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform [[data-state=closed]>&]:-rotate-90" />
                    <Layers className="h-4 w-4 text-primary" />
                    <span className="font-medium">{mod.title}</span>
                    <span className="text-xs text-muted-foreground ml-2">{modLessons.length} aulas</span>
                  </CollapsibleTrigger>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(mod.id)}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
                <CollapsibleContent className="px-4 pb-4">
                  <LessonSection moduleId={mod.id} lessons={modLessons} stepsMap={stepsMap} onUpdated={onUpdated} />
                </CollapsibleContent>
              </CardContent>
            </Collapsible>
          </Card>
        );
      })}

      {showAdd ? (
        <div className="flex items-center gap-2">
          <Input value={addingTitle} onChange={(e) => setAddingTitle(e.target.value)} placeholder="Nome do módulo"
            onKeyDown={(e) => e.key === "Enter" && handleAdd()} />
          <Button onClick={handleAdd}>Salvar</Button>
          <Button variant="outline" onClick={() => setShowAdd(false)}>Cancelar</Button>
        </div>
      ) : (
        <Button variant="outline" className="w-full border-dashed" onClick={() => setShowAdd(true)}>
          <Plus className="h-4 w-4 mr-2" /> Adicionar Módulo
        </Button>
      )}
    </div>
  );
}
