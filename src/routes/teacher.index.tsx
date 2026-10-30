import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { BigButton, TeacherShell } from "@/components/playful";
import { gameLesson, storyLesson } from "@/data/sampleLesson";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/teacher/")({
  head: () => ({
    meta: [
      { title: "Create a lesson — PlayfulAI" },
      { name: "description", content: "Upload a worksheet and turn it into a story adventure or game." },
      { property: "og:title", content: "Create a lesson — PlayfulAI" },
      { property: "og:description", content: "Upload a worksheet and turn it into a story adventure or game." },
    ],
  }),
  component: TeacherUpload,
});

const SUBJECTS = ["Math", "German", "English", "Science"];
const GRADES = [1, 2, 3, 4];
const LANGS = ["English", "German"];

function Pills<T extends string | number>({ items, value, onChange, label }: { items: T[]; value: T; onChange: (v: T) => void; label: string }) {
  return (
    <div>
      <div className="mb-2 text-sm font-bold uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="flex flex-wrap gap-2">
        {items.map((i) => (
          <button
            key={i}
            type="button"
            onClick={() => onChange(i)}
            className={cn(
              "min-h-11 rounded-xl border-2 px-4 font-semibold transition",
              value === i ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:border-primary",
            )}
          >
            {label === "Grade" ? `Grade ${i}` : i}
          </button>
        ))}
      </div>
    </div>
  );
}

function TeacherUpload() {
  const navigate = useNavigate();
  const [file, setFile] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);
  const [subject, setSubject] = useState("Math");
  const [grade, setGrade] = useState(2);
  const [lang, setLang] = useState("English");
  const [template, setTemplate] = useState<"story" | "game">("story");
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const camRef = useRef<HTMLInputElement>(null);

  const create = () => {
    setLoading(true);
    const lesson = template === "story" ? storyLesson : gameLesson;
    setTimeout(() => navigate({ to: "/teacher/lesson/$id", params: { id: lesson.id } }), 2400);
  };

  if (loading)
    return (
      <div className="bg-playful grid min-h-screen place-items-center px-4 text-center">
        <div>
          <div className="animate-float text-8xl">🤖</div>
          <div className="mt-6 flex justify-center gap-2">
            {[0, 1, 2].map((i) => (
              <span key={i} className="h-4 w-4 animate-bounce rounded-full bg-primary" style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
          <h1 className="mt-6 text-3xl font-bold">Our AI is reading your worksheet...</h1>
          <p className="mt-2 text-muted-foreground">Sprinkling in some magic ✨</p>
        </div>
      </div>
    );

  return (
    <TeacherShell>
      <h1 className="text-3xl font-bold sm:text-4xl">Create a new lesson</h1>
      <p className="mt-1 text-muted-foreground">Upload a worksheet, pick a style, and we'll do the rest.</p>

      <div className="mt-8 grid gap-6">
        <div
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f) setFile(f.name); }}
          className={cn("rounded-3xl border-4 border-dashed bg-card p-8 text-center transition", drag && "border-primary bg-secondary")}
        >
          <div className="text-5xl">{file ? "📄" : "📤"}</div>
          <p className="mt-3 font-display text-xl font-semibold">{file ?? "Drag & drop your worksheet here"}</p>
          <p className="text-sm text-muted-foreground">PDF, PNG or JPG</p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <BigButton variant="ghost" type="button" onClick={() => fileRef.current?.click()}>Browse files</BigButton>
            <BigButton variant="sky" type="button" onClick={() => camRef.current?.click()}>📷 Take photo</BigButton>
            <BigButton variant="sun" type="button" onClick={() => setFile("Sample: Addition & Subtraction.pdf")}>Use sample</BigButton>
          </div>
          <input ref={fileRef} type="file" accept="image/*,.pdf" hidden onChange={(e) => e.target.files?.[0] && setFile(e.target.files[0].name)} />
          <input ref={camRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => e.target.files?.[0] && setFile(e.target.files[0].name)} />
        </div>

        <div className="grid gap-5 rounded-3xl bg-card p-6 sm:grid-cols-3">
          <Pills label="Subject" items={SUBJECTS} value={subject} onChange={setSubject} />
          <Pills label="Grade" items={GRADES} value={grade} onChange={setGrade} />
          <Pills label="Language" items={LANGS} value={lang} onChange={setLang} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {([
            ["story", "📖", "Story Adventure", "Narrated chapters with a quiz after each one."],
            ["game", "🏝️", "Game", "A map of levels where kids collect stars."],
          ] as const).map(([key, emoji, title, desc]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTemplate(key)}
              className={cn(
                "rounded-3xl border-4 bg-card p-6 text-left transition hover:-translate-y-1",
                template === key ? "border-primary shadow-soft" : "border-transparent",
              )}
            >
              <div className="text-5xl">{emoji}</div>
              <h2 className="mt-3 text-2xl font-bold">{title}</h2>
              <p className="text-muted-foreground">{desc}</p>
            </button>
          ))}
        </div>

        <BigButton className="w-full py-5 text-2xl" onClick={create} disabled={!file}>
          ✨ Create lesson
        </BigButton>
        {!file && <p className="-mt-3 text-center text-sm text-muted-foreground">Upload a worksheet or use the sample to continue.</p>}
      </div>
      <GemmaTest />
    </TeacherShell>
  );
}

function GemmaTest() {
  const [message, setMessage] = useState("Create one simple grade 2 math question about addition.");
  const [loading, setLoading] = useState(false);
  const [reply, setReply] = useState("");
  const [error, setError] = useState("");

  const send = async () => {
    if (loading) return;
    const text = message.trim();
    if (!text) return setError("Please type a message first");
    setLoading(true); setError(""); setReply("");
    try {
      const res = await fetch("/api/gemma-proxy", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: text }),
        signal: AbortSignal.timeout(40_000),
      });
      const data = (await res.json().catch(() => ({}))) as { reply?: string; error?: string };
      if (!res.ok || typeof data.reply !== "string") throw new Error(data.error ?? `Request failed (${res.status})`);
      setReply(data.reply);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mt-10 rounded-3xl bg-card p-6 shadow-soft">
      <h2 className="text-2xl font-bold">Test Gemma Connection</h2>
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        maxLength={1000}
        rows={3}
        className="mt-4 w-full rounded-2xl border-2 border-border bg-background p-3"
      />
      <BigButton className="mt-3" onClick={send} disabled={loading}>
        {loading ? "⏳ Waiting for Gemma…" : "Send to Gemma"}
      </BigButton>
      {error && <p className="mt-3 font-semibold text-destructive">{error}</p>}
      {reply && <p className="mt-3 whitespace-pre-wrap rounded-2xl bg-muted p-4">{reply}</p>}
    </section>
  );
}
