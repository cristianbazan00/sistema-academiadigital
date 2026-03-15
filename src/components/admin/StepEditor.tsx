import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { QuestionEditor } from "./QuestionEditor";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2, Video, FileText, HelpCircle, Brain, Paperclip, Pencil, Check, X, ChevronDown } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type StepType = Database["public"]["Enums"]["lesson_step_type"];

interface Step {
  id: string; title: string; step_type: StepType; content_url: string | null;
  content_body: string | null; activity_id: string | null; sort_order: number;
}

interface Question {
  id: string; question_text: string; options: any; correct_answer: string | null; sort_order: number;
}

const stepIcons: Record<StepType, React.ReactNode> = {
  video: <Video className="h-4 w-4" />,
  pdf: <FileText className="h-4 w-4" />,
  quiz: <HelpCircle className="h-4 w-4" />,
  behavioral_assessment: <Brain className="h-4 w-4" />,
  supplementary: <Paperclip className="h-4 w-4" />,
};

const stepLabels: Record<StepType, string> = {
  video: "Vídeo", pdf: "PDF", quiz: "Quiz",
  behavioral_assessment: "Avaliação Comportamental", supplementary: "Material Complementar",
};

interface Props {
  lessonId: string;
  steps: Step[];
  onUpdated: () => void;
}

