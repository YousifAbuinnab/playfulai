import { createFileRoute } from "@tanstack/react-router";

const GEMMA_URL = "https://gemma-playful-tunnel.loca.lt/chat";
const MAX_CHARS = 1000;
const TIMEOUT_MS = 30_000;
const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 10;

// Basic in-memory limiter (per server instance).
const hits = new Map<string, number[]>();
function limited(ip: string): boolean {
  const now = Date.now();
  const list = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  const over = list.length >= MAX_REQUESTS_PER_WINDOW;
  if (!over) list.push(now);
  hits.set(ip, list);
  return over;
}

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

export const Route = createFileRoute("/api/gemma-proxy")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let message = "";
        try {
          const body = (await request.json()) as { message?: unknown };
          message = typeof body.message === "string" ? body.message.trim() : "";
        } catch {
          return json(400, { error: "Invalid request body" });
        }
        if (!message) return json(400, { error: "Please type a message first" });
        if (message.length > MAX_CHARS) return json(413, { error: `Message too long (max ${MAX_CHARS} characters)` });

        const ip = request.headers.get("cf-connecting-ip") ?? request.headers.get("x-forwarded-for") ?? "local";
        if (limited(ip)) return json(429, { error: "Too many requests, please wait a minute" });

        let res: Response;
        try {
          res = await fetch(GEMMA_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Bypass-Tunnel-Reminder": "true" },
            body: JSON.stringify({ message }),
            signal: AbortSignal.timeout(TIMEOUT_MS),
          });
        } catch (e) {
          const timeout = e instanceof Error && (e.name === "TimeoutError" || e.name === "AbortError");
          return json(504, { error: timeout ? "Gemma did not answer within 30 seconds" : "Could not reach the Gemma server (network error or tunnel offline)" });
        }

        const text = await res.text();
        const type = res.headers.get("content-type") ?? "";
        if (type.includes("text/html") || /^\s*<(!doctype|html)/i.test(text)) {
          return json(502, { error: `Gemma tunnel returned a web page instead of JSON (status ${res.status}). The tunnel may be offline or showing a warning page.` });
        }
        if (!res.ok) return json(502, { error: `Gemma server error (status ${res.status}): ${text.slice(0, 200)}` });

        let data: unknown;
        try {
          data = JSON.parse(text);
        } catch {
          return json(502, { error: "Gemma returned a response that is not valid JSON" });
        }
        const reply = (data as { reply?: unknown })?.reply;
        if (typeof reply !== "string" || !reply.trim()) {
          return json(502, { error: "Gemma response is missing the \"reply\" text" });
        }
        return json(200, { reply });
      },
    },
  },
});
