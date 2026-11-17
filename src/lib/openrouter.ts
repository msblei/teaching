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

// One complete (not streamed) chat request, for apps whose answers are short
// and have to be checked on the server before the browser sees them.

export type ChatTurn = { role: "system" | "user" | "assistant"; content: string };
export type ChatTool = { name: string; description: string; parameters: Record<string, unknown> };
export type ChatResult = {
  text: string;
  calls: { name: string; args: Record<string, unknown> }[];
  usage?: { in: number; out: number };
  /** Which hosting provider OpenRouter sent the request to. */
  provider?: string;
};

export class OpenRouterError extends Error {
  constructor(
    public kind: "no_key" | "busy" | "no_credit" | "bad_request" | "upstream",
    message: string,
  ) {
    super(message);
  }
}

export async function chatOnce(opts: {
  model: string;
  messages: ChatTurn[];
  tools?: ChatTool[];
  /** Name of a tool the model has to call. */
  forceTool?: string;
  maxTokens?: number;
  temperature?: number;
  /** Hosting providers to try first, in this order (OpenRouter provider names). The same
   *  open model can behave differently from host to host. */
  providers?: string[];
  /** Shown in the OpenRouter dashboard. */
  title: string;
  timeoutMs?: number;
}): Promise<ChatResult> {
  const key = (await openrouterKey())?.key;
  if (!key) throw new OpenRouterError("no_key", "no OpenRouter key set (see /admin)");
  let res: Response;
  try {
    res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      signal: AbortSignal.timeout(opts.timeoutMs ?? 25_000),
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", "HTTP-Referer": "https://teaching.mariusbleif.com", "X-Title": opts.title },
      body: JSON.stringify({
        model: opts.model,
        max_tokens: opts.maxTokens ?? 400,
        temperature: opts.temperature ?? 0.3,
        reasoning: { effort: "low" },
        ...(opts.providers?.length ? { provider: { order: opts.providers, allow_fallbacks: true } } : {}),
        messages: opts.messages,
        ...(opts.tools?.length
          ? {
              tools: opts.tools.map((t) => ({ type: "function", function: t })),
              ...(opts.forceTool ? { tool_choice: { type: "function", function: { name: opts.forceTool } } } : {}),
            }
          : {}),
      }),
    });
  } catch (err) {
    throw new OpenRouterError("upstream", `request failed: ${(err as Error).message}`);
  }
  const json = (await res.json().catch(() => ({}))) as any;
  if (!res.ok || json.error) {
    const status = json.error?.code ?? res.status;
    const msg = json.error?.message ?? `HTTP ${res.status}`;
    if (status === 401) throw new OpenRouterError("no_key", `key rejected: ${msg}`);
    if (status === 429) throw new OpenRouterError("busy", msg);
    if (status === 402) throw new OpenRouterError("no_credit", msg);
    if (status === 400) throw new OpenRouterError("bad_request", msg);
    throw new OpenRouterError("upstream", msg);
  }
  const m = json.choices?.[0]?.message ?? {};
  const calls = ((m.tool_calls ?? []) as any[]).map((c) => {
    let args: Record<string, unknown> = {};
    try {
      args = JSON.parse(c.function?.arguments || "{}");
    } catch {}
    return { name: String(c.function?.name ?? ""), args };
  });
  return {
    text: typeof m.content === "string" ? m.content : "",
    calls,
    provider: typeof json.provider === "string" ? json.provider : undefined,
    usage: typeof json.usage?.prompt_tokens === "number" ? { in: json.usage.prompt_tokens, out: Number(json.usage.completion_tokens) || 0 } : undefined,
  };
}
