import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "sky" | "leaf" | "sun" | "ghost";
const VARIANTS: Record<Variant, string> = {
  primary: "bg-primary text-primary-foreground",
  sky: "bg-sky text-primary-foreground",
  leaf: "bg-success text-success-foreground",
  sun: "bg-sun text-accent-foreground",
  ghost: "bg-card text-foreground border-2 border-border",
};

export function BigButton({ variant = "primary", className, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      {...props}
      className={cn(
        "inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl px-7 py-3 font-display text-xl font-semibold shadow-pop transition-all hover:-translate-y-0.5 active:translate-y-1 active:shadow-none disabled:pointer-events-none disabled:opacity-50",
        VARIANTS[variant],
        className,
      )}
    />
  );
}

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2 font-display text-2xl font-bold">
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-xl text-primary-foreground shadow-pop">✦</span>
      Playful<span className="text-primary">AI</span>
    </Link>
  );
}

export function TeacherShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-muted">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Logo />
          <span className="rounded-full bg-secondary px-3 py-1 text-sm font-semibold text-secondary-foreground">Teacher</span>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}

export function Confetti() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 60 }, (_, i) => ({
        left: Math.random() * 100,
        delay: Math.random() * 1.5,
        dur: 2.5 + Math.random() * 2,
        color: ["var(--sun)", "var(--sky)", "var(--berry)", "var(--leaf)", "var(--primary)"][i % 5],
      })),
    [],
  );
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {pieces.map((p, i) => (
        <span
          key={i}
          className="animate-confetti absolute -top-4 h-3 w-2 rounded-sm"
          style={{ left: `${p.left}%`, background: p.color, animationDelay: `${p.delay}s`, animationDuration: `${p.dur}s` }}
        />
      ))}
    </div>
  );
}

/** Plays audio when a URL exists; silently does nothing for null. */
export function useAutoplay(url: string | null) {
  const ref = useRef<HTMLAudioElement | null>(null);
  useEffect(() => {
    if (!url) return;
    const a = new Audio(url);
    ref.current = a;
    a.play().catch(() => {});
    return () => a.pause();
  }, [url]);
}

export function playAudio(url: string | null) {
  if (url) new Audio(url).play().catch(() => {});
}
