import { getStore } from "@netlify/blobs";
import { getSecret } from "astro:env/server";

// Tool-result cache shared by all participants (Netlify Blobs when
// deployed, an in-memory map in plain `astro dev`). Entries older than the
// fresh window are refetched, but kept as a fallback if the refetch fails.
// CACHE_MINUTES can be raised for a workshop (prices barely move in an hour).

export const freshMs = () => (Number(getSecret("CACHE_MINUTES")) || 30) * 60_000;

type Entry<T> = { at: number; value: T };
const memory = new Map<string, Entry<unknown>>();

function store() {
  try {
    return getStore({ name: "llm-to-agent-cache", consistency: "strong" });
  } catch {
    return null; // no Netlify Blobs context (local astro dev)
  }
}

export async function cacheGet<T>(key: string): Promise<Entry<T> | undefined> {
  const s = store();
  if (!s) return memory.get(key) as Entry<T> | undefined;
  return ((await s.get(key, { type: "json" })) as Entry<T> | null) ?? undefined;
}

export async function cacheSet<T>(key: string, value: T): Promise<void> {
  const entry: Entry<T> = { at: Date.now(), value };
  const s = store();
  if (!s) memory.set(key, entry);
  else await s.setJSON(key, entry);
}
