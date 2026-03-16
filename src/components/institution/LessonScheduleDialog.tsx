import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  classId: string;
  className: string;
  trailId: string;
}

interface LessonSchedule {
  lessonId: string;
  lessonTitle: string;
  moduleName: string;
  moduleId: string;
  sortOrder: number;
  moduleSortOrder: number;
  releaseDate: Date | null;
}

export function LessonScheduleDialog({ open, onOpenChange, classId, className: classTitle, trailId }: Props) {
  const { toast } = useToast();
  const [schedules, setSchedules] = useState<LessonSchedule[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open || !trailId) return;
    const load = async () => {
      setLoading(true);
      const { data: mods } = await supabase
        .from("modules")
        .select("id, title, sort_order")
        .eq("trail_id", trailId)
        .order("sort_order");

      if (!mods?.length) { setSchedules([]); setLoading(false); return; }

      const { data: lessons } = await supabase
        .from("lessons")
        .select("id, title, sort_order, module_id")
        .in("module_id", mods.map((m) => m.id))
        .order("sort_order");

      const { data: existing } = await supabase
        .from("class_lesson_schedules" as any)
        .select("lesson_id, release_date")
        .eq("class_id", classId);

      const dateMap = new Map<string, string>();
      (existing ?? []).forEach((e: any) => dateMap.set(e.lesson_id, e.release_date));

      const modMap = new Map(mods.map((m) => [m.id, m]));

      const items: LessonSchedule[] = (lessons ?? []).map((l: any) => {
        const mod = modMap.get(l.module_id)!;
        const rd = dateMap.get(l.id);
        return {
          lessonId: l.id,
          lessonTitle: l.title,
          moduleName: mod.title,
          moduleId: mod.id,
          sortOrder: l.sort_order,
          moduleSortOrder: mod.sort_order,
          releaseDate: rd ? new Date(rd + "T00:00:00") : null,
        };
      });

      items.sort((a, b) => a.moduleSortOrder - b.moduleSortOrder || a.sortOrder - b.sortOrder);
      setSchedules(items);
      setLoading(false);
    };
    load();
  }, [open, trailId, classId]);

  const setDate = (lessonId: string, date: Date | null) => {
    setSchedules((prev) =>
      prev.map((s) => (s.lessonId === lessonId ? { ...s, releaseDate: date } : s))
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Delete all existing schedules for this class
      await (supabase.from("class_lesson_schedules" as any) as any).delete().eq("class_id", classId);

      // Insert new ones
      const toInsert = schedules
        .filter((s) => s.releaseDate)
        .map((s) => ({
          class_id: classId,
          lesson_id: s.lessonId,
          release_date: format(s.releaseDate!, "yyyy-MM-dd"),
        }));

      if (toInsert.length > 0) {
        const { error } = await (supabase.from("class_lesson_schedules" as any) as any).insert(toInsert);
        if (error) throw error;
      }

      toast({ title: "Agendamento salvo com sucesso!" });
      onOpenChange(false);
    } catch (e: any) {
      toast({ title: "Erro ao salvar", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // Group by module
  const modules = Array.from(new Set(schedules.map((s) => s.moduleId))).map((modId) => {
    const lessons = schedules.filter((s) => s.moduleId === modId);
    return { id: modId, name: lessons[0]?.moduleName ?? "", lessons };
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Agendamento de Aulas — {classTitle}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <p className="text-sm text-muted-foreground py-4">Carregando aulas...</p>
        ) : modules.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">Nenhuma aula encontrada na trilha.</p>
        ) : (
          <Accordion type="multiple" className="space-y-2">
            {modules.map((mod) => (
              <AccordionItem key={mod.id} value={mod.id} className="border rounded-lg px-3">
                <AccordionTrigger className="hover:no-underline text-sm font-semibold">
                  {mod.name}
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3 pb-2">
                    {mod.lessons.map((lesson) => (
                      <div key={lesson.lessonId} className="flex items-center justify-between gap-3">
                        <span className="text-sm flex-1">{lesson.lessonTitle}</span>
                        <div className="flex items-center gap-1">
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className={cn(
                                  "w-[160px] justify-start text-left font-normal",
                                  !lesson.releaseDate && "text-muted-foreground"
                                )}
                              >
                                <CalendarIcon className="h-3.5 w-3.5 mr-1.5" />
                                {lesson.releaseDate
                                  ? format(lesson.releaseDate, "dd/MM/yyyy", { locale: ptBR })
                                  : "Sem data"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="end">
                              <Calendar
                                mode="single"
                                selected={lesson.releaseDate ?? undefined}
                                onSelect={(d) => setDate(lesson.lessonId, d ?? null)}
                                initialFocus
                                className={cn("p-3 pointer-events-auto")}
                              />
                            </PopoverContent>
                          </Popover>
                          {lesson.releaseDate && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => setDate(lesson.lessonId, null)}
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving || loading}>
            {saving ? "Salvando..." : "Salvar Agendamento"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
