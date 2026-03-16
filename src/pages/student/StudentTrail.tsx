import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Lock, PlayCircle, BookOpen, CalendarClock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Lesson {
  id: string;
  title: string;
  sort_order: number;
  completed: boolean;
}

interface Module {
  id: string;
  title: string;
  description: string | null;
  sort_order: number;
  lessons: Lesson[];
}

const StudentTrail = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [trailTitle, setTrailTitle] = useState("");
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [scheduleDates, setScheduleDates] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      // Find student's trail via class_members → classes → trail_id
      const { data: memberships } = await supabase
        .from("class_members")
        .select("class_id")
        .eq("user_id", user.id)
        .eq("role", "student");

      if (!memberships?.length) { setLoading(false); return; }

      const classIds = memberships.map((m) => m.class_id);
      const { data: classes } = await supabase
        .from("classes")
        .select("id, trail_id")
        .in("id", classIds)
        .not("trail_id", "is", null)
        .limit(1);

      const trailId = classes?.[0]?.trail_id;
      const studentClassId = classes?.[0]?.id;
      if (!trailId) { setLoading(false); return; }

      // Fetch lesson schedules for this class
      if (studentClassId) {
        const { data: scheds } = await supabase
          .from("class_lesson_schedules" as any)
          .select("lesson_id, release_date")
          .eq("class_id", studentClassId);
        const map = new Map<string, string>();
        (scheds ?? []).forEach((s: any) => map.set(s.lesson_id, s.release_date));
        setScheduleDates(map);
      }

      // Fetch trail info
      const { data: trail } = await supabase.from("trails").select("title").eq("id", trailId).single();
      if (trail) setTrailTitle(trail.title);

      // Fetch modules + lessons
      const { data: mods } = await supabase
        .from("modules")
        .select("id, title, description, sort_order")
        .eq("trail_id", trailId)
        .order("sort_order");

      if (!mods?.length) { setLoading(false); return; }

      const { data: lessons } = await supabase
        .from("lessons")
        .select("id, title, sort_order, module_id")
        .in("module_id", mods.map((m) => m.id))
        .order("sort_order");

      const { data: progress } = await supabase
        .from("lesson_progress")
        .select("lesson_id")
        .eq("user_id", user.id)
        .eq("completed", true);

      const completedIds = new Set(progress?.map((p) => p.lesson_id) || []);

      const result: Module[] = mods
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((m) => ({
          ...m,
          lessons: (lessons || [])
            .filter((l: any) => l.module_id === m.id)
            .sort((a: any, b: any) => a.sort_order - b.sort_order)
            .map((l: any) => ({
              id: l.id,
              title: l.title,
              sort_order: l.sort_order,
              completed: completedIds.has(l.id),
            })),
        }));

      setModules(result);
      setLoading(false);
    };

    load();
  }, [user]);

  const isLessonScheduled = (lessonId: string): string | null => {
    const rd = scheduleDates.get(lessonId);
    if (!rd) return null;
    const today = new Date().toISOString().slice(0, 10);
    return rd > today ? rd : null; // null means released
  };

  const isLessonAvailable = (mod: Module, lessonIdx: number) => {
    const lesson = mod.lessons[lessonIdx];
    // Check schedule first
    if (isLessonScheduled(lesson.id)) return false;
    if (lessonIdx === 0) return true;
    return mod.lessons[lessonIdx - 1]?.completed;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold">Minha Trilha</h1>
          {trailTitle && <p className="text-muted-foreground mt-1">{trailTitle}</p>}
        </div>

        {loading ? (
          <p className="text-muted-foreground">Carregando trilha...</p>
        ) : modules.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground">Nenhuma trilha atribuída à sua turma ainda.</p>
            </CardContent>
          </Card>
        ) : (
          <Accordion type="multiple" className="space-y-3">
            {modules.map((mod) => {
              const completed = mod.lessons.filter((l) => l.completed).length;
              const total = mod.lessons.length;

              return (
                <AccordionItem key={mod.id} value={mod.id} className="border rounded-lg px-4">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3">
                      <BookOpen className="h-5 w-5 text-primary" />
                      <div className="text-left">
                        <span className="font-display font-semibold">{mod.title}</span>
                        <Badge variant="secondary" className="ml-2">
                          {completed}/{total}
                        </Badge>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 pb-2">
                      {mod.description && (
                        <p className="text-sm text-muted-foreground mb-3">{mod.description}</p>
                      )}
                      {mod.lessons.map((lesson, idx) => {
                        const available = isLessonAvailable(mod, idx);
                        return (
                          <button
                            key={lesson.id}
                            disabled={!available}
                            onClick={() => navigate(`/student/lesson/${lesson.id}`)}
                            className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                              lesson.completed
                                ? "bg-primary/10 text-primary"
                                : available
                                ? "hover:bg-muted cursor-pointer"
                                : "opacity-50 cursor-not-allowed"
                            }`}
                          >
                            {lesson.completed ? (
                              <CheckCircle className="h-5 w-5 text-primary shrink-0" />
                            ) : available ? (
                              <PlayCircle className="h-5 w-5 text-muted-foreground shrink-0" />
                            ) : (
                              <Lock className="h-5 w-5 text-muted-foreground shrink-0" />
                            )}
                            <span className="text-sm font-medium">{lesson.title}</span>
                          </button>
                        );
                      })}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}
      </div>
    </DashboardLayout>
  );
};

export default StudentTrail;
