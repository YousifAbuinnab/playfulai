import { createFileRoute, Link } from "@tanstack/react-router";
import { Logo } from "@/components/playful";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PlayfulAI — Worksheets become playful lessons" },
      { name: "description", content: "Turn school worksheets into story adventures and games for kids aged 6–10." },
      { property: "og:title", content: "PlayfulAI — Worksheets become playful lessons" },
      { property: "og:description", content: "Turn school worksheets into story adventures and games for kids aged 6–10." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="bg-playful min-h-screen px-4 py-6">
      <div className="mx-auto max-w-5xl">
        <Logo />
        <div className="py-12 text-center sm:py-20">
          <div className="animate-float mb-4 text-7xl">📚✨🎮</div>
          <h1 className="text-4xl font-bold sm:text-6xl">Worksheets become <span className="text-primary">adventures</span></h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground sm:text-xl">
            Teachers upload a worksheet. Kids play a story or a game. Everyone smiles.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          <Link to="/teacher" className="group rounded-3xl border-2 bg-card p-8 shadow-soft transition hover:-translate-y-1">
            <div className="text-5xl">🧑‍🏫</div>
            <h2 className="mt-4 text-3xl font-bold">I'm a teacher</h2>
            <p className="mt-2 text-muted-foreground">Create a lesson from a worksheet and get a join code.</p>
            <span className="mt-6 inline-block font-display text-lg font-semibold text-primary group-hover:underline">Create a lesson →</span>
          </Link>
          <Link to="/play" className="group rounded-3xl bg-sky p-8 text-primary-foreground shadow-soft transition hover:-translate-y-1">
            <div className="text-5xl">🧒</div>
            <h2 className="mt-4 text-3xl font-bold">I'm a student</h2>
            <p className="mt-2 opacity-90">Got a code from your teacher? Let's play!</p>
            <span className="mt-6 inline-block font-display text-lg font-semibold group-hover:underline">Join a game →</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
