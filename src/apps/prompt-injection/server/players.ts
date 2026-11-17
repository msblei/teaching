import { getStore } from "@netlify/blobs";
import { CODE_HEADER, getAccess } from "../../../lib/workshop-access";
import { LEVELS, MAX_NAME, pointsFor, type Board, type BoardRow, type Level, type Winning } from "../shared/types";

// The leaderboard. One record per player under board/<scope>/<id>, so two
// players solving at the same moment never overwrite each other. The scope
// is the workshop code (or "public"), so every session has its own board.
// In plain `astro dev` an in-memory map stands in for Netlify Blobs.

export type Solve = { at: number; prompt: string; points: number; place: number };
export type Player = { id: string; name: string; joinedAt: number; solved: Partial<Record<Level, Solve>> };

export const scoreOf = (p: Player) => LEVELS.reduce((sum, l) => sum + (p.solved[l]?.points ?? 0), 0);

const memory = new Map<string, Player>();
const blobs = () => getStore({ name: "prompt-injection", consistency: "strong" });
const key = (scope: string, id: string) => `board/${scope}/${id}`;

/** Which board a request belongs to: the code it came with, or "public". */
export async function scopeOf(request: Request): Promise<string> {
  const access = await getAccess("prompt-injection");
  const code = request.headers.get(CODE_HEADER)?.trim().toLowerCase();
  return access.mode === "code" && code ? code : "public";
}

export const cleanName = (raw: unknown): string =>
  (typeof raw === "string" ? raw : "")
    .replace(/[\u0000-\u001f<>]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_NAME);

async function read(scope: string, id: string): Promise<Player | null> {
  try {
    return ((await blobs().get(key(scope, id), { type: "json" })) as Player | null) ?? null;
  } catch {
    return memory.get(key(scope, id)) ?? null;
  }
}
async function write(scope: string, p: Player): Promise<void> {
  try {
    await blobs().setJSON(key(scope, p.id), p);
  } catch {
    memory.set(key(scope, p.id), p);
  }
  cache.delete(scope);
}

export async function join(scope: string, id: string, name: string): Promise<Player> {
  const p: Player = { id, name, joinedAt: Date.now(), solved: {} };
  await write(scope, p);
  return p;
}

/**
 * Records a solved level once. The earlier in the room, the more points:
 * the place is how many players had this level before, plus one. Two players
 * handing in at the same instant can share a place; fine for a workshop.
 * A board reset in between just starts the player again.
 */
export async function solve(scope: string, id: string, name: string, level: Level, prompt: string): Promise<Player> {
  const p = (await read(scope, id)) ?? { id, name, joinedAt: Date.now(), solved: {} };
  if (!p.solved[level]) {
    const place = (await all(scope)).filter((o) => o.id !== id && o.solved[level]).length + 1;
    p.solved[level] = { at: Date.now(), prompt: prompt.slice(0, 1200), points: pointsFor(place), place };
    await write(scope, p);
  }
  return p;
}

async function all(scope: string): Promise<Player[]> {
  const prefix = `board/${scope}/`;
  try {
    const store = blobs();
    const { blobs: found } = await store.list({ prefix });
    const players = await Promise.all(found.map((b) => store.get(b.key, { type: "json" }) as Promise<Player | null>));
    return players.filter((p): p is Player => !!p);
  } catch {
    return [...memory.entries()].filter(([k]) => k.startsWith(prefix)).map(([, p]) => p);
  }
}

// The board page polls; a short cache keeps that to one listing every two seconds.
const cache = new Map<string, { at: number; players: Player[] }>();
async function cachedAll(scope: string): Promise<Player[]> {
  const hit = cache.get(scope);
  if (hit && Date.now() - hit.at < 2000) return hit.players;
  const players = await all(scope);
  cache.set(scope, { at: Date.now(), players });
  return players;
}

/**
 * The three best: highest score first; among equals, whoever got their last
 * flag earlier. Players without a flag are never listed, and nobody below
 * third place is shown anywhere, so the board cannot shame anyone.
 */
export async function board(scope: string, me?: string): Promise<Board> {
  const players = await cachedAll(scope);
  const last = (p: Player) => Math.max(0, ...LEVELS.map((l) => p.solved[l]?.at ?? 0));
  const ranked = players.filter((p) => scoreOf(p) > 0).sort((a, b) => scoreOf(b) - scoreOf(a) || last(a) - last(b));
  const top: BoardRow[] = ranked.slice(0, 3).map((p) => ({ name: p.name, score: scoreOf(p), solved: LEVELS.filter((l) => p.solved[l]), you: p.id === me || undefined }));
  const perLevel = Object.fromEntries(LEVELS.map((l) => [l, players.filter((p) => p.solved[l]).length])) as Record<Level, number>;
  return { top, players: players.length, perLevel, at: Date.now() };
}

/** The prompts that solved a level, earliest first, without names. For the presenter only. */
export async function winning(scope: string, level: Level): Promise<Winning[]> {
  return (await all(scope))
    .filter((p) => p.solved[level])
    .map((p) => ({ prompt: p.solved[level]!.prompt, at: p.solved[level]!.at }))
    .sort((a, b) => a.at - b.at);
}

export async function reset(scope: string): Promise<number> {
  const prefix = `board/${scope}/`;
  let n = 0;
  try {
    const store = blobs();
    const { blobs: found } = await store.list({ prefix });
    await Promise.all(found.map((b) => store.delete(b.key)));
    n = found.length;
  } catch {
    for (const k of [...memory.keys()]) if (k.startsWith(prefix)) (memory.delete(k), n++);
  }
  cache.delete(scope);
  return n;
}
