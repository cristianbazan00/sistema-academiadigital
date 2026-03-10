import { useEffect, useState } from "react";
import { Zap } from "lucide-react";

export function XpAnimation({ amount, trigger }: { amount: number; trigger: boolean }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!trigger || amount <= 0) return;
    setVisible(true);
    const timer = setTimeout(() => setVisible(false), 2000);
    return () => clearTimeout(timer);
  }, [trigger, amount]);

  if (!visible) return null;

  return (
    <div className="fixed top-20 right-8 z-50 animate-fade-in">
      <div className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg shadow-lg font-display font-bold text-lg">
        <Zap className="h-5 w-5" />
        +{amount} XP
      </div>
    </div>
  );
}
