import { getStore } from "@netlify/blobs";
import { getSecret } from "astro:env/server";

// Shared guard for dynamic workshop apps: a code shown on the slide
// (WORKSHOP_CODES, comma-separated) plus a per-code hourly call cap.

export const CODE_HEADER = "x-workshop-code";
const DEFAULT_HOURLY_CAP = 3000; // whole room, all calls; tune per workshop

const memory = new Map<string, number>();

function validCodes(): string[] {
  return (getSecret("WORKSHOP_CODES") ?? "")
    .split(",")
    .map((c) => c.trim().toLowerCase())
    .filter(Boolean);
}

export function isValidCode(code: string | null): boolean {
  return !!code && validCodes().includes(code.trim().toLowerCase());
}

/** Returns a Response to send back if the request is not allowed, else null. */
export async function guard(request: Request, app: string): Promise<Response | null> {
  const code = request.headers.get(CODE_HEADER);
  if (!isValidCode(code)) return Response.json({ error: "invalid_code" }, { status: 401 });

  const cap = Number(getSecret("WORKSHOP_HOURLY_CAP")) || DEFAULT_HOURLY_CAP;
  const key = `${app}:${code!.trim().toLowerCase()}:${new Date().toISOString().slice(0, 13)}`;
  let count: number;
  try {
    const store = getStore("workshop-usage");
    // Read-then-write is not atomic; close enough for a soft cost cap.
    count = (((await store.get(key, { type: "json" })) as number | null) ?? 0) + 1;
    await store.setJSON(key, count);
  } catch {
    count = (memory.get(key) ?? 0) + 1;
    memory.set(key, count);
  }
  if (count > cap) return Response.json({ error: "rate_limited" }, { status: 429 });
  return null;
}
