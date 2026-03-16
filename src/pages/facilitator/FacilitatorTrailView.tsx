import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, FileText, Video, FileQuestion, Layers, CheckCircle, ExternalLink } from "lucide-react";

interface Question {
  id: string;
  question_text: string;
  options: string[] | null;
  correct_answer: string | null;
  sort_order: number;
}

interface Step {
  id: string;
  title: string;
  step_type: string;
  content_url: string | null;
  content_body: string | null;
  activity_id: string | null;
  sort_order: number;
  questions?: Question[];
}

interface Lesson {
  id: string;
  title: string;
  sort_order: number;
  steps: Step[];
  stepsLoaded: boolean;
}

interface Module {
  id: string;
  title: string;
  sort_order: number;
  lessons: Lesson[];
}

interface TrailData {
  className: string;
  trailTitle: string;
  modules: Module[];
}

const stepTypeLabel: Record<string, string> = {
  video: "Vídeo",
  pdf: "PDF",
  quiz: "Quiz",
  behavioral_assessment: "Avaliação Comportamental",
  supplementary: "Material Complementar",
};

const stepTypeIcon: Record<string, React.ReactNode> = {
  video: <Video className="h-4 w-4" />,
  pdf: <FileText className="h-4 w-4" />,
  quiz: <FileQuestion className="h-4 w-4" />,
  behavioral_assessment: <FileQuestion className="h-4 w-4" />,
  supplementary: <BookOpen className="h-4 w-4" />,
};

