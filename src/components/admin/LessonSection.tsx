import { useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StepEditor } from "./StepEditor";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ChevronRight, Plus, Trash2, BookOpen, Pencil, Check, X } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type StepType = Database["public"]["Enums"]["lesson_step_type"];

interface Lesson {
  id: string; title: string; sort_order: number; description: string | null; min_score: number | null;
}

interface Step {
  id: string; title: string; step_type: StepType; content_url: string | null;
  content_body: string | null; activity_id: string | null; sort_order: number;
}

interface Props {
  moduleId: string;
  lessons: Lesson[];
  stepsMap: Record<string, Step[]>;
  onUpdated: () => void;
}

export function LessonSection({ moduleId, lessons, stepsMap, onUpdated }: Props) {
  const [addingTitle, setAddingTitle] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const handleAdd = async () => {
    if (!addingTitle.trim()) return;
    const { error } = await supabase.from("lessons").insert({
      module_id: moduleId, title: addingTitle.trim(), sort_order: lessons.length,
    });
    if (error) { toast.error(error.message); return; }
    setAddingTitle(""); setShowAdd(false);
    onUpdated();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("lesson_steps").delete().eq("lesson_id", id);
    await supabase.from("lessons").delete().eq("id", id);
    onUpdated();
  };

  const startEdit = (lesson: Lesson) => {
    setEditingId(lesson.id);
    setEditTitle(lesson.title);
  };

  const handleSaveTitle = async (id: string) => {
    if (!editTitle.trim()) { toast.error("Título é obrigatório"); return; }
    const { error } = await supabase.from("lessons").update({ title: editTitle.trim() }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    setEditingId(null);
    onUpdated();
  };

  return (
    <div className="space-y-2">
      {lessons.map((lesson) => (
        <Collapsible key={lesson.id}>
          <div className="flex items-center gap-2 rounded-md hover:bg-muted/50 px-2 py-1.5">
            {editingId === lesson.id ? (
              <div className="flex items-center gap-2 flex-1">
                <BookOpen className="h-3.5 w-3.5 text-primary shrink-0" />
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="h-7 text-sm flex-1"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveTitle(lesson.id);
                    if (e.key === "Escape") setEditingId(null);
                  }}
                />
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleSaveTitle(lesson.id)}>
                  <Check className="h-3 w-3 text-primary" />
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setEditingId(null)}>
                  <X className="h-3 w-3 text-muted-foreground" />
                </Button>
              </div>
            ) : (
              <>
                <CollapsibleTrigger className="flex items-center gap-2 flex-1 text-left">
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground transition-transform [[data-state=open]>&]:rotate-90" />
                  <BookOpen className="h-3.5 w-3.5 text-primary" />
                  <span className="text-sm font-medium">{lesson.title}</span>
                  <span className="text-xs text-muted-foreground ml-auto">{(stepsMap[lesson.id] ?? []).length} passos</span>
                </CollapsibleTrigger>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => startEdit(lesson)}>
                  <Pencil className="h-3 w-3 text-muted-foreground" />
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDelete(lesson.id)}>
                  <Trash2 className="h-3 w-3 text-destructive" />
                </Button>
              </>
            )}
          </div>
          <CollapsibleContent className="pl-6 pt-1 pb-2">
            <StepEditor lessonId={lesson.id} steps={stepsMap[lesson.id] ?? []} onUpdated={onUpdated} />
          </CollapsibleContent>
        </Collapsible>
      ))}

      {showAdd ? (
        <div className="flex items-center gap-2 pl-6">
          <Input value={addingTitle} onChange={(e) => setAddingTitle(e.target.value)} placeholder="Nome da aula" className="h-8 text-sm flex-1"
            onKeyDown={(e) => e.key === "Enter" && handleAdd()} />
          <Button size="sm" onClick={handleAdd} className="h-8">Salvar</Button>
          <Button size="sm" variant="ghost" onClick={() => setShowAdd(false)} className="h-8">Cancelar</Button>
        </div>
      ) : (
        <Button variant="ghost" size="sm" className="text-xs ml-6" onClick={() => setShowAdd(true)}>
          <Plus className="h-3 w-3 mr-1" /> Aula
        </Button>
      )}
    </div>
  );
}
