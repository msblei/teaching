import type { AgentTool, ChatMessage, ContentPart, Goal, GoalItem, Listing, ModelKey, ToolCall, ToolName, ToolResult } from "../shared/types";
import { GOAL_TOOL, TOOL_NAMES } from "../shared/types";
import { TOOL_DEFS } from "../shared/tools";
import type { Text } from "../../../lib/i18n";

// The agent loop, run in the browser so each step is visible:
// model -> (tool calls) -> model -> ... until the model answers.
// Every step is also recorded as a trace event for the "under the hood" view.

export const CODE_KEY = "teach.llm-to-agent.code";
const MAX_STEPS = 8;

/**
 * Added to the instructions of the last step the harness allows. That
 * request also forbids tool calls, so the run always ends with an answer.
 */
const LIMIT_NOTE =
  "[Harness] Step limit reached: you cannot call tools any more. Answer now with what you have. If the goal is not fully reached, say what is missing and what it would cost.";

/** What the chat view shows. */
export type Item =
  | { kind: "user"; text: string; image?: string }
  | { kind: "assistant"; text: string; model: ModelKey }
  | { kind: "tool"; id: string; name: ToolName; input: Record<string, unknown>; status: "running" | "done" | "error"; result?: ToolResult; error?: string }
  /** The agent reported on its goal; the numbers are the harness's own check. */
  | { kind: "progress"; found: number; count: number; total: number; budget: number; reached: boolean; note?: string }
  | { kind: "notice"; key: "stepCap" | "refused" | "noKey" | "errBusy" | "errGeneric" }
  /** Marks where new instructions start; the model context starts fresh there. */
  | { kind: "divider"; label: Text };

/** One message as listed inside a request, for the trace. */
export type TraceMsg = { role: "system" | "user" | "assistant" | "tool"; preview: string; isNew: boolean };

/** What the "under the hood" view shows: every hop between app, model and tools. */
export type TraceEvent =
  | { kind: "user"; text: string; image: boolean }
  | { kind: "request"; n: number; model: string; tools: AgentTool[]; messages: TraceMsg[]; bytes: number; raw: string }
  | { kind: "response"; n: number; ms?: number; text: string; calls: { id: string; name: string; args: string }[]; final: boolean; streaming: boolean }
  | { kind: "tool-call"; id: string; name: string; args: string; url?: string }
  | { kind: "tool-result"; id: string; name: string; ms: number; source?: string; summary: Text; raw: string; error?: string }
  | { kind: "divider"; label: Text }
  | { kind: "error"; text: string };

export type Chat = {
  messages: ChatMessage[];
  items: Item[];
  trace: TraceEvent[];
  busy: boolean;
  /** Set while a goal is active (stage 3). */
  goal: Goal | null;
  /** Model requests used by the current message, and the harness's limit. */
  step: { n: number; max: number } | null;
};

export const newChat = (): Chat => ({ messages: [], items: [], trace: [], busy: false, goal: null, step: null });

export class ApiError extends Error {
  constructor(
    public code: string,
    public status: number,
  ) {
    super(code);
  }
}

function workshopCode(): string {
  try {
    return localStorage.getItem(CODE_KEY) ?? "";
  } catch {
    return "";
  }
}

const headers = (c = workshopCode()) => ({ "Content-Type": "application/json", "x-workshop-code": c });

async function post<T>(path: string, body: unknown, c = workshopCode()): Promise<T> {
  const res = await fetch(`/api/llm-to-agent/${path}`, { method: "POST", headers: headers(c), body: JSON.stringify(body) });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(json.error ?? "error", res.status);
  return json as T;
}

/** Whether this code opens the page; with an empty code, whether the page is public. */
export const checkCode = (c: string): Promise<"open" | "code" | "off"> =>
  post<{ ok: true }>("access", {}, c).then(
    () => "open" as const,
    (err) => (err instanceof ApiError && err.code === "off" ? "off" : "code"),
  );

export type Photo = { data: string; mediaType: "image/jpeg" };

