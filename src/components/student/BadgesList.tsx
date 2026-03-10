import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Award } from "lucide-react";

interface Badge {
  id: string;
  name: string;
  description: string | null;
  icon_url: string | null;
  earned_at: string;
}

export function BadgesList() {
  const { user } = useAuth();
  const [badges, setBadges] = useState<Badge[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("user_badges")
      .select("earned_at, badges(id, name, description, icon_url)")
      .eq("user_id", user.id)
      .then(({ data }) => {
        if (data) {
          setBadges(
            data.map((ub: any) => ({
              ...ub.badges,
              earned_at: ub.earned_at,
            }))
          );
        }
      });
  }, [user]);

  if (badges.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Complete atividades para ganhar badges!
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-3">
      {badges.map((b) => (
        <div
          key={b.id}
          className="flex flex-col items-center gap-1 p-3 rounded-lg bg-muted/50 w-20"
          title={b.description || b.name}
        >
          {b.icon_url ? (
            <img src={b.icon_url} alt={b.name} className="h-8 w-8" />
          ) : (
            <Award className="h-8 w-8 text-primary" />
          )}
          <span className="text-xs text-center font-medium truncate w-full">{b.name}</span>
        </div>
      ))}
    </div>
  );
}
