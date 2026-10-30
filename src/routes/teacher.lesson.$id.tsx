import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { BigButton, Confetti, TeacherShell } from "@/components/playful";
import { getLesson, type Task } from "@/data/sampleLesson";
import { publishLesson } from "@/lib/playful";

export const Route = createFileRoute("/teacher/lesson/$id")({
  loader: ({ params }) => {
    const lesson = getLesson(params.id);
    if (!lesson) throw notFound();
    return { lesson };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData ? `${loaderData.lesson.title} — Preview` : "Lesson preview — PlayfulAI" },
      { name: "description", content: "Preview and publish your generated lesson." },
      { property: "og:title", content: "Lesson preview — PlayfulAI" },
      { property: "og:description", content: "Preview and publish your generated lesson." },
    ],
  }),
  component: Preview,
});

function TaskRow({ task }: { task: Task }) {
  return (
    <div className="rounded-2xl bg-muted p-4">
      <p className="font-semibold">❓ {task.prompt}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {task.options.map((o) => (
          <span key={o} className={o === task.correct_answer ? "rounded-lg bg-success px-3 py-1 font-bold text-success-foreground" : "rounded-lg bg-card px-3 py-1"}>
            {o === task.correct_answer ? "✓ " : ""}{o}
          </span>
        ))}
      </div>
    </div>
  );
}

function Preview() {
  const { lesson } = Route.useLoaderData();
  const [code, setCode] = useState<string | null>(null);
  const sections = lesson.template === "story"
    ? lesson.chapters.map((c, i) => ({ id: c.id, label: `Chapter ${i + 1}`, title: c.title, text: c.narration_text, tasks: c.tasks }))
    : lesson.levels.map((l, i) => ({ id: l.id, label: `Level ${i + 1}`, title: l.title, text: null, tasks: l.tasks }));

  return (
    <TeacherShell>
      {code && <Confetti />}
      <div className="flex flex-wrap gap-2 text-sm font-semibold">
        <span className="rounded-full bg-secondary px-3 py-1 text-secondary-foreground">{lesson.template === "story" ? "📖 Story Adventure" : "🏝️ Game"}</span>
        <span className="rounded-full bg-card px-3 py-1">{lesson.subject}</span>
        <span className="rounded-full bg-card px-3 py-1">Grade {lesson.grade}</span>
        <span className="rounded-full bg-card px-3 py-1">{lesson.language}</span>
      </div>
      <h1 className="mt-3 text-3xl font-bold sm:text-4xl">{lesson.title}</h1>
      <p className="mt-1 text-muted-foreground">{lesson.description}</p>

      {code ? (
        <div className="animate-pop mt-8 rounded-3xl bg-card p-8 text-center shadow-soft">
          <p className="font-display text-xl">Lesson published! Students join at <b>/play</b> with code:</p>
          <div className="my-6 flex justify-center gap-3">
            {code.split("").map((d, i) => (
              <span key={i} className="grid h-24 w-20 place-items-center rounded-2xl bg-primary font-display text-6xl font-bold text-primary-foreground shadow-pop sm:h-32 sm:w-24 sm:text-7xl">{d}</span>
            ))}
          </div>
          <Link to="/teacher/dashboard/$id" params={{ id: lesson.id }}>
            <BigButton variant="sky">Open teacher dashboard →</BigButton>
          </Link>
        </div>
      ) : (
        <BigButton className="mt-6 w-full py-5 text-2xl" onClick={() => setCode(publishLesson(lesson.id))}>🚀 Publish lesson</BigButton>
      )}

      <div className="mt-8 grid gap-4">
        {sections.map((s) => (
          <section key={s.id} className="rounded-3xl bg-card p-6">
            <div className="text-sm font-bold uppercase tracking-wide text-primary">{s.label}</div>
            <h2 className="text-2xl font-bold">{s.title}</h2>
            {s.text && <p className="mt-2 italic text-muted-foreground">“{s.text}”</p>}
            <div className="mt-4 grid gap-3">{s.tasks.map((t) => <TaskRow key={t.id} task={t} />)}</div>
          </section>
        ))}
      </div>
    </TeacherShell>
  );
}