export function StepEditor({ lessonId, steps, onUpdated }: Props) {
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [stepType, setStepType] = useState<StepType>("video");
  const [contentUrl, setContentUrl] = useState("");
  const [contentBody, setContentBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [questionsMap, setQuestionsMap] = useState<Record<string, Question[]>>({});

  // Editing state
  const [editingStepId, setEditingStepId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContentUrl, setEditContentUrl] = useState("");
  const [editContentBody, setEditContentBody] = useState("");

  useEffect(() => {
    const activityIds = steps.filter((s) => s.activity_id).map((s) => s.activity_id!);
    if (activityIds.length === 0) { setQuestionsMap({}); return; }
    supabase.from("activity_questions").select("*").in("activity_id", activityIds).order("sort_order").then(({ data }) => {
      const map: Record<string, Question[]> = {};
      data?.forEach((q) => { (map[q.activity_id] ??= []).push(q); });
      setQuestionsMap(map);
    });
  }, [steps]);

  const handleAdd = async () => {
    if (!title.trim()) { toast.error("Título do passo é obrigatório"); return; }
    setSaving(true);

    let activityId: string | null = null;
    if (stepType === "quiz" || stepType === "behavioral_assessment") {
      const actType = stepType === "quiz" ? "multiple_choice" : "behavioral_scale";
      const { data, error } = await supabase.from("activities").insert({ title: title.trim(), activity_type: actType }).select("id").single();
      if (error || !data) { toast.error("Erro ao criar atividade"); setSaving(false); return; }
      activityId = data.id;
    }

    const { error } = await supabase.from("lesson_steps").insert({
      lesson_id: lessonId,
      title: title.trim(),
      step_type: stepType,
      content_url: contentUrl.trim() || null,
      content_body: contentBody.trim() || null,
      activity_id: activityId,
      sort_order: steps.length,
    });

    setSaving(false);
    if (error) { toast.error(error.message); return; }
    setAdding(false); setTitle(""); setContentUrl(""); setContentBody("");
    onUpdated();
  };

  const handleDelete = async (step: Step) => {
    await supabase.from("lesson_steps").delete().eq("id", step.id);
    if (step.activity_id) {
      await supabase.from("activity_questions").delete().eq("activity_id", step.activity_id);
      await supabase.from("activities").delete().eq("id", step.activity_id);
    }
    onUpdated();
  };

  const startEdit = (step: Step) => {
    setEditingStepId(step.id);
    setEditTitle(step.title);
    setEditContentUrl(step.content_url ?? "");
    setEditContentBody(step.content_body ?? "");
  };

  const handleSaveEdit = async (stepId: string) => {
    if (!editTitle.trim()) { toast.error("Título é obrigatório"); return; }
    const { error } = await supabase.from("lesson_steps").update({
      title: editTitle.trim(),
      content_url: editContentUrl.trim() || null,
      content_body: editContentBody.trim() || null,
    }).eq("id", stepId);
    if (error) { toast.error(error.message); return; }
    setEditingStepId(null);
    onUpdated();
  };

  const loadQuestions = () => {
    onUpdated();
  };

  return (
    <div className="space-y-2 pl-4 border-l-2 border-border">
      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Passos ({steps.length})</Label>

      {steps.map((step) => (
        <Card key={step.id} className="bg-muted/20">
          <CardContent className="p-3">
            {editingStepId === step.id ? (
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs">Título</Label>
                  <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="h-8 text-sm" autoFocus />
                </div>
                {(step.step_type === "video" || step.step_type === "pdf") && (
                  <div className="space-y-1">
                    <Label className="text-xs">URL do conteúdo</Label>
                    <Input value={editContentUrl} onChange={(e) => setEditContentUrl(e.target.value)} placeholder="https://..." className="h-8 text-sm" />
                  </div>
                )}
                {(step.step_type === "supplementary" || step.step_type === "video" || step.step_type === "pdf") && (
                  <div className="space-y-1">
                    <Label className="text-xs">Conteúdo</Label>
                    <Textarea value={editContentBody} onChange={(e) => setEditContentBody(e.target.value)} className="text-sm font-mono" rows={8} />
                  </div>
                )}
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleSaveEdit(step.id)}>
                    <Check className="h-3.5 w-3.5 mr-1" /> Salvar
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setEditingStepId(null)}>
                    <X className="h-3.5 w-3.5 mr-1" /> Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  {stepIcons[step.step_type]}
                  <span className="text-sm font-medium flex-1">{step.title}</span>
                  <StepBadge stepType={step.step_type} />
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEdit(step)}>
                    <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(step)}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
                {step.content_url && (
                  <p className="text-xs text-muted-foreground mt-1 break-all">{step.content_url}</p>
                )}
                {step.content_body && (
                  <Collapsible>
                    <CollapsibleTrigger className="flex items-center gap-1 text-xs text-primary mt-2 hover:underline">
                      <ChevronDown className="h-3 w-3" /> Ver conteúdo
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div
                        className="mt-2 p-3 bg-background rounded border text-sm prose prose-sm max-w-none dark:prose-invert"
                        dangerouslySetInnerHTML={{ __html: step.content_body }}
                      />
                    </CollapsibleContent>
                  </Collapsible>
                )}
              </>
            )}
            {step.activity_id && editingStepId !== step.id && (
              <div className="mt-2">
                <QuestionEditor activityId={step.activity_id} questions={questionsMap[step.activity_id] ?? []} onUpdated={loadQuestions} />
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {adding ? (
        <Card className="border-dashed border-primary/40">
          <CardContent className="p-3 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Título</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título do passo" className="h-8 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Tipo</Label>
                <Select value={stepType} onValueChange={(v) => setStepType(v as StepType)}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(stepLabels) as StepType[]).map((t) => (
                      <SelectItem key={t} value={t}>{stepLabels[t]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {(stepType === "video" || stepType === "pdf") && (
              <div className="space-y-1">
                <Label className="text-xs">URL do conteúdo</Label>
                <Input value={contentUrl} onChange={(e) => setContentUrl(e.target.value)} placeholder="https://..." className="h-8 text-sm" />
              </div>
            )}
            {stepType === "supplementary" && (
              <div className="space-y-1">
                <Label className="text-xs">Conteúdo</Label>
                <Textarea value={contentBody} onChange={(e) => setContentBody(e.target.value)} placeholder="Texto do material complementar" className="text-sm" rows={3} />
              </div>
            )}
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAdd} disabled={saving}>{saving ? "Salvando…" : "Salvar Passo"}</Button>
              <Button size="sm" variant="outline" onClick={() => setAdding(false)}>Cancelar</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Button variant="outline" size="sm" className="w-full border-dashed" onClick={() => setAdding(true)}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Adicionar Passo
        </Button>
      )}
    </div>
  );
}

function StepBadge({ stepType }: { stepType: StepType }) {
  return (
    <span className="text-[10px] font-medium bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded">
      {stepLabels[stepType]}
    </span>
  );
}
