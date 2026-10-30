import { getLesson, type GameLesson } from "@/data/sampleLesson";

const CODES_KEY = "playful.codes";
const PLAYER_KEY = "playful.player";

/** Fixed demo codes so students can join even on another device. */
export const DEMO_CODES: Record<string, string> = {
  "1111": "demo-story-math-001",
  "2222": "demo-game-math-001",
};

function readCodes(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(CODES_KEY) || "{}");
  } catch {
    return {};
  }
}

export function publishLesson(lessonId: string): string {
  const codes = readCodes();
  const existing = Object.entries(codes).find(([, id]) => id === lessonId);
  if (existing) return existing[0];
  let code = "";
  do code = String(Math.floor(1000 + Math.random() * 9000));
  while (codes[code] || DEMO_CODES[code]);
  codes[code] = lessonId;
  localStorage.setItem(CODES_KEY, JSON.stringify(codes));
  return code;
}

export function lessonForCode(code: string) {
  const id = readCodes()[code] ?? DEMO_CODES[code];
  return id ? getLesson(id) : undefined;
}

export interface Player { nickname: string; emoji: string; color: string }

const ADJ = ["Blue", "Happy", "Green", "Sunny", "Brave", "Silly", "Sparkly", "Speedy"];
const ANIMALS: [string, string][] = [["Owl", "🦉"], ["Fox", "🦊"], ["Panda", "🐼"], ["Tiger", "🐯"], ["Frog", "🐸"], ["Bunny", "🐰"], ["Lion", "🦁"], ["Koala", "🐨"]];
const COLORS = ["var(--sky)", "var(--berry)", "var(--leaf)", "var(--sun)", "var(--primary)"];
const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];

export function createPlayer(): Player {
  const [animal, emoji] = pick(ANIMALS);
  const p = { nickname: `${pick(ADJ)} ${animal}`, emoji, color: pick(COLORS) };
  localStorage.setItem(PLAYER_KEY, JSON.stringify(p));
  return p;
}

export function getPlayer(): Player {
  try {
    const p = localStorage.getItem(PLAYER_KEY);
    if (p) return JSON.parse(p);
  } catch { /* ignore */ }
  return createPlayer();
}

export function starsFor(correct: number, t: GameLesson["star_thresholds"]): number {
  if (correct >= t.three_stars_min_correct) return 3;
  if (correct >= t.two_stars_min_correct) return 2;
  if (correct >= t.one_star_min_correct) return 1;
  return 0;
}
