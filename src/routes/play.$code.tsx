import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BigButton, Confetti, playAudio, useAutoplay } from "@/components/playful";
import { audioUrl } from "@/config";
import type { GameLesson, Lesson, StoryLesson, Task } from "@/data/sampleLesson";
import { getPlayer, lessonForCode, starsFor, type Player } from "@/lib/playful";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/play/$code")({
  head: () => ({
    meta: [
      { title: "Let's play! — PlayfulAI" },
      { name: "description", content: "Play your lesson, answer questions and earn stars." },
      { property: "og:title", content: "Let's play! — PlayfulAI" },
      { property: "og:description", content: "Play your lesson, answer questions and earn stars." },
    ],
  }),
  component: PlayerPage,
});

function PlayerPage() {
  const { code } = Route.useParams();
  const [state, setState] = useState<{ lesson: Lesson | undefined; player: Player } | null>(null);
  useEffect(() => setState({ lesson: lessonForCode(code), player: getPlayer() }), [code]);

  if (!state) return <div className="bg-playful min-h-screen" />;
  if (!state.lesson)
    return (
      <div className="bg-playful grid min-h-screen place-items-center px-4 text-center">
        <div>
          <div className="text-7xl">🙈</div>
          <h1 className="mt-4 text-3xl font-bold">We couldn't find that game</h1>
          <Link to="/play"><BigButton className="mt-6">Try another code</BigButton></Link>
        </div>
      </div>
    );

  return (
    <div className="bg-playful min-h-screen px-4 py-4">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 rounded-full bg-card py-1 pl-1 pr-4 shadow-soft">
            <span className="grid h-10 w-10 place-items-center rounded-full text-2xl" style={{ background: state.player.color }}>{state.player.emoji}</span>
            <span className="font-display text-lg font-semibold">{state.player.nickname}</span>
          </div>
          <Link to="/" className="rounded-full bg-card px-4 py-2 font-semibold shadow-soft">✕</Link>
        </div>
        {state.lesson.template === "story" ? <Story lesson={state.lesson} player={state.player} /> : <Game lesson={state.lesson} player={state.player} />}
      </div>
    </div>
  );
}