type Assistant = Extract<ChatMessage, { role: "assistant" }>;

/** One streamed model step. Calls `ontext` for each piece of the answer. */
async function streamStep(body: unknown, ontext: (delta: string) => void, ontool: (name: string) => void): Promise<{ message: Assistant; finish: string }> {
  const res = await fetch("/api/llm-to-agent/model", { method: "POST", headers: headers(), body: JSON.stringify(body) });
  if (!res.ok || !res.body) {
    const json = await res.json().catch(() => ({}));
    throw new ApiError(json.error ?? "error", res.status);
  }
  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  let buf = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += value;
    let sep: number;
    while ((sep = buf.indexOf("\n\n")) >= 0) {
      const line = buf.slice(0, sep).trim();
      buf = buf.slice(sep + 2);
      if (!line.startsWith("data:")) continue;
      const ev = JSON.parse(line.slice(5));
      if (ev.type === "text") ontext(ev.delta);
      else if (ev.type === "tool") ontool(ev.name);
      else if (ev.type === "done") return { message: ev.message, finish: ev.finish };
      else if (ev.type === "error") throw new ApiError(ev.error, ev.error === "busy" ? 429 : 502);
    }
  }
  throw new ApiError("stream_ended", 502);
}

/** Strips bulky fields before a tool result goes back to the model. */
function forModel(r: ToolResult): string {
  return JSON.stringify(r, (k, v) => (k === "imageUrl" ? undefined : v));
}

function summarize(r: ToolResult): Text {
  if (r.tool === "search_ebay") return { de: `${r.listings.length} Inserate`, en: `${r.listings.length} listings` };
  if (r.tool === "check_new_price") return { de: `${r.offers.length} Neupreise`, en: `${r.offers.length} new prices` };
  return { de: r.listing.title, en: r.listing.title };
}

const clip = (s: string, n = 140) => (s.length > n ? s.slice(0, n) + "…" : s);

function preview(m: ChatMessage): string {
  if (m.role === "tool") return clip(m.content, 120);
  if (m.role === "assistant") {
    if (m.tool_calls?.length) return m.tool_calls.map((c) => `${c.function.name}(${clip(c.function.arguments, 60)})`).join(", ");
    return clip(m.content ?? "");
  }
  if (typeof m.content === "string") return clip(m.content);
  return m.content.map((p) => (p.type === "text" ? clip(p.text) : "[image]")).join(" ");
}

/** The request as the model receives it, readable: images and encrypted reasoning shortened. */
function rawRequest(modelId: string, system: string | undefined, messages: ChatMessage[], tools: AgentTool[], final: boolean) {
  const msgs = messages.map((m) => {
    if (m.role === "assistant") {
      const { model: _m, reasoning_details, ...rest } = m;
      return reasoning_details ? { ...rest, reasoning_details: "[reasoning state, passed back unchanged]" } : rest;
    }
    if (m.role === "user" && Array.isArray(m.content))
      return { ...m, content: m.content.map((p) => (p.type === "image_url" ? { type: "image_url", image_url: { url: `[image, ${Math.round(p.image_url.url.length / 1024)} KB]` } } : p)) };
    return m;
  });
  return {
    model: modelId,
    messages: [...(system ? [{ role: "system", content: system }] : []), ...msgs],
    ...(tools.length ? { tools: tools.map((t) => ({ type: "function", function: { name: TOOL_DEFS[t].name, description: TOOL_DEFS[t].description, parameters: TOOL_DEFS[t].input_schema } })) } : {}),
    ...(tools.length && final ? { tool_choice: "none" } : {}),
  };
}

// ---- The goal tool: answered by the harness itself, no website involved ----

