import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ModuleSection } from "@/components/admin/ModuleSection";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft } from "lucide-react";

interface Trail { id: string; title: string; description: string | null; is_published: boolean; }
interface Module { id: string; title: string; description: string | null; sort_order: number; }
interface Lesson { id: string; title: string; sort_order: number; description: string | null; min_score: number | null; module_id: string; }
interface Step {
  id: string; title: string; step_type: any; content_url: string | null;
  content_body: string | null; activity_id: string | null; sort_order: number; lesson_id: string;
}

const AdminTrailEditor = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [trail, setTrail] = useState<Trail | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [steps, setSteps] = useState<Step[]>([]);

  const load = useCallback(async () => {
    if (!id) return;
    const [tRes, mRes, lRes, sRes] = await Promise.all([
      supabase.from("trails").select("id, title, description, is_published").eq("id", id).single(),
      supabase.from("modules").select("*").eq("trail_id", id).order("sort_order"),
      supabase.from("lessons").select("*").order("sort_order"),
      supabase.from("lesson_steps").select("*").order("sort_order"),
    ]);
    if (tRes.data) setTrail(tRes.data);
    const mods = mRes.data ?? [];
    setModules(mods);
    const modIds = mods.map((m) => m.id);
    const filteredLessons = (lRes.data ?? []).filter((l) => modIds.includes(l.module_id));
    setLessons(filteredLessons);
    const lessonIds = filteredLessons.map((l) => l.id);
    setSteps((sRes.data ?? []).filter((s) => lessonIds.includes(s.lesson_id)));
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (!trail) return <DashboardLayout><p className="text-muted-foreground">Carregando…</p></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin/trails")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-display font-bold">{trail.title}</h1>
              <Badge variant={trail.is_published ? "default" : "secondary"}>
                {trail.is_published ? "Publicada" : "Rascunho"}
              </Badge>
            </div>
            {trail.description && <p className="text-muted-foreground text-sm mt-1">{trail.description}</p>}
          </div>
        </div>

        <ModuleSection trailId={trail.id} modules={modules} lessons={lessons} steps={steps} onUpdated={load} />
      </div>
    </DashboardLayout>
  );
};

export default AdminTrailEditor;
