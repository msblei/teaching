import type { DataSource, ToolName, ToolResult } from "../shared/types";
import { cacheGet, cacheSet, freshMs } from "./cache";
import { ebayItemId, ebaySearchUrl, getEbayListing, searchEbay } from "./sources/ebay";
import { SourceUnavailable } from "./sources/fetch";
import { checkNewPrice, toppreiseUrl } from "./sources/toppreise";
import { demoSearch, demoListing, demoPrice } from "./fixtures/demo";

// Runs one tool call. Order: fresh cache, live fetch, stale cache, demo data.
// Second-hand listings come from eBay's official API (needs keys, see
// sources/ebay.ts); without keys the search runs on demo data.
// A room of 10 people mostly asks the same things, so results are shared
// through the cache and identical requests that run at the same time are
// combined into one fetch. The workshop never stalls on a slow site.

const inflight = new Map<string, Promise<unknown>>();

async function cached<T>(key: string, live: () => Promise<T>, demo: () => T | undefined): Promise<{ value: T; source: DataSource }> {
  const hit = await cacheGet<T>(key);
  if (hit && Date.now() - hit.at < freshMs()) return { value: hit.value, source: "cache" };
  try {
    let p = inflight.get(key) as Promise<T> | undefined;
    if (!p) {
      p = live().then(async (v) => (await cacheSet(key, v), v));
      inflight.set(key, p);
      p.finally(() => inflight.delete(key)).catch(() => {});
    }
    return { value: await p, source: "live" };
  } catch (err) {
    console.warn(`[llm-to-agent] live fetch failed for ${key}:`, (err as Error).message);
    if (hit) return { value: hit.value, source: "cache" };
    const d = demo();
    if (d !== undefined) return { value: d, source: "demo" };
    throw new Error("The data source is not reachable right now. Try a different search or try again in a minute.");
  }
}

/** Cache key form of a query: "Skischuhe, Grösse 42" and "skischuhe grösse 42" share results. */
export const normalizeQuery = (s: string) =>
  s
    .toLowerCase()
    .replace(/\bapple\b/g, "")
    .replace(/(\d+)\s*(gb|tb|mm|cm|zoll)\b/g, "$1$2")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();

async function readListing(url: string) {
  if (!ebayItemId(url)) throw new SourceUnavailable("not an eBay listing URL");
  return getEbayListing(url);
}

function requireString(input: Record<string, unknown>, field: string): string {
  const v = input[field];
  if (typeof v !== "string" || !v.trim() || v.length > 300) throw new Error(`"${field}" must be a non-empty string`);
  return v.trim();
}

/** A tool result plus what happened behind it, for the "under the hood" view. */
export type ToolRun = { result: ToolResult; url: string; ms: number };

export async function runTool(name: ToolName, input: Record<string, unknown>): Promise<ToolRun> {
  const t0 = Date.now();
  switch (name) {
    case "search_ebay": {
      const query = requireString(input, "query");
      const maxPrice = typeof input.max_price === "number" && input.max_price > 0 ? input.max_price : undefined;
      const { value, source } = await cached(
        `search:${normalizeQuery(query)}:${maxPrice ?? ""}`,
        () => searchEbay(query, maxPrice),
        () => demoSearch(query, maxPrice),
      );
      return { result: { tool: name, source, query, listings: value }, url: ebaySearchUrl(query), ms: Date.now() - t0 };
    }
    case "get_listing": {
      const url = requireString(input, "url");
      const { value, source } = await cached(`listing:${url}`, () => readListing(url), () => demoListing(url));
      return { result: { tool: name, source, listing: value }, url, ms: Date.now() - t0 };
    }
    case "check_new_price": {
      const product = requireString(input, "product");
      const { value, source } = await cached(`price:${normalizeQuery(product)}`, () => checkNewPrice(product), () => demoPrice(product));
      return { result: { tool: name, source, offers: value }, url: toppreiseUrl(product), ms: Date.now() - t0 };
    }
  }
}