/** Item number at the end of an eBay URL, so different spellings of one link match. */
const listingKey = (url: string) => url.trim().match(/\/itm\/(?:[^?#]*\/)?(\d+)\/?(?:[?#].*)?$/)?.[1] ?? url.trim();

/** Every listing a tool has really returned in this chat. */
function knownListings(chat: Chat): Map<string, Listing> {
  const known = new Map<string, Listing>();
  for (const i of chat.items) {
    if (i.kind !== "tool" || !i.result) continue;
    if (i.result.tool === "search_ebay") for (const l of i.result.listings) known.set(listingKey(l.url), l);
    else if (i.result.tool === "get_listing") known.set(listingKey(i.result.listing.url), i.result.listing);
  }
  return known;
}

/**
 * Checks the agent's report: links must come from tool results, prices are
 * taken from those results, and the harness does the adding up. Updates the
 * tracker and returns what the model gets back.
 */
function checkGoal(chat: Chat, input: Record<string, unknown>): string {
  const reported = Array.isArray(input.items) ? (input.items as Array<Record<string, unknown> | null>) : [];
  if (!reported.length) return "Error: items must list every item the goal needs, found or not.";
  const budget = typeof input.budget_chf === "number" && input.budget_chf > 0 ? input.budget_chf : (chat.goal?.budget ?? 0);
  const known = knownListings(chat);
  const rejected: string[] = [];

  const items: GoalItem[] = reported.slice(0, 12).map((r) => {
    const name = (typeof r?.name === "string" && r.name.trim().slice(0, 60)) || "?";
    if (r?.found !== true) return { name, found: false };
    const l = typeof r.url === "string" ? known.get(listingKey(r.url)) : undefined;
    if (!l) {
      rejected.push(`"${name}": ${typeof r.url === "string" ? r.url : "no URL"} was not returned by any of your tool calls, so it does not count.`);
      return { name, found: false };
    }
    return { name, found: true, title: l.title, price: l.price, location: l.location, url: l.url };
  });

  // A set that covers several items is paid for once.
  const total = Math.round([...new Map(items.filter((i) => i.found).map((i) => [i.url, i.price ?? 0])).values()].reduce((a, b) => a + b, 0) * 100) / 100;
  const open = items.filter((i) => !i.found);
  const reached = !open.length && total <= budget;
  const note = typeof input.note === "string" ? input.note.trim().slice(0, 200) : undefined;
  chat.goal = { items, budget, total, reached, note, updates: (chat.goal?.updates ?? 0) + 1 };
  chat.items.push({ kind: "progress", found: items.length - open.length, count: items.length, total, budget, reached, note });

  const lines = [
    `Checked by the harness: ${items.length - open.length} of ${items.length} items found. Total CHF ${total} of ${budget}` +
      (total <= budget ? ` (CHF ${budget - total} left).` : ` (CHF ${total - budget} over budget).`),
    ...items.map((i) => (i.found ? `- ${i.name}: ${i.title}, CHF ${i.price}${i.location ? `, ${i.location}` : ""}` : `- ${i.name}: open`)),
    ...rejected.map((r) => `Rejected ${r} Only use listings you found.`),
  ];
  if (reached) lines.push("Goal reached on items and budget. Make sure the user's other wishes hold too, then give the final answer.");
  else {
    if (open.length) lines.push(`Still open: ${open.map((i) => i.name).join(", ")}.`);
    if (total > budget) lines.push("Over budget: swap something for a cheaper listing.");
  }
  if (chat.step) lines.push(`Steps used: ${chat.step.n} of ${chat.step.max}.`);
  return lines.join("\n");
}

type ToolItem = Extract<Item, { kind: "tool" }>;

async function runCall(chat: Chat, call: ToolCall): Promise<ChatMessage> {
  const reply = (content: string): ChatMessage => ({ role: "tool", tool_call_id: call.id, content });
  const name = call.function.name as ToolName;
  let input: Record<string, unknown> = {};
  try {
    input = JSON.parse(call.function.arguments || "{}");
  } catch {}

  if (call.function.name === GOAL_TOOL) {
    chat.trace.push({ kind: "tool-call", id: call.id, name: GOAL_TOOL, args: call.function.arguments || "{}" });
    const content = checkGoal(chat, input);
    const g = chat.goal;
    chat.trace.push({
      kind: "tool-result",
      id: call.id,
      name: GOAL_TOOL,
      ms: 0,
      summary: g
        ? { de: `${g.items.filter((i) => i.found).length}/${g.items.length} gefunden · CHF ${g.total} von ${g.budget}`, en: `${g.items.filter((i) => i.found).length}/${g.items.length} found · CHF ${g.total} of ${g.budget}` }
        : { de: "", en: "" },
      raw: content,
    });
    return reply(content);
  }

  chat.items.push({ kind: "tool", id: call.id, name, input, status: "running" });
  chat.trace.push({ kind: "tool-call", id: call.id, name, args: call.function.arguments || "{}" });
  // Mutate the reactive copies in the lists, not the plain objects pushed above.
  const item = chat.items.find((i) => i.kind === "tool" && i.id === call.id) as ToolItem;
  const traceCall = chat.trace.find((e) => e.kind === "tool-call" && e.id === call.id) as Extract<TraceEvent, { kind: "tool-call" }>;
  const t0 = performance.now();
  const none: Text = { de: "", en: "" };
  const done = (summary: Text, raw: string, source?: string, error?: string) =>
    chat.trace.push({ kind: "tool-result", id: call.id, name, ms: Math.round(performance.now() - t0), source, summary, raw, error });

  if (!TOOL_NAMES.includes(name)) {
    item.status = "error";
    item.error = `Unknown tool ${name}`;
    done(none, "", undefined, item.error);
    return reply(`Error: unknown tool ${name}`);
  }
  try {
    const r = await post<{ ok: boolean; result?: ToolResult; error?: string; meta?: { url: string; ms: number } }>("tool", { name, input });
    if (r.meta) traceCall.url = r.meta.url;
    if (r.ok && r.result) {
      item.status = "done";
      item.result = r.result;
      const content = forModel(r.result);
      done(summarize(r.result), content, r.result.source);
      return reply(content);
    }
    item.status = "error";
    item.error = r.error;
    done(none, "", undefined, r.error);
    return reply(`Error: ${r.error ?? "tool failed"}`);
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) throw err;
    item.status = "error";
    done(none, "", undefined, "tool failed");
    return reply("Error: tool failed");
  }
}

/**
 * Sends one user turn and runs the loop. `chat` is reactive Svelte state;
 * the loop mutates it in place so both views update step by step.
 */
export async function runTurn(
  chat: Chat,
  user: { text: string; image?: Photo },
  opts: {
    model: ModelKey;
    modelId: string;
    tools: ToolName[];
    system?: string;
    /** A goal is active: the agent also gets the goal tool. */
    goal?: boolean;
    /** Most model requests this message may set off (the last one must answer). */
    maxSteps?: number;
  },
): Promise<boolean> {
  const tools: AgentTool[] = opts.goal && opts.tools.length ? [...opts.tools, GOAL_TOOL] : opts.tools;
  const max = Math.max(2, opts.maxSteps ?? MAX_STEPS);
  let failed = false;
  const dataUrl = user.image && `data:${user.image.mediaType};base64,${user.image.data}`;
  const content: string | ContentPart[] = dataUrl
    ? [
        { type: "text", text: user.text },
        { type: "image_url", image_url: { url: dataUrl } },
      ]
    : user.text;
  chat.messages.push({ role: "user", content });
  chat.items.push({ kind: "user", text: user.text, image: dataUrl });
  chat.trace.push({ kind: "user", text: user.text, image: !!dataUrl });
  chat.busy = true;

  // Messages the model has already seen, to mark what is new in each request.
  let seen = Math.max(0, chat.messages.length - 1);
  const freshContext = seen === 0; // first request after a new chat or new instructions
  const n0 = chat.trace.filter((e) => e.kind === "request").length;

  try {
    for (let step = 0; step < max; step++) {
      const n = n0 + step + 1;
      chat.step = { n: step + 1, max };
      // The harness sets the limit: the last step has to be an answer.
      const final = step === max - 1 && tools.length > 0;
      const system = final ? `${opts.system ? `${opts.system}\n\n` : ""}${LIMIT_NOTE}` : opts.system;
      if (final) chat.items.push({ kind: "notice", key: "stepCap" });
      const raw = rawRequest(opts.modelId, system, chat.messages, tools, final);
      const rawText = JSON.stringify(raw, null, 2);
      chat.trace.push({
        kind: "request",
        n,
        model: opts.modelId,
        tools,
        messages: [
          ...(system ? [{ role: "system" as const, preview: clip(final ? LIMIT_NOTE : system, 120), isNew: final || (step === 0 && freshContext) }] : []),
          ...chat.messages.map((m, i) => ({ role: m.role, preview: preview(m), isNew: i >= seen })),
        ],
        bytes: new TextEncoder().encode(JSON.stringify(raw)).length,
        raw: rawText,
      });
      seen = chat.messages.length;
      chat.trace.push({ kind: "response", n, text: "", calls: [], final: false, streaming: true });
      const resp = chat.trace[chat.trace.length - 1] as Extract<TraceEvent, { kind: "response" }>;
      const t0 = performance.now();

      let answer: Extract<Item, { kind: "assistant" }> | undefined;
      const { message, finish } = await streamStep(
        { model: opts.model, messages: chat.messages, tools, system, final },
        (delta) => {
          if (!answer) {
            chat.items.push({ kind: "assistant", text: "", model: opts.model });
            answer = chat.items[chat.items.length - 1] as Extract<Item, { kind: "assistant" }>;
          }
          answer.text += delta;
          resp.text += delta;
        },
        () => {},
      );
      // Kept unchanged (including reasoning state) for the next call.
      chat.messages.push(message);
      const calls = message.tool_calls ?? [];
      resp.ms = Math.round(performance.now() - t0);
      resp.calls = calls.map((c) => ({ id: c.id, name: c.function.name, args: c.function.arguments }));
      resp.final = !calls.length;
      resp.streaming = false;

      if (finish === "content_filter") {
        chat.items.push({ kind: "notice", key: "refused" });
        return true;
      }
      if (!calls.length) return true;

      // Run all calls of this step in parallel, results in call order. The
      // goal report is checked last, so it sees this step's search results.
      const results = new Array<ChatMessage>(calls.length);
      const isGoal = (c: ToolCall) => c.function.name === GOAL_TOOL;
      await Promise.all(calls.map(async (c, i) => !isGoal(c) && (results[i] = await runCall(chat, c))));
      for (const [i, c] of calls.entries()) if (isGoal(c)) results[i] = await runCall(chat, c);
      chat.messages.push(...results);
    }
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) throw err;
    failed = true;
    const last = chat.trace[chat.trace.length - 1];
    if (last?.kind === "response" && last.streaming) last.streaming = false;
    chat.trace.push({ kind: "error", text: err instanceof Error ? err.message : "error" });
    // Drop the unanswered turn so the conversation stays valid for a retry.
    rollbackToLastAnswer(chat);
    const api = err instanceof ApiError ? err : null;
    chat.items.push({ kind: "notice", key: api?.code === "no_key" ? "noKey" : api?.status === 429 ? "errBusy" : "errGeneric" });
  } finally {
    chat.busy = false;
  }
  return !failed;
}

/** After a failure, trim messages back to a state that ends on a final assistant answer. */
function rollbackToLastAnswer(chat: Chat) {
  const m = chat.messages;
  while (m.length) {
    const last = m[m.length - 1];
    if (last.role === "assistant" && !last.tool_calls?.length) return;
    m.pop();
  }
}

/** Downscales a photo to keep requests small (the model needs ~1000px at most). */
export async function prepareImage(file: File): Promise<Photo> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1024 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const dataUrl = canvas.toDataURL("image/jpeg", 0.82);
  return { data: dataUrl.split(",")[1], mediaType: "image/jpeg" };
}
