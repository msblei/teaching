import { getSecret } from "astro:env/server";
import { getStoredSecret } from "./admin";

// The OpenRouter key for all apps: the one set on /admin wins, then the
// OPENROUTER_API_KEY env var (handy for local dev). In production, leave
// the env var empty so removing the key on /admin really switches it off.

export const OPENROUTER_SECRET = "openrouter";

export async function openrouterKey(): Promise<{ key: string; source: "admin" | "env"; savedAt?: string } | null> {
  const stored = await getStoredSecret(OPENROUTER_SECRET);
  if (stored?.value) return { key: stored.value, source: "admin", savedAt: stored.savedAt };
  const env = getSecret("OPENROUTER_API_KEY");
  return env ? { key: env, source: "env" } : null;
}

export type KeyInfo = {
  valid: boolean;
  /** Spent on this key, USD. */
  usage?: number;
  /** Limit set on this key in OpenRouter, USD (null = no limit). */
  limit?: number | null;
  limitRemaining?: number | null;
  expiresAt?: string | null;
  /** Account balance left, USD (all keys together). */
  accountRemaining?: number | null;
};

/** Asks OpenRouter whether the key works, and how much is left. */
export async function keyInfo(key: string): Promise<KeyInfo> {
  const get = (path: string) =>
    fetch(`https://openrouter.ai/api/v1/${path}`, { headers: { Authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(8000) });
  const res = await get("key");
  if (res.status === 401 || res.status === 403) return { valid: false };
  if (!res.ok) throw new Error(`openrouter ${res.status}`);
  const d = ((await res.json()) as { data?: Record<string, unknown> }).data ?? {};
  let accountRemaining: number | null = null;
  try {
    const c = await get("credits");
    if (c.ok) {
      const cd = ((await c.json()) as { data?: { total_credits?: number; total_usage?: number } }).data;
      if (typeof cd?.total_credits === "number" && typeof cd.total_usage === "number") accountRemaining = cd.total_credits - cd.total_usage;
    }
  } catch {}
  const n = (v: unknown) => (typeof v === "number" ? v : null);
  return {
    valid: true,
    usage: n(d.usage) ?? undefined,
    limit: n(d.limit),
    limitRemaining: n(d.limit_remaining),
    expiresAt: typeof d.expires_at === "string" ? d.expires_at : null,
    accountRemaining,
  };
}

/** "sk-or-v1-…a1b2": enough to recognise a key, useless to anyone else. */
export const maskKey = (k: string) => `${k.slice(0, k.startsWith("sk-or-v1-") ? 9 : 4)}…${k.slice(-4)}`;
