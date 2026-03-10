import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { QuizPlayer } from "./QuizPlayer";
import { FileText, Video, BookOpen } from "lucide-react";

interface Step {
  id: string;
  title: string;
  step_type: string;
  content_url: string | null;
  content_body: string | null;
  activity_id: string | null;
}

interface StepRendererProps {
  step: Step;
  onQuizSubmit: (answers: Record<string, string>, score: number, activityId: string) => void;
}

export function StepRenderer({ step, onQuizSubmit }: StepRendererProps) {
  const [questions, setQuestions] = useState<any[]>([]);

  useEffect(() => {
    if ((step.step_type === "quiz" || step.step_type === "behavioral_assessment") && step.activity_id) {
      supabase
        .from("activity_questions")
        .select("*")
        .eq("activity_id", step.activity_id)
        .order("sort_order")
        .then(({ data }) => setQuestions(data || []));
    }
  }, [step]);

  if (step.step_type === "video") {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-primary">
          <Video className="h-5 w-5" />
          <h3 className="font-display font-semibold">{step.title}</h3>
        </div>
        {step.content_url ? (
          <div className="aspect-video rounded-lg overflow-hidden bg-muted">
            <iframe
              src={step.content_url}
              className="w-full h-full"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">Vídeo não disponível.</p>
        )}
        {step.content_body && (
          <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: step.content_body }} />
        )}
      </div>
    );
  }

  if (step.step_type === "pdf") {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-primary">
          <FileText className="h-5 w-5" />
          <h3 className="font-display font-semibold">{step.title}</h3>
        </div>
        {step.content_url ? (
          <a
            href={step.content_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-primary underline text-sm"
          >
            <FileText className="h-4 w-4" /> Abrir PDF
          </a>
        ) : (
          <p className="text-muted-foreground text-sm">PDF não disponível.</p>
        )}
        {step.content_body && (
          <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: step.content_body }} />
        )}
      </div>
    );
  }

  if (step.step_type === "quiz" || step.step_type === "behavioral_assessment") {
    return (
      <div className="space-y-3">
        <h3 className="font-display font-semibold">{step.title}</h3>
        {questions.length > 0 ? (
          <QuizPlayer
            questions={questions}
            onSubmit={(answers, score) => onQuizSubmit(answers, score, step.activity_id!)}
          />
        ) : (
          <p className="text-muted-foreground text-sm">Carregando questões...</p>
        )}
      </div>
    );
  }

  // supplementary / default
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-primary">
        <BookOpen className="h-5 w-5" />
        <h3 className="font-display font-semibold">{step.title}</h3>
      </div>
      {step.content_body && (
        <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: step.content_body }} />
      )}
      {step.content_url && (
        <a href={step.content_url} target="_blank" rel="noopener noreferrer" className="text-primary underline text-sm">
          Ver material
        </a>
      )}
    </div>
  );
}
