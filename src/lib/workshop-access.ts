import { getStore } from "@netlify/blobs";
import { getSecret } from "astro:env/server";
import type { AstroGlobal } from "astro";
import { readValue, writeValue } from "./admin";

// Who may use a workshop page. Each page (slug in data/apps.ts) is set on
// /admin to one of three modes: off, code (its own codes) or public.
// Dynamic apps check every API call with guard(), plus an hourly call cap;
// server-rendered pages use pageGate().

export const CODE_HEADER = "x-workshop-code";
const DEFAULT_HOURLY_CAP = 3000; // whole room, all calls; tune per workshop

const memory = new Map<string, number>();

export type AccessMode = "off" | "code" | "public";
/** `codes` are kept in every mode, so a page can go off and back without retyping them. */
export type PageAccess = { mode: AccessMode; codes: string[] };
export type Gate = "open" | "code" | "off";

export const parseCodes = (raw: string) =>
  raw
    .split(/[\s,;]+/)
    .map((c) => c.trim().toLowerCase())
    .filter(Boolean);

// A page nobody has set up is off, so a new page can't spend credit by
// accident. In local dev it is open, so working on it needs no admin setup.
const UNSET: PageAccess = { mode: import.meta.env.DEV ? "public" : "off", codes: [] };

export const getAccess = async (slug: string) => (await readValue<PageAccess>(`access:${slug}`)) ?? UNSET;
export const setAccess = (slug: string, access: PageAccess) => writeValue(`access:${slug}`, access);

export function gate({ mode, codes }: PageAccess, code: string | null | undefined): Gate {
  if (mode !== "code") return mode === "public" ? "open" : "off";
  return code && codes.includes(code.trim().toLowerCase()) ? "open" : "code";
}

/** The JSON a closed gate answers API calls with. */
export const closed = (state: Gate) => Response.json({ error: state === "off" ? "off" : "invalid_code" }, { status: 401 });

/** For API endpoints: a Response to send back if the request is not allowed, else null. */
export async function guard(request: Request, app: string): Promise<Response | null> {
  const access = await getAccess(app);
  const code = request.headers.get(CODE_HEADER);
  const state = gate(access, code);
  if (state !== "open") return closed(state);

  // A public page has one shared cap: any made-up code header must not buy a new one.
  const who = access.mode === "public" ? "public" : code!.trim().toLowerCase();
  const cap = Number(getSecret("WORKSHOP_HOURLY_CAP")) || DEFAULT_HOURLY_CAP;
  const key = `${app}:${who}:${new Date().toISOString().slice(0, 13)}`;
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

const COOKIE = "workshop_code";
const COOKIE_S = 24 * 3600;

/**
 * For server-rendered pages (`prerender = false`). A code arrives as ?code=
 * (from the form or a shared link), is remembered in a cookie for this page
 * only, and is dropped from the address. The cookie holds the code itself, so
 * changing the codes on /admin locks out whoever used the old one.
 */
export async function pageGate(astro: AstroGlobal, slug: string): Promise<{ state: Gate; wrong: boolean; redirect?: string }> {
  astro.response.headers.set("Cache-Control", "private, no-store");
  const access = await getAccess(slug);
  const typed = astro.url.searchParams.get("code");
  if (typed !== null) {
    const state = gate(access, typed);
    if (state === "open") {
      astro.cookies.set(COOKIE, typed.trim().toLowerCase(), {
        path: `/${slug}`,
        maxAge: COOKIE_S,
        httpOnly: true,
        sameSite: "lax",
        secure: astro.url.protocol === "https:",
      });
      return { state, wrong: false, redirect: astro.url.pathname };
    }
    return { state, wrong: state === "code" };
  }
  return { state: gate(access, astro.cookies.get(COOKIE)?.value), wrong: false };
}
