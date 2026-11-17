import type { APIRoute } from "astro";
import { guard } from "../../../lib/workshop-access";
import { chatOnce, OpenRouterError } from "../../../lib/openrouter";
import { flagFor, playerOf } from "../../../apps/prompt-injection/server/flags";
import { plan } from "../../../apps/prompt-injection/server/levels";
import { modelFor } from "../../../apps/prompt-injection/server/env";
import { LEVELS, MAX_INPUT, MAX_TURNS, type AttemptInput, type AttemptResult, type Level, type Turn } from "../../../apps/prompt-injection/shared/types";

export const prerender = false;

const okText = (v: unknown): v is string => typeof v === "string" && v.length <= MAX_INPUT;

/** Only the fields we know, within the limits; undefined if the input is not usable. */
function readInput(raw: unknown): AttemptInput | undefined {
  const r = raw as { messages?: unknown; text?: unknown; stars?: unknown } | null;
  if (r && okText(r.text)) return { text: r.text, stars: typeof r.stars === "number" ? r.stars : undefined };
  if (r && Array.isArray(r.messages) && r.messages.length && r.messages.length <= MAX_TURNS * 2) {
    const turns: Turn[] = [];
    for (const m of r.messages as { role?: unknown; content?: unknown }[]) {
      if (!m || (m.role !== "user" && m.role !== "assistant") || typeof m.content !== "string") return undefined;
      // Earlier answers are echoed back by the browser and may be longer than a player's message.
      if (m.role === "user" ? !okText(m.content) : m.content.length > 4000) return undefined;
      turns.push({ role: m.role, content: m.content });
    }
    return { messages: turns };
  }
  return undefined;
}

// One try at a level: POST { token, level, input, lang }. The prompt, the filters
// and the win check all run here; the browser only gets what the AI feature
// said or did, plus the flag when it has become visible.
export const POST: APIRoute = async ({ request }) => {
  const denied = await guard(request, "prompt-injection");
  if (denied) return denied;
  const body = (await request.json().catch(() => ({}))) as { token?: unknown; level?: unknown; input?: unknown; lang?: unknown };
  const player = await playerOf(body.token);
  if (!player) return Response.json({ error: "bad_player" }, { status: 401 });
  if (!LEVELS.includes(body.level as Level)) return Response.json({ error: "bad_level" }, { status: 400 });
  const level = body.level as Level;
  const input = readInput(body.input);
  if (!input) return Response.json({ error: "bad_input" }, { status: 400 });

  const p = plan(level, input, await flagFor(player, level), body.lang === "de" ? "de" : "en");
  if ("blocked" in p) {
    if (p.blocked === "empty") return Response.json({ error: "bad_input" }, { status: 400 });
    return Response.json({ reply: "", blocked: p.blocked } satisfies AttemptResult);
  }
  try {
    // Temperature 0: the same text gets the same answer. At 0.3 a plain
    // question got the level 1 code anywhere between 1 and 11 times in 20,
    // and a level could be won or lost by luck.
    const r = await chatOnce({ ...modelFor(p.tier), temperature: 0, messages: p.messages, tools: p.tools, forceTool: p.forceTool, maxTokens: p.maxTokens, title: "Prompt Injection" });
    return Response.json(p.finish(r));
  } catch (err) {
    const kind = err instanceof OpenRouterError ? err.kind : "upstream";
    console.error(`[prompt-injection] level ${level} failed (${kind}):`, (err as Error).message);
    if (kind === "no_key" || kind === "no_credit") return Response.json({ error: "no_key" }, { status: 503 });
    return Response.json({ error: kind }, { status: kind === "busy" ? 429 : 502 });
  }
};
