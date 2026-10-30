import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { BigButton, Logo } from "@/components/playful";
import { createPlayer, lessonForCode } from "@/lib/playful";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/play/")({
  head: () => ({
    meta: [
      { title: "Join a game — PlayfulAI" },
      { name: "description", content: "Enter your 4-digit code and start playing!" },
      { property: "og:title", content: "Join a game — PlayfulAI" },
      { property: "og:description", content: "Enter your 4-digit code and start playing!" },
    ],
  }),
  component: Join,
});

const KEY_COLORS = ["bg-sky", "bg-berry", "bg-leaf", "bg-sun", "bg-primary"];

function Join() {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);

  const press = (d: string) => { setError(false); setCode((c) => (c.length < 4 ? c + d : c)); };
  const join = () => {
    if (!lessonForCode(code)) { setError(true); return; }
    createPlayer();
    navigate({ to: "/play/$code", params: { code } });
  };

  return (
    <div className="bg-playful min-h-screen px-4 py-6">
      <div className="mx-auto max-w-md">
        <Logo />
        <h1 className="mt-8 text-center text-4xl font-bold">Enter your code!</h1>
        <p className="text-center text-lg text-muted-foreground">Your teacher has a 4-digit code for you.</p>

        <div className={cn("mt-6 flex justify-center gap-3", error && "animate-shake")}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className={cn("grid h-20 w-16 place-items-center rounded-2xl border-4 bg-card font-display text-5xl font-bold", code[i] ? "border-primary" : "border-border", error && "border-destructive")}>
              {code[i] ?? ""}
            </div>
          ))}
        </div>
        {error && <p className="mt-3 text-center font-semibold text-destructive">Hmm, that code didn't work. Try again!</p>}

        <div className="mt-6 grid grid-cols-3 gap-3">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d, i) => (
            <button key={d} onClick={() => press(d)} className={cn("h-20 rounded-2xl font-display text-4xl font-bold text-primary-foreground shadow-pop transition active:translate-y-1 active:shadow-none", KEY_COLORS[i % 5])}>
              {d}
            </button>
          ))}
          <button onClick={() => { setError(false); setCode((c) => c.slice(0, -1)); }} className="h-20 rounded-2xl bg-card font-display text-3xl shadow-pop active:translate-y-1 active:shadow-none" aria-label="Delete">⌫</button>
          <button onClick={() => press("0")} className="h-20 rounded-2xl bg-sky font-display text-4xl font-bold text-primary-foreground shadow-pop active:translate-y-1 active:shadow-none">0</button>
          <button onClick={() => { setError(false); setCode(""); }} className="h-20 rounded-2xl bg-card font-display text-xl font-bold shadow-pop active:translate-y-1 active:shadow-none">Clear</button>
        </div>

        <BigButton variant="leaf" className="mt-6 w-full py-5 text-3xl" disabled={code.length !== 4} onClick={join}>Let's go! 🚀</BigButton>
        <p className="mt-4 text-center text-sm text-muted-foreground">Demo codes: 1111 (story) · 2222 (game)</p>
      </div>
    </div>
  );
}