export default function FacilitatorTrailView() {
  const { user } = useAuth();
  const [trails, setTrails] = useState<TrailData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user) return;

      const { data: memberships } = await supabase
        .from("class_members")
        .select("class_id")
        .eq("user_id", user.id)
        .eq("role", "facilitator");

      const classIds = (memberships ?? []).map((m) => m.class_id);
      if (classIds.length === 0) { setLoading(false); return; }

      const { data: classRows } = await supabase
        .from("classes")
        .select("id, name, trail_id")
        .in("id", classIds)
        .not("trail_id", "is", null);

      const result: TrailData[] = [];

      for (const c of classRows ?? []) {
        if (!c.trail_id) continue;

        const { data: trail } = await supabase
          .from("trails")
          .select("title")
          .eq("id", c.trail_id)
          .single();

        const { data: modules } = await supabase
          .from("modules")
          .select("id, title, sort_order")
          .eq("trail_id", c.trail_id)
          .order("sort_order");

        const modulesWithLessons: Module[] = [];
        for (const m of modules ?? []) {
          const { data: lessons } = await supabase
            .from("lessons")
            .select("id, title, sort_order")
            .eq("module_id", m.id)
            .order("sort_order");

          modulesWithLessons.push({
            ...m,
            lessons: (lessons ?? []).map((l) => ({ ...l, steps: [], stepsLoaded: false })),
          });
        }

        result.push({
          className: c.name,
          trailTitle: trail?.title ?? "Trilha",
          modules: modulesWithLessons,
        });
      }

      setTrails(result);
      setLoading(false);
    };

    load();
  }, [user]);

  const loadSteps = async (trailIdx: number, moduleIdx: number, lessonIdx: number) => {
    const lesson = trails[trailIdx].modules[moduleIdx].lessons[lessonIdx];
    if (lesson.stepsLoaded) return;

    const { data: steps } = await supabase
      .from("lesson_steps")
      .select("id, title, step_type, content_url, content_body, activity_id, sort_order")
      .eq("lesson_id", lesson.id)
      .order("sort_order");

    const stepsWithQuestions: Step[] = [];
    for (const s of steps ?? []) {
      let questions: Question[] = [];
      if (s.activity_id && (s.step_type === "quiz" || s.step_type === "behavioral_assessment")) {
        const { data: qs } = await supabase
          .from("activity_questions")
          .select("id, question_text, options, correct_answer, sort_order")
          .eq("activity_id", s.activity_id)
          .order("sort_order");
        questions = (qs ?? []).map((q) => ({
          ...q,
          options: Array.isArray(q.options) ? (q.options as string[]) : null,
        }));
      }
      stepsWithQuestions.push({ ...s, questions });
    }

    setTrails((prev) => {
      const updated = [...prev];
      const t = { ...updated[trailIdx] };
      const mods = [...t.modules];
      const mod = { ...mods[moduleIdx] };
      const lessons = [...mod.lessons];
      lessons[lessonIdx] = { ...lessons[lessonIdx], steps: stepsWithQuestions, stepsLoaded: true };
      mod.lessons = lessons;
      mods[moduleIdx] = mod;
      t.modules = mods;
      updated[trailIdx] = t;
      return updated;
    });
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-display font-bold mb-6">Conteúdo da Trilha</h1>

      {trails.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Nenhuma trilha vinculada às suas turmas.
          </CardContent>
        </Card>
      ) : (
        trails.map((t, tIdx) => (
          <Card key={tIdx} className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-primary" />
                {t.className} — {t.trailTitle}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {t.modules.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum módulo cadastrado.</p>
              ) : (
                <Accordion type="multiple" className="w-full">
                  {t.modules.map((m, mIdx) => (
                    <AccordionItem key={m.id} value={m.id}>
                      <AccordionTrigger className="text-sm font-semibold">
                        <span className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-primary" />
                          {m.title}
                        </span>
                      </AccordionTrigger>
                      <AccordionContent>
                        {m.lessons.length === 0 ? (
                          <p className="text-sm text-muted-foreground pl-4">Nenhuma aula.</p>
                        ) : (
                          <Accordion type="multiple" className="w-full pl-4">
                            {m.lessons.map((l, lIdx) => (
                              <AccordionItem key={l.id} value={l.id}>
                                <AccordionTrigger
                                  className="text-sm"
                                  onClick={() => loadSteps(tIdx, mIdx, lIdx)}
                                >
                                  <span className="flex items-center gap-2">
                                    <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                                    {l.title}
                                  </span>
                                </AccordionTrigger>
                                <AccordionContent>
                                  {!l.stepsLoaded ? (
                                    <div className="space-y-2 pl-4">
                                      <Skeleton className="h-6 w-full" />
                                      <Skeleton className="h-6 w-3/4" />
                                    </div>
                                  ) : l.steps.length === 0 ? (
                                    <p className="text-sm text-muted-foreground pl-4">Nenhum passo cadastrado.</p>
                                  ) : (
                                    <div className="space-y-4 pl-4">
                                      {l.steps.map((step) => (
                                        <StepCard key={step.id} step={step} />
                                      ))}
                                    </div>
                                  )}
                                </AccordionContent>
                              </AccordionItem>
                            ))}
                          </Accordion>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </DashboardLayout>
  );
}

function StepCard({ step }: { step: Step }) {
  return (
    <Card className="border-border/50">
      <CardHeader className="py-3 px-4">
        <div className="flex items-center gap-2">
          {stepTypeIcon[step.step_type] ?? <FileText className="h-4 w-4" />}
          <span className="font-medium text-sm">{step.title}</span>
          <Badge variant="secondary" className="text-xs ml-auto">
            {stepTypeLabel[step.step_type] ?? step.step_type}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-0 space-y-3">
        {/* Video */}
        {step.step_type === "video" && step.content_url && (
          <div className="aspect-video rounded-lg overflow-hidden bg-muted">
            <iframe
              src={step.content_url}
              className="w-full h-full"
              allowFullScreen
              title={step.title}
            />
          </div>
        )}

        {/* PDF */}
        {step.step_type === "pdf" && step.content_url && (
          <a
            href={step.content_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
          >
            <ExternalLink className="h-4 w-4" />
            Abrir PDF
          </a>
        )}

        {/* Content body (HTML) */}
        {step.content_body && (
          <div
            className="prose prose-sm max-w-none dark:prose-invert text-sm"
            dangerouslySetInnerHTML={{ __html: step.content_body }}
          />
        )}

        {/* URL for supplementary */}
        {step.step_type === "supplementary" && step.content_url && (
          <a
            href={step.content_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
          >
            <ExternalLink className="h-4 w-4" />
            Acessar material
          </a>
        )}

        {/* Quiz / Assessment questions (read-only) */}
        {(step.step_type === "quiz" || step.step_type === "behavioral_assessment") &&
          step.questions &&
          step.questions.length > 0 && (
            <div className="space-y-3">
              {step.questions.map((q, qIdx) => (
                <div key={q.id} className="rounded-lg border border-border p-3 space-y-2">
                  <p className="text-sm font-medium">
                    {qIdx + 1}. {q.question_text}
                  </p>
                  {q.options && q.options.length > 0 && (
                    <ul className="space-y-1 pl-2">
                      {q.options.map((opt, optIdx) => {
                        const isCorrect = q.correct_answer === opt;
                        return (
                          <li
                            key={optIdx}
                            className={`flex items-center gap-2 text-sm rounded px-2 py-1 ${
                              isCorrect
                                ? "bg-primary/10 text-primary font-medium"
                                : "text-muted-foreground"
                            }`}
                          >
                            {isCorrect && <CheckCircle className="h-3.5 w-3.5 text-primary" />}
                            <span>{opt}</span>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}
      </CardContent>
    </Card>
  );
}