/** Quiz card: wrong answers shake briefly, then reset for unlimited retries. Reports whether the first try was correct. */
function Quiz({ task, onDone }: { task: Task; onDone: (firstTry: boolean) => void }) {
  const [missed, setMissed] = useState(false);
  const [shaking, setShaking] = useState<string | null>(null);
  const [solved, setSolved] = useState(false);
  const audio = audioUrl(task.prompt_audio);

  useEffect(() => { setMissed(false); setSolved(false); setShaking(null); }, [task.id]);

  const pick = (o: string) => {
    if (solved) return;
    if (o === task.correct_answer) { setSolved(true); setShaking(null); }
    else { setMissed(true); setShaking(o); setTimeout(() => setShaking((s) => (s === o ? null : s)), 800); }
  };

  return (
    <div className="animate-pop rounded-3xl bg-card p-6 shadow-soft">
      {solved && <Confetti key={task.id} />}
      <div className="flex items-start gap-3">
        <p className="flex-1 font-display text-2xl font-semibold sm:text-3xl">{task.prompt}</p>
        {audio && <button onClick={() => playAudio(audio)} className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-sky text-2xl shadow-pop" aria-label="Listen">🔊</button>}
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {task.options.map((o) => (
          <button
            key={o}
            onClick={() => pick(o)}
            className={cn(
              "h-24 rounded-2xl font-display text-4xl font-bold shadow-pop transition active:translate-y-1 active:shadow-none",
              solved && o === task.correct_answer ? "animate-pop bg-success text-success-foreground" : shaking === o ? "animate-shake bg-destructive/25 text-destructive" : "bg-sun text-accent-foreground hover:-translate-y-1",
            )}
          >
            {o}
          </button>
        ))}
      </div>
      {shaking && <p className="mt-4 text-center text-lg font-semibold text-destructive">Not quite! Try again! 💪</p>}
      {solved && (
        <div className="animate-pop mt-5 text-center">
          <p className="text-xl font-semibold text-success">🎉 {task.explanation}</p>
          <BigButton variant="leaf" className="mt-4" onClick={() => onDone(!missed)}>Next →</BigButton>
        </div>
      )}
    </div>
  );
}

function Story({ lesson, player }: { lesson: StoryLesson; player: Player }) {
  const [ch, setCh] = useState(0);
  const [phase, setPhase] = useState<"narrate" | "quiz">("narrate");
  const [taskIdx, setTaskIdx] = useState(0);
  const [stars, setStars] = useState(0);
  const chapter = lesson.chapters[ch];
  useAutoplay(chapter && phase === "narrate" ? audioUrl(chapter.narration_audio) : null);

  if (!chapter) return <Final player={player} stars={stars} max={lesson.chapters.reduce((n, c) => n + c.tasks.length, 0)} />;

  const next = (first: boolean) => {
    if (first) setStars((s) => s + 1);
    if (taskIdx + 1 < chapter.tasks.length) setTaskIdx(taskIdx + 1);
    else { setCh(ch + 1); setTaskIdx(0); setPhase("narrate"); }
  };

  return (
    <div className="mt-6">
      <div className="mb-4 flex gap-2">
        {lesson.chapters.map((c, i) => (
          <div key={c.id} className={cn("h-3 flex-1 rounded-full", i < ch ? "bg-success" : i === ch ? "bg-primary" : "bg-border")} />
        ))}
      </div>
      <p className="font-display text-lg font-semibold text-primary">Chapter {ch + 1} of {lesson.chapters.length}</p>
      <h1 className="text-3xl font-bold sm:text-4xl">{chapter.title}</h1>
      {phase === "narrate" ? (
        <div key={chapter.id} className="animate-pop mt-6 rounded-3xl bg-card p-6 shadow-soft">
          <div className="animate-float text-center text-7xl">{["🦊", "🦉", "🐻"][ch % 3]}</div>
          <p className="mt-4 text-xl leading-relaxed sm:text-2xl">{chapter.narration_text}</p>
          <NarrationButton key={chapter.id} text={chapter.narration_text} existing={audioUrl(chapter.narration_audio)} />
          <BigButton className="mt-6 w-full" onClick={() => setPhase("quiz")}>I'm ready! →</BigButton>
        </div>
      ) : (
        <div className="mt-6"><Quiz task={chapter.tasks[taskIdx]!} onDone={next} /></div>
      )}
    </div>
  );
}

function Game({ lesson, player }: { lesson: GameLesson; player: Player }) {
  const [levelStars, setLevelStars] = useState<number[]>([]);
  const [active, setActive] = useState<number | null>(null);
  const [taskIdx, setTaskIdx] = useState(0);
  const [correct, setCorrect] = useState(0);
  const total = levelStars.reduce((a, b) => a + b, 0);
  const done = levelStars.length === lesson.levels.length;
  const [showFinal, setShowFinal] = useState(false);

  if (showFinal) return <Final player={player} stars={total} max={lesson.levels.length * 3} />;

  if (active !== null) {
    const level = lesson.levels[active]!;
    const next = (first: boolean) => {
      const c = correct + (first ? 1 : 0);
      if (taskIdx + 1 < level.tasks.length) { setCorrect(c); setTaskIdx(taskIdx + 1); }
      else { setLevelStars((s) => [...s, starsFor(c, lesson.star_thresholds)]); setActive(null); setTaskIdx(0); setCorrect(0); }
    };
    return (
      <div className="mt-6">
        <p className="font-display text-lg font-semibold text-primary">Level {active + 1} · Question {taskIdx + 1} of {level.tasks.length}</p>
        <h1 className="mb-6 text-3xl font-bold">{level.title}</h1>
        <Quiz task={level.tasks[taskIdx]!} onDone={next} />
      </div>
    );
  }

  const icons = ["🏖️", "🌴", "⛰️"];
  return (
    <div className="mt-6 text-center">
      <h1 className="text-3xl font-bold sm:text-4xl">{lesson.title}</h1>
      <p className="mt-2 inline-block rounded-full bg-card px-5 py-2 font-display text-xl font-semibold shadow-soft">⭐ {total} / {lesson.levels.length * 3}</p>
      <div className="relative mt-8 flex flex-col items-center gap-10">
        {lesson.levels.map((l, i) => {
          const unlocked = i <= levelStars.length;
          const complete = i < levelStars.length;
          const s = levelStars[i] ?? 0;
          return (
            <div key={l.id} className={cn("flex flex-col items-center", i % 2 ? "sm:translate-x-24" : "sm:-translate-x-24")}>
              <button
                disabled={!unlocked || complete}
                onClick={() => setActive(i)}
                className={cn(
                  "grid h-32 w-32 place-items-center rounded-full border-8 text-6xl shadow-pop transition",
                  complete ? "border-success bg-card" : unlocked ? "animate-float border-primary bg-sun" : "border-border bg-muted grayscale",
                )}
              >
                {unlocked ? icons[i % 3] : "🔒"}
              </button>
              <p className="mt-2 font-display text-xl font-bold">{l.title}</p>
              <p className="text-2xl">{complete ? "⭐".repeat(s) + "☆".repeat(3 - s) : "☆☆☆"}</p>
            </div>
          );
        })}
      </div>
      {done && <BigButton variant="leaf" className="mt-10" onClick={() => setShowFinal(true)}>See my score 🏆</BigButton>}
    </div>
  );
}

function Final({ player, stars, max }: { player: Player; stars: number; max: number }) {
  return (
    <div className="animate-pop mt-10 rounded-3xl bg-card p-8 text-center shadow-soft">
      <Confetti />
      <div className="animate-float text-8xl">🏆</div>
      <h1 className="mt-4 text-4xl font-bold">Great job, {player.nickname}!</h1>
      <p className="mt-4 text-5xl">{"⭐".repeat(Math.min(stars, 9))}</p>
      <p className="mt-2 font-display text-2xl font-semibold">{stars} of {max} stars</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <BigButton onClick={() => window.location.reload()}>🔁 Play again</BigButton>
        <Link to="/"><BigButton variant="ghost">🏠 Home</BigButton></Link>
      </div>
    </div>
  );
}
