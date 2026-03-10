import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { StepRenderer } from "@/components/student/StepRenderer";
import { ConfettiEffect } from "@/components/student/ConfettiEffect";
import { XpAnimation } from "@/components/student/XpAnimation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, CheckCircle } from "lucide-react";

interface Step {
  id: string;
  title: string;
  step_type: string;
  content_url: string | null;
  content_body: string | null;
  activity_id: string | null;
  sort_order: number;
}

const StudentLesson = () => {
  const { lessonId } = useParams<{ lessonId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [lessonTitle, setLessonTitle] = useState("");
  const [minScore, setMinScore] = useState(0);
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [completed, setCompleted] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [xpGained, setXpGained] = useState(0);
  const [showXp, setShowXp] = useState(false);

  useEffect(() => {
    if (!lessonId) return;

    const load = async () => {
      const { data: lesson } = await supabase
        .from("lessons")
        .select("title, min_score")
        .eq("id", lessonId)
        .single();

      if (lesson) {
        setLessonTitle(lesson.title);
        setMinScore(lesson.min_score ?? 0);
      }

      const { data: stepsData } = await supabase
        .from("lesson_steps")
        .select("id, title, step_type, content_url, content_body, activity_id, sort_order")
        .eq("lesson_id", lessonId)
        .order("sort_order");

      setSteps(stepsData || []);

      // Check if already completed
      if (user) {
        const { data: prog } = await supabase
          .from("lesson_progress")
          .select("completed")
          .eq("lesson_id", lessonId)
          .eq("user_id", user.id)
          .limit(1)
          .maybeSingle();

        if (prog?.completed) setCompleted(true);
      }

      setLoading(false);
    };

    load();
  }, [lessonId, user]);

  const completeLesson = async (quizScore?: number) => {
    if (!user || !lessonId || completed) return;

    const score = quizScore ?? 100;
    const xp = score === 100 ? 70 : 50; // bonus for perfect

    // Insert lesson_progress
    await supabase.from("lesson_progress").upsert({
      lesson_id: lessonId,
      user_id: user.id,
      completed: true,
      completed_at: new Date().toISOString(),
      score,
    }, { onConflict: "lesson_id,user_id" });

    // Insert XP log
    await supabase.from("user_xp_log").insert({
      user_id: user.id,
      xp_amount: xp,
      reason: `Aula concluída: ${lessonTitle}`,
      reference_id: lessonId,
    });

    // Update profile XP
    const { data: profile } = await supabase
      .from("profiles")
      .select("xp_total")
      .eq("id", user.id)
      .single();

    const newXp = (profile?.xp_total ?? 0) + xp;
    const newLevel = Math.floor(newXp / 200) + 1;

    await supabase
      .from("profiles")
      .update({ xp_total: newXp, level: newLevel })
      .eq("id", user.id);

    setCompleted(true);
    setXpGained(xp);
    setShowConfetti(true);
    setShowXp(true);
  };

  const handleQuizSubmit = async (answers: Record<string, string>, score: number, activityId: string) => {
    if (!user || !lessonId) return;

    // Save submission
    await supabase.from("submissions").insert({
      user_id: user.id,
      activity_id: activityId,
      lesson_id: lessonId,
      answers: answers as any,
      score,
    });

    if (score >= minScore) {
      await completeLesson(score);
    }
  };

  const isLastStep = currentStep === steps.length - 1;
  const hasQuiz = steps.some((s) => s.step_type === "quiz" || s.step_type === "behavioral_assessment");

  const handleNext = () => {
    if (isLastStep && !hasQuiz && !completed) {
      completeLesson();
    } else if (!isLastStep) {
      setCurrentStep((c) => c + 1);
    }
  };

  return (
    <DashboardLayout>
      <ConfettiEffect trigger={showConfetti} />
      <XpAnimation amount={xpGained} trigger={showXp} />

      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/student/trail")}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-display font-bold">{lessonTitle}</h1>
            <p className="text-sm text-muted-foreground">
              Passo {currentStep + 1} de {steps.length}
            </p>
          </div>
          {completed && <CheckCircle className="h-6 w-6 text-primary ml-auto" />}
        </div>

        {/* Stepper */}
        {steps.length > 1 && (
          <div className="flex gap-1">
            {steps.map((_, idx) => (
              <div
                key={idx}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  idx <= currentStep ? "bg-primary" : "bg-muted"
                }`}
              />
            ))}
          </div>
        )}

        {loading ? (
          <p className="text-muted-foreground">Carregando aula...</p>
        ) : steps.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground">Esta aula ainda não tem conteúdo.</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <StepRenderer
                step={steps[currentStep]}
                onQuizSubmit={handleQuizSubmit}
              />
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentStep((c) => Math.max(0, c - 1))}
            disabled={currentStep === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
          </Button>

          {isLastStep && completed ? (
            <Button onClick={() => navigate("/student/trail")}>
              Voltar à Trilha
            </Button>
          ) : isLastStep && !hasQuiz ? (
            <Button onClick={handleNext}>
              <CheckCircle className="h-4 w-4 mr-1" /> Concluir Aula
            </Button>
          ) : !isLastStep ? (
            <Button onClick={handleNext}>
              Próximo <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : null}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentLesson;
