import { createFileRoute } from "@tanstack/react-router";

const VOICE_ID = "onwK4e9ZLuTAKqWW03F9";
const MODEL_ID = "eleven_flash_v2_5";
const MAX_CHARS = 1500;
const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 8;

// Basic in-memory limiter (per server instance) to protect ElevenLabs credits.
const hits = new Map<string, number[]>();
function limited(ip: string): boolean {
  const now = Date.now();
  const list = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (list.length >= MAX_REQUESTS_PER_WINDOW) {
    hits.set(ip, list);
    return true;
  }
  list.push(now);
  hits.set(ip, list);
  return false;
}

const json = (status: number, error: string) =>
  new Response(JSON.stringify({ error }), { status, headers: { "content-type": "application/json" } });

export const Route = createFileRoute("/api/tts")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env["ELEVENLABS_API_KEY"];
        if (!apiKey) return json(500, "Narration is not configured");

        let text = "";
        try {
          const body = (await request.json()) as { text?: unknown };
          text = typeof body.text === "string" ? body.text.trim() : "";
        } catch {
          return json(400, "Invalid request");
        }
        if (!text) return json(400, "No text to narrate");
        if (text.length > MAX_CHARS) return json(413, `Text too long (max ${MAX_CHARS} characters)`);

        const ip = request.headers.get("cf-connecting-ip") ?? request.headers.get("x-forwarded-for") ?? "local";
        if (limited(ip)) return json(429, "Too many narration requests, please wait a minute");

        const res = await fetch(
          `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}?output_format=mp3_44100_128`,
          {
            method: "POST",
            headers: { "xi-api-key": apiKey, "content-type": "application/json" },
            body: JSON.stringify({ text, model_id: MODEL_ID }),
          },
        );
        if (!res.ok) {
          console.error(`ElevenLabs failed [${res.status}]: ${await res.text()}`);
          return json(502, `Voice service error (${res.status})`);
        }
        return new Response(res.body, {
          headers: { "content-type": "audio/mpeg", "cache-control": "no-store" },
        });
      },
    },
  },
});
