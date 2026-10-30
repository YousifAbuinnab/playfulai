export const API_BASE = "http://localhost:8000";

/** Build a playable URL for a relative backend audio path. Returns null when there is no audio. */
export function audioUrl(path: string | null | undefined): string | null {
  return path ? API_BASE + path : null;
}
