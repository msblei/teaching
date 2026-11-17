// Browser side of the game: who the player is, what they have solved, and
// the calls to the server. Everything secret stays on the server.
import type { AttemptInput, AttemptResult, Board, FlagResult, Level, Winning } from "../shared/types";

const CODE_KEY = "teach.prompt-injection.code";
const PLAYER_KEY = "teach.prompt-injection.player";

export class ApiError extends Error {
  constructor(
    public code: string,
    public status: number,
  ) {
    super(code);
  }
}

const read = (key: string): string => {
  try {
    return localStorage.getItem(key) ?? "";
  } catch {
    return "";
  }
};
const write = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch {}
};

export const savedCode = () => read(CODE_KEY);
export const saveCode = (c: string) => write(CODE_KEY, c);

/** What the browser remembers about the player between visits. */
/** `reveals`: per solved level, what the AI had been told and the model it ran on. */
export type Me = { token: string; name: string; solved: Level[]; score: number; reveals: Partial<Record<Level, string>>; models: Partial<Record<Level, string>> };

export function loadMe(): Me | null {
  try {
    const me = JSON.parse(read(PLAYER_KEY)) as Me;
    return me?.token && me.name ? { token: me.token, name: me.name, solved: me.solved ?? [], score: me.score ?? 0, reveals: me.reveals ?? {}, models: me.models ?? {} } : null;
  } catch {
    return null;
  }
}
export const saveMe = (me: Me) => write(PLAYER_KEY, JSON.stringify(me));

async function call<T>(path: string, init: { method?: string; body?: unknown; code?: string; player?: string } = {}): Promise<T> {
  const res = await fetch(`/api/${path}`, {
    method: init.method ?? "POST",
    headers: { "Content-Type": "application/json", "x-workshop-code": init.code ?? savedCode(), ...(init.player ? { "x-player": init.player } : {}) },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(json.error ?? "error", res.status);
  return json as T;
}

/** Whether this code opens the page; with an empty code, whether the page is public. */
export const checkCode = (c: string): Promise<"open" | "code" | "off"> =>
  call<{ ok: true }>("prompt-injection/access", { body: {}, code: c }).then(
    () => "open" as const,
    (err) => (err instanceof ApiError && err.code === "off" ? "off" : "code"),
  );

export const join = (name: string) => call<{ token: string; name: string }>("prompt-injection/join", { body: { name } });

export const attempt = (me: Me, level: Level, input: AttemptInput, lang: "de" | "en") =>
  call<AttemptResult>("prompt-injection/attempt", { body: { token: me.token, level, input, lang } });

export const submitFlag = (me: Me, level: Level, flag: string, prompt: string) =>
  call<FlagResult>("prompt-injection/flag", { body: { token: me.token, name: me.name, level, flag, prompt } });

/** Everything about the levels, for the presenter. Needs the admin login in this browser. */
export const getSolutions = <T>() => call<T>("admin/prompt-injection-solutions", { method: "GET" });

export const getBoard = (me: Me | null) => call<Board>("prompt-injection/board", { method: "GET", player: me?.token });

/** The board this browser belongs to, as the admin endpoints name it. */
export const boardScope = () => savedCode().trim().toLowerCase() || "public";

export const getWinning = (level: Level) =>
  call<{ prompts: Winning[] }>(`admin/prompt-injection-board?scope=${encodeURIComponent(boardScope())}&level=${level}`, { method: "GET" });
export const resetBoard = () => call<{ removed: number }>(`admin/prompt-injection-board?scope=${encodeURIComponent(boardScope())}`, { method: "DELETE" });

/** Every FLAG{...} in a text, so it can be shown as a chip. */
export const FLAG_RE = /FLAG\{[a-z0-9-]{3,30}\}/gi;
