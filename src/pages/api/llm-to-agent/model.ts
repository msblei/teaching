import type { APIRoute } from "astro";
import { guard } from "../../../lib/workshop-access";
import { openStep, ModelError } from "../../../apps/llm-to-agent/server/model";
import { AGENT_TOOLS, MODEL_KEYS, type AgentTool, type ChatMessage, type ModelKey } from "../../../apps/llm-to-agent/shared/types";

export const prerender = false;

const MAX_MESSAGES = 140; // a goal run: up to 15 steps, several tool calls each
const MAX_SYSTEM = 8000;
const MAX_BODY = 5_000_000; // photos are resized in the browser first
const ROLES = ["user", "assistant", "tool"];

// One model step, streamed to the browser as server-sent events
// (see StepEvent). Errors before the stream starts are plain JSON + status.
export const POST: APIRoute = async ({ request }) => {
  const denied = await guard(request, "llm-to-agent");
  if (denied) return denied;

  const raw = await request.text();
  if (raw.length > MAX_BODY) return Response.json({ error: "too_large" }, { status: 413 });

  let body: { model?: unknown; messages?: unknown; tools?: unknown; system?: unknown; final?: unknown };
  try {
    body = JSON.parse(raw);
  } catch {
    return Response.json({ error: "bad_json" }, { status: 400 });
  }
  const { model = "claude", messages, tools = [], system, final } = body;
  if (!MODEL_KEYS.includes(model as ModelKey)) return Response.json({ error: "bad_model" }, { status: 400 });
  if (
    !Array.isArray(messages) ||
    !messages.length ||
    messages.length > MAX_MESSAGES ||
    !messages.every((m) => m && typeof m === "object" && ROLES.includes((m as { role?: string }).role ?? ""))
  )
    return Response.json({ error: "bad_messages" }, { status: 400 });
  if (!Array.isArray(tools) || !tools.every((t) => AGENT_TOOLS.includes(t)))
    return Response.json({ error: "bad_tools" }, { status: 400 });
  if (system !== undefined && (typeof system !== "string" || system.length > MAX_SYSTEM))
    return Response.json({ error: "bad_system" }, { status: 400 });

  let events: Awaited<ReturnType<typeof openStep>>;
  try {
    events = await openStep({
      model: model as ModelKey,
      messages: messages as ChatMessage[],
      tools: tools as AgentTool[],
      system: system as string | undefined,
      final: final === true,
    });
  } catch (err) {
    const kind = err instanceof ModelError ? err.kind : "upstream";
    console.error(`[llm-to-agent] model step failed (${kind}):`, (err as Error).message);
    // No key, a rejected key or no credit: nothing a participant can fix.
    if (kind === "no_key" || kind === "no_credit") return Response.json({ error: "no_key" }, { status: 503 });
    const status = kind === "busy" ? 429 : kind === "bad_request" ? 400 : 502;
    return Response.json({ error: kind }, { status });
  }

  const enc = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const ev of events) controller.enqueue(enc.encode(`data: ${JSON.stringify(ev)}\n\n`));
      } catch (err) {
        console.error("[llm-to-agent] stream broke:", (err as Error).message);
        controller.enqueue(enc.encode(`data: ${JSON.stringify({ type: "error", error: "upstream" })}\n\n`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream; charset=utf-8", "Cache-Control": "no-cache, no-transform", "X-Accel-Buffering": "no" },
  });
};
