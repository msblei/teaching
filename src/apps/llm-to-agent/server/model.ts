import { env } from "./env";
import { openrouterKey } from "../../../lib/openrouter";
import { TOOL_DEFS } from "../shared/tools";
import type { AgentTool, ChatMessage, ModelKey, ToolCall } from "../shared/types";

// One model step through OpenRouter (OpenAI-compatible chat completions),
// streamed. The browser runs the loop (model, tool, model, ...) so
// participants can watch it, and every request stays short.

const URL = "https://openrouter.ai/api/v1/chat/completions";
const CONNECT_TIMEOUT_MS = 20_000;

type Assistant = Extract<ChatMessage, { role: "assistant" }>;

/** Tokens one model request used, as the provider counts them. */
export type Usage = { in: number; out: number };

/** Events sent to the browser as server-sent events. */
export type StepEvent =
  | { type: "text"; delta: string }
  | { type: "tool"; index: number; name: string }
  | { type: "done"; message: Assistant; finish: string; model: string; usage?: Usage }
  | { type: "error"; error: string };

export class ModelError extends Error {
  constructor(
    public kind: "no_key" | "busy" | "no_credit" | "bad_request" | "upstream",
    message: string,
  ) {
    super(message);
  }
}

/**
 * Copies only known fields, so the browser can't smuggle extra request
 * options, and drops reasoning state written by a different model: it is
 * only valid for the model that produced it.
 */
function sanitize(messages: ChatMessage[], model: ModelKey): unknown[] {
  return messages.map((m) => {
    if (m.role === "assistant") {
      const out: Record<string, unknown> = { role: "assistant", content: m.content ?? "" };
      if (m.tool_calls?.length) out.tool_calls = m.tool_calls;
      if (m.reasoning_details && m.model === model) out.reasoning_details = m.reasoning_details;
      return out;
    }
    if (m.role === "tool") return { role: "tool", tool_call_id: m.tool_call_id, content: m.content };
    return { role: "user", content: m.content };
  });
}

export type StepParams = {
  model: ModelKey;
  messages: ChatMessage[];
  tools: AgentTool[];
  system?: string;
  /** Last step the harness allows: the model has to answer, it may not call tools. */
  final?: boolean;
};

export function requestBody(params: StepParams) {
  return {
    model: env.modelId(params.model),
    max_tokens: 8000,
    stream: true,
    // Token counts arrive in the last chunk of the stream.
    usage: { include: true },
    // Low effort keeps each step fast enough to watch live; these are
    // shopping searches, not hard reasoning.
    reasoning: { effort: "low" },
    messages: [...(params.system ? [{ role: "system", content: params.system }] : []), ...sanitize(params.messages, params.model)],
    ...(params.tools.length
      ? {
          tools: params.tools.map((t) => ({
            type: "function",
            function: { name: TOOL_DEFS[t].name, description: TOOL_DEFS[t].description, parameters: TOOL_DEFS[t].input_schema },
          })),
          ...(params.final ? { tool_choice: "none" } : {}),
        }
      : {}),
  };
}

/** Streamed reasoning arrives in pieces; pieces with the same index are joined. */
function mergeReasoning(into: Record<string, unknown>[], pieces: Record<string, unknown>[]) {
  for (const p of pieces) {
    const i = typeof p.index === "number" ? p.index : into.length;
    const cur = into[i];
    if (!cur) {
      into[i] = { ...p };
      continue;
    }
    for (const [k, v] of Object.entries(p)) {
      if (typeof v === "string" && typeof cur[k] === "string" && (k === "text" || k === "summary" || k === "data")) cur[k] = (cur[k] as string) + v;
      else if (cur[k] === undefined || cur[k] === null) cur[k] = v;
    }
  }
}

/**
 * Opens the upstream stream. Errors before the first byte (bad key, no
 * credit, rate limit) throw ModelError, so the endpoint can answer with a
 * plain status code. Afterwards, events are yielded as they arrive.
 */
