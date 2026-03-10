import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle } from "lucide-react";

interface Question {
  id: string;
  question_text: string;
  options: string[] | null;
  correct_answer: string | null;
  sort_order: number;
}

interface QuizPlayerProps {
  questions: Question[];
  onSubmit: (answers: Record<string, string>, score: number) => void;
}

export function QuizPlayer({ questions, onSubmit }: QuizPlayerProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  const sorted = [...questions].sort((a, b) => a.sort_order - b.sort_order);

  const handleSubmit = () => {
    let correct = 0;
    sorted.forEach((q) => {
      if (q.correct_answer && answers[q.id] === q.correct_answer) correct++;
    });
    const total = sorted.filter((q) => q.correct_answer).length;
    const pct = total > 0 ? Math.round((correct / total) * 100) : 100;
    setScore(pct);
    setSubmitted(true);
    onSubmit(answers, pct);
  };

  const allAnswered = sorted.every((q) => answers[q.id]);

  return (
    <div className="space-y-4">
      {sorted.map((q, idx) => {
        const opts = Array.isArray(q.options) ? (q.options as string[]) : [];
        const isCorrect = submitted && q.correct_answer === answers[q.id];
        const isWrong = submitted && q.correct_answer && q.correct_answer !== answers[q.id];

        return (
          <Card key={q.id} className={submitted ? (isCorrect ? "border-green-500/50" : isWrong ? "border-destructive/50" : "") : ""}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                {idx + 1}. {q.question_text}
                {submitted && isCorrect && <CheckCircle className="h-4 w-4 text-green-500" />}
                {submitted && isWrong && <XCircle className="h-4 w-4 text-destructive" />}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={answers[q.id] || ""}
                onValueChange={(v) => !submitted && setAnswers({ ...answers, [q.id]: v })}
                disabled={submitted}
              >
                {opts.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <RadioGroupItem value={opt} id={`${q.id}-${i}`} />
                    <Label htmlFor={`${q.id}-${i}`} className="text-sm cursor-pointer">{opt}</Label>
                  </div>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>
        );
      })}

      {!submitted ? (
        <Button onClick={handleSubmit} disabled={!allAnswered} className="w-full">
          Enviar Respostas
        </Button>
      ) : (
        <div className="text-center p-4 rounded-lg bg-muted">
          <p className="font-display font-bold text-lg">Resultado: {score}%</p>
          <p className="text-sm text-muted-foreground">
            {score >= 70 ? "Parabéns! Você foi aprovado! 🎉" : "Tente novamente para melhorar sua nota."}
          </p>
        </div>
      )}
    </div>
  );
}
