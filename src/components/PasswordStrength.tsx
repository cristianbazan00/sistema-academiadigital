import { useMemo } from "react";
import { Progress } from "@/components/ui/progress";

interface PasswordStrengthProps {
  password: string;
}

const rules = [
  { label: "Mínimo 8 caracteres", test: (p: string) => p.length >= 8 },
  { label: "Letra maiúscula", test: (p: string) => /[A-Z]/.test(p) },
  { label: "Número", test: (p: string) => /\d/.test(p) },
  { label: "Caractere especial", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

export function PasswordStrength({ password }: PasswordStrengthProps) {
  const passed = useMemo(() => rules.filter((r) => r.test(password)).length, [password]);
  const percent = (passed / rules.length) * 100;

  const color =
    passed <= 1 ? "bg-destructive" : passed <= 2 ? "bg-warning" : passed <= 3 ? "bg-accent" : "bg-success";

  if (!password) return null;

  return (
    <div className="space-y-2">
      <Progress value={percent} className="h-2" indicatorClassName={color} />
      <ul className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
        {rules.map((r) => (
          <li key={r.label} className={r.test(password) ? "text-success font-medium" : ""}>
            {r.test(password) ? "✓" : "○"} {r.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function isStrongPassword(password: string): boolean {
  return rules.every((r) => r.test(password));
}
