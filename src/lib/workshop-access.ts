import { getStore } from "@netlify/blobs";
import { getSecret } from "astro:env/server";
import { getStoredSecret } from "./admin";

// Shared guard for dynamic workshop apps: a code shown on the slide plus a
// per-code hourly call cap. Codes set on /admin win; the WORKSHOP_CODES env
// var (comma-separated) is the fallback.

export const CODE_HEADER = "x-workshop-code";
const DEFAULT_HOURLY_CAP = 3000; // whole room, all calls; tune per workshop

const memory = new Map<string, number>();

export const CODES_SECRET = "workshop-codes";

export const parseCodes = (raw: string) =>
  raw
    .split(/[\s,;]+/)
    .map((c) => c.trim().toLowerCase())
    .filter(Boolean);

/** The active codes and where they come from. */
export async function workshopCodes(): Promise<{ codes: string[]; source: "admin" | "env" | null }> {
  const stored = await getStoredSecret(CODES_SECRET);
  if (stored?.value) return { codes: parseCodes(stored.value), source: "admin" };
  const env = parseCodes(getSecret("WORKSHOP_CODES") ?? "");
  return { codes: env, source: env.length ? "env" : null };
}

export async function isValidCode(code: string | null): Promise<boolean> {
  return !!code && (await workshopCodes()).codes.includes(code.trim().toLowerCase());
}

/** Returns a Response to send back if the request is not allowed, else null. */
export async function guard(request: Request, app: string): Promise<Response | null> {
  const code = request.headers.get(CODE_HEADER);
  if (!(await isValidCode(code))) return Response.json({ error: "invalid_code" }, { status: 401 });

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
