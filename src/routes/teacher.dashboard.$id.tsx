import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { BigButton, TeacherShell } from "@/components/playful";
import { getLesson } from "@/data/sampleLesson";
import { publishLesson } from "@/lib/playful";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/teacher/dashboard/$id")({
  loader: ({ params }) => {
    const lesson = getLesson(params.id);
    if (!lesson) throw notFound();
    return { lesson };
  },
  head: () => ({
    meta: [
      { title: "Teacher dashboard — PlayfulAI" },
      { name: "description", content: "Follow how your class is doing with a lesson." },
      { property: "og:title", content: "Teacher dashboard — PlayfulAI" },
      { property: "og:description", content: "Follow how your class is doing with a lesson." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { lesson } = Route.useLoaderData();
  const [code, setCode] = useState("····");
  useEffect(() => setCode(publishLesson(lesson.id)), [lesson.id]);
  const stats = [["🧒", "Students joined", "—"], ["✅", "Correct answers", "—"], ["⭐", "Stars earned", "—"], ["⏱️", "Avg. time", "—"]];
  return (
    <TeacherShell>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Dashboard</p>
          <h1 className="text-3xl font-bold">{lesson.title}</h1>
        </div>
        <div className="rounded-2xl bg-card px-5 py-3 text-center">
          <div className="text-xs font-bold uppercase text-muted-foreground">Join code</div>
          <div className="font-display text-3xl font-bold tracking-widest text-primary">{code}</div>
        </div>
      </div>
      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map(([e, l, v]) => (
          <div key={l} className="rounded-3xl bg-card p-5">
            <div className="text-3xl">{e}</div>
            <div className="mt-2 font-display text-3xl font-bold">{v}</div>
            <div className="text-sm text-muted-foreground">{l}</div>
          </div>
        ))}
      </div>
      <div className="mt-6 rounded-3xl border-2 border-dashed bg-card p-10 text-center">
        <div className="text-5xl">📊</div>
        <h2 className="mt-3 text-2xl font-bold">Live class results are coming soon</h2>
        <p className="mx-auto mt-1 max-w-md text-muted-foreground">Once students start playing, you'll see who joined, how they're doing, and which questions were tricky.</p>
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link to="/teacher/lesson/$id" params={{ id: lesson.id }}><BigButton variant="ghost">← Back to preview</BigButton></Link>
        <Link to="/teacher"><BigButton>Create another lesson</BigButton></Link>
      </div>
    </TeacherShell>
  );
}
