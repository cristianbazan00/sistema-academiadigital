import { useEffect, useState } from "react";

interface Particle {
  id: number;
  x: number;
  color: string;
  delay: number;
  size: number;
}

const COLORS = [
  "hsl(var(--primary))",
  "hsl(48, 96%, 53%)",
  "hsl(142, 71%, 45%)",
  "hsl(280, 87%, 65%)",
  "hsl(350, 89%, 60%)",
  "hsl(199, 89%, 48%)",
];

export function ConfettiEffect({ trigger }: { trigger: boolean }) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (!trigger) return;
    const p: Particle[] = Array.from({ length: 60 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      delay: Math.random() * 0.8,
      size: Math.random() * 8 + 4,
    }));
    setParticles(p);
    const timer = setTimeout(() => setParticles([]), 3000);
    return () => clearTimeout(timer);
  }, [trigger]);

  if (particles.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute animate-confetti-fall"
          style={{
            left: `${p.x}%`,
            top: -20,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            animationDelay: `${p.delay}s`,
            borderRadius: Math.random() > 0.5 ? "50%" : "2px",
          }}
        />
      ))}
      <style>{`
        @keyframes confetti-fall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        .animate-confetti-fall {
          animation: confetti-fall 2.5s ease-in forwards;
        }
      `}</style>
    </div>
  );
}
