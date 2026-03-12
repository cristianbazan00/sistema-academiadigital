import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { BookOpen, FileText, Layers } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Lesson {
  id: string;
  title: string;
  sort_order: number;
}

interface Module {
  id: string;
  title: string;
  sort_order: number;
  lessons: Lesson[];
}

interface TrailContent {
  className: string;
  trailTitle: string;
  modules: Module[];
}

export const TrailContentSection = () => {
  const { user } = useAuth();
  const [trails, setTrails] = useState<TrailContent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user) return;

      // Get facilitator's classes with trail_id
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

      const result: TrailContent[] = [];

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

          modulesWithLessons.push({ ...m, lessons: lessons ?? [] });
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

  if (loading) {
    return (
      <Card>
        <CardHeader><CardTitle>Conteúdo da Trilha</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (trails.length === 0) return null;

  return (
    <>
      {trails.map((t, idx) => (
        <Card key={idx}>
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
                {t.modules.map((m) => (
                  <AccordionItem key={m.id} value={m.id}>
                    <AccordionTrigger className="text-sm font-semibold">
                      <span className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-primary" />
                        {m.title}
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      {m.lessons.length === 0 ? (
                        <p className="text-sm text-muted-foreground pl-6">Nenhuma aula.</p>
                      ) : (
                        <ul className="space-y-1.5 pl-6">
                          {m.lessons.map((l) => (
                            <li key={l.id} className="flex items-center gap-2 text-sm">
                              <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                              {l.title}
                            </li>
                          ))}
                        </ul>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </CardContent>
        </Card>
      ))}
    </>
  );
};
