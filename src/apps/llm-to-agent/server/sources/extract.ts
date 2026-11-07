// Helpers for reading fetched pages: embedded JSON (JSON-LD, __NEXT_DATA__),
// text nodes of an HTML fragment, and cleaning of seller-written text.

export function embeddedJson(html: string): unknown[] {
  const out: unknown[] = [];
  const re = /<script[^>]*type="application\/(?:ld\+)?json"[^>]*>([\s\S]*?)<\/script>/gi;
  for (const m of html.matchAll(re)) {
    try {
      out.push(JSON.parse(m[1]));
    } catch {}
  }
  return out;
}

export function nextData(html: string): any | undefined {
  const m = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (!m) return undefined;
  try {
    return JSON.parse(m[1]);
  } catch {
    return undefined;
  }
}

/** Depth-first walk over every object inside a JSON value. */
export function* walk(value: unknown, depth = 0): Generator<Record<string, unknown>> {
  if (depth > 40 || value === null || typeof value !== "object") return;
  if (Array.isArray(value)) {
    for (const v of value) yield* walk(v, depth + 1);
    return;
  }
  const obj = value as Record<string, unknown>;
  yield obj;
  for (const v of Object.values(obj)) yield* walk(v, depth + 1);
}

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };

export function decode(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e: string) => {
    if (e[0] === "#") {
      const code = e[1].toLowerCase() === "x" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : m;
    }
    return ENTITIES[e.toLowerCase()] ?? m;
  });
}

/** Seller text without emojis (which render as empty boxes), entities decoded, spaces collapsed. */
export function clean(s: string): string {
  return decode(s)
    .replace(/[\p{Extended_Pictographic}\u{1F1E6}-\u{1F1FF}️‍]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** HTML fragment to plain text (for descriptions). */
export function htmlToText(html: string): string {
  return clean(html.replace(/<(br|\/p|\/li|\/div)[^>]*>/gi, " ").replace(/<[^>]+>/g, " "));
}

/** Visible text nodes of an HTML fragment, in order. */
export function textNodes(html: string): string[] {
  return [...html.replace(/<(script|style|svg)[\s\S]*?<\/\1>/gi, "").matchAll(/>([^<>]+)</g)]
    .map((m) => clean(m[1]))
    .filter(Boolean);
}

export const num = (v: unknown): number | undefined => {
  const n = typeof v === "string" ? parseFloat(v.replace(/['\s]/g, "").replace(/[^\d.]/g, "")) : typeof v === "number" ? v : NaN;
  return Number.isFinite(n) ? n : undefined;
};

export const str = (v: unknown): string | undefined => (typeof v === "string" && v.trim() ? v.trim() : undefined);