export async function openStep(params: StepParams) {
  const key = (await openrouterKey())?.key;
  if (!key) throw new ModelError("no_key", "no OpenRouter key set (see /admin)");
  let res: Response;
  try {
    res = await fetch(URL, {
      method: "POST",
      signal: AbortSignal.timeout(CONNECT_TIMEOUT_MS),
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://teaching.mariusbleif.com",
        "X-Title": "From LLM to Agent",
      },
      body: JSON.stringify(requestBody(params)),
    });
  } catch (err) {
    throw new ModelError("upstream", `request failed: ${(err as Error).message}`);
  }

  if (!res.ok || !res.body) {
    const json = (await res.json().catch(() => ({}))) as { error?: { message?: string; code?: number } };
    const status = json.error?.code ?? res.status;
    const msg = json.error?.message ?? `HTTP ${res.status}`;
    if (status === 401) throw new ModelError("no_key", `key rejected: ${msg}`);
    if (status === 429) throw new ModelError("busy", msg);
    if (status === 402) throw new ModelError("no_credit", msg);
    if (status === 400) throw new ModelError("bad_request", msg);
    throw new ModelError("upstream", msg);
  }

  const body = res.body;
  const modelId = env.modelId(params.model);

  async function* events(): AsyncGenerator<StepEvent> {
    const reader = body.pipeThrough(new TextDecoderStream()).getReader();
    let buf = "";
    let content = "";
    let finish = "stop";
    let usage: Usage | undefined;
    const calls: ToolCall[] = [];
    const reasoning: Record<string, unknown>[] = [];

    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += value;
      let nl: number;
      while ((nl = buf.indexOf("\n")) >= 0) {
        const line = buf.slice(0, nl).trim();
        buf = buf.slice(nl + 1);
        if (!line.startsWith("data:")) continue; // comments like ": OPENROUTER PROCESSING"
        const data = line.slice(5).trim();
        if (data === "[DONE]") continue;
        let chunk: any;
        try {
          chunk = JSON.parse(data);
        } catch {
          continue;
        }
        if (chunk.error) {
          yield { type: "error", error: chunk.error.code === 429 ? "busy" : "upstream" };
          return;
        }
        if (typeof chunk.usage?.prompt_tokens === "number") usage = { in: chunk.usage.prompt_tokens, out: Number(chunk.usage.completion_tokens) || 0 };
        const choice = chunk.choices?.[0];
        if (!choice) continue;
        const d = choice.delta ?? {};
        if (typeof d.content === "string" && d.content) {
          content += d.content;
          yield { type: "text", delta: d.content };
        }
        for (const tc of d.tool_calls ?? []) {
          const i = typeof tc.index === "number" ? tc.index : calls.length;
          if (!calls[i]) {
            calls[i] = { id: tc.id ?? `call_${i}`, type: "function", function: { name: tc.function?.name ?? "", arguments: "" } };
            if (calls[i].function.name) yield { type: "tool", index: i, name: calls[i].function.name };
          } else if (tc.function?.name && !calls[i].function.name) {
            calls[i].function.name = tc.function.name;
          }
          if (tc.id && calls[i].id.startsWith("call_")) calls[i].id = tc.id;
          if (tc.function?.arguments) calls[i].function.arguments += tc.function.arguments;
        }
        if (Array.isArray(d.reasoning_details)) mergeReasoning(reasoning, d.reasoning_details);
        if (choice.finish_reason) finish = choice.finish_reason;
      }
    }

    const toolCalls = calls.filter(Boolean);
    yield {
      type: "done",
      finish,
      model: modelId,
      usage,
      message: {
        role: "assistant",
        content: content || null,
        ...(toolCalls.length ? { tool_calls: toolCalls } : {}),
        ...(reasoning.length ? { reasoning_details: reasoning.filter(Boolean) } : {}),
        model: params.model,
      },
    };
  }

  return events();
}
