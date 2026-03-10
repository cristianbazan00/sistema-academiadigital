import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2, GripVertical } from "lucide-react";

interface Question {
  id: string;
  question_text: string;
  options: string[] | null;
  correct_answer: string | null;
  sort_order: number;
}

interface Props {
  activityId: string;
  questions: Question[];
  onUpdated: () => void;
}

export function QuestionEditor({ activityId, questions, onUpdated }: Props) {
  const [adding, setAdding] = useState(false);
  const [text, setText] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correctIdx, setCorrectIdx] = useState(0);

  const handleAdd = async () => {
    if (!text.trim()) { toast.error("Texto da questão é obrigatório"); return; }
    const validOpts = options.filter((o) => o.trim());
    if (validOpts.length < 2) { toast.error("Adicione pelo menos 2 opções"); return; }

    setAdding(true);
    const { error } = await supabase.from("activity_questions").insert({
      activity_id: activityId,
      question_text: text.trim(),
      options: validOpts as any,
      correct_answer: validOpts[correctIdx] ?? validOpts[0],
      sort_order: questions.length,
    });
    setAdding(false);
    if (error) { toast.error(error.message); return; }
    setText(""); setOptions(["", "", "", ""]); setCorrectIdx(0);
    onUpdated();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("activity_questions").delete().eq("id", id);
    onUpdated();
  };

  return (
    <div className="space-y-3">
      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Questões ({questions.length})</Label>

      {questions.map((q, i) => (
        <Card key={q.id} className="bg-muted/30">
          <CardContent className="p-3 flex items-start gap-2">
            <GripVertical className="h-4 w-4 mt-1 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{i + 1}. {q.question_text}</p>
              {Array.isArray(q.options) && (
                <ul className="mt-1 space-y-0.5">
                  {(q.options as string[]).map((opt, oi) => (
                    <li key={oi} className={`text-xs ${opt === q.correct_answer ? "text-success font-medium" : "text-muted-foreground"}`}>
                      {opt === q.correct_answer ? "✓" : "○"} {opt}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <Button variant="ghost" size="icon" className="shrink-0" onClick={() => handleDelete(q.id)}>
              <Trash2 className="h-3.5 w-3.5 text-destructive" />
            </Button>
          </CardContent>
        </Card>
      ))}

      <Card className="border-dashed">
        <CardContent className="p-3 space-y-3">
          <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Texto da questão" />
          <div className="grid grid-cols-2 gap-2">
            {options.map((opt, i) => (
              <div key={i} className="flex items-center gap-1">
                <input
                  type="radio" name="correct" checked={correctIdx === i}
                  onChange={() => setCorrectIdx(i)}
                  className="accent-primary"
                />
                <Input
                  value={opt} onChange={(e) => { const c = [...options]; c[i] = e.target.value; setOptions(c); }}
                  placeholder={`Opção ${i + 1}`} className="text-sm h-8"
                />
              </div>
            ))}
          </div>
          <Button size="sm" onClick={handleAdd} disabled={adding}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Adicionar Questão
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
