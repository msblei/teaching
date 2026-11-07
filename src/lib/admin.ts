import { getStore } from "@netlify/blobs";
import { getSecret } from "astro:env/server";
import type { APIContext } from "astro";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";

// Shared admin helpers for the hidden /admin page.
//
// The page is off unless ADMIN_PASSWORD is set. A correct password gives
// a signed cookie (HMAC of its expiry, keyed with the password), so there
// is no session store and changing the password logs everyone out.
// Secrets set on the page (e.g. the OpenRouter key) live in the
// site-scoped Netlify Blobs store "admin"; in plain `astro dev` an
// in-memory map stands in.

const COOKIE = "teach_admin";
const SESSION_S = 12 * 3600;
const MAX_FAILS_PER_HOUR = 10;

// Storage

const memory = new Map<string, unknown>();
const blobs = () => getStore({ name: "admin", consistency: "strong" });

async function read<T>(key: string): Promise<T | null> {
  try {
    return ((await blobs().get(key, { type: "json" })) as T | null) ?? null;
  } catch {
    return (memory.get(key) as T | undefined) ?? null;
  }
}
async function write(key: string, value: unknown | null): Promise<void> {
  try {
    if (value === null) await blobs().delete(key);
    else await blobs().setJSON(key, value);
  } catch {
    if (value === null) memory.delete(key);
    else memory.set(key, value);
  }
}

export type StoredSecret = { value: string; savedAt: string };
export const getStoredSecret = (name: string) => read<StoredSecret>(`secret:${name}`);
export const setStoredSecret = (name: string, value: string) => write(`secret:${name}`, { value, savedAt: new Date().toISOString() });
export const deleteStoredSecret = (name: string) => write(`secret:${name}`, null);

// Auth

const password = () => getSecret("ADMIN_PASSWORD") ?? "";
export const adminEnabled = () => password().length > 0;

const sha = (s: string) => createHash("sha256").update(s).digest();
const sign = (exp: number) => createHmac("sha256", password()).update(`admin-session:${exp}`).digest("hex");

/** Constant-time, whatever the lengths. */
export const checkPassword = (input: string) => adminEnabled() && timingSafeEqual(sha(input), sha(password()));

export function sessionCookie(request: Request): string {
  const exp = Math.floor(Date.now() / 1000) + SESSION_S;
  return cookie(`${exp}.${sign(exp)}`, SESSION_S, request);
}
export const clearCookie = (request: Request) => cookie("", 0, request);

function cookie(value: string, maxAge: number, request: Request) {
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `${COOKIE}=${value}; Path=/api/admin; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${secure}`;
}

export function isAdmin(request: Request): boolean {
  if (!adminEnabled()) return false;
  const raw = request.headers
    .get("cookie")
    ?.split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${COOKIE}=`))
    ?.slice(COOKIE.length + 1);
  const [exp, sig] = (raw ?? "").split(".");
  if (!exp || !sig || Number(exp) * 1000 < Date.now()) return false;
  const want = Buffer.from(sign(Number(exp)));
  const got = Buffer.from(sig);
  return got.length === want.length && timingSafeEqual(got, want);
}

/** For admin endpoints: a Response to send back if not allowed, else null. */
export function adminGuard(request: Request): Response | null {
  if (!adminEnabled()) return new Response(null, { status: 404 });
  if (!isAdmin(request)) return Response.json({ error: "unauthorized" }, { status: 401 });
  return null;
}

// Wrong passwords: at most MAX_FAILS_PER_HOUR per client address.

const failKey = (ctx: APIContext) => {
  let ip = "unknown";
  try {
    ip = ctx.clientAddress;
  } catch {}
  return `fails:${ip}:${new Date().toISOString().slice(0, 13)}`;
};
export const tooManyFailures = async (ctx: APIContext) => ((await read<number>(failKey(ctx))) ?? 0) >= MAX_FAILS_PER_HOUR;
export async function recordFailure(ctx: APIContext) {
  const k = failKey(ctx);
  await write(k, ((await read<number>(k)) ?? 0) + 1);
}
