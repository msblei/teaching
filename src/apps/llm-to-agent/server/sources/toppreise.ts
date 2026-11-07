import type { NewPrice } from "../../shared/types";
import { fetchPage, SourceUnavailable } from "./fetch";
import { textNodes, num } from "./extract";

// toppreise.ch search results. Each result is a "Plugin_Product" block whose text
// nodes are: brand, name parts, rating, ..., "N Angebote ab", "CHF", price.

const BASE = "https://www.toppreise.ch";

export const toppreiseUrl = (product: string) => `${BASE}/produktsuche?q=${encodeURIComponent(product.trim())}`;

const STOP = /^(\d\.\d|\(\d+\)|günstigste Variante|Produkt bewerten)$/;

function parse(html: string): NewPrice[] {
  const starts = [...html.matchAll(/class="Plugin_Product /g)].map((m) => m.index!);
  const out: NewPrice[] = [];
  starts.forEach((start, i) => {
    const block = html.slice(start, starts[i + 1] ?? start + 8000);
    const texts = textNodes(block);
    const stop = texts.findIndex((t) => STOP.test(t));
    const name = texts.slice(0, stop > 0 ? stop : 3).join(" ").replace(/\s+,/g, ",");
    const at = texts.findIndex((t) => /Angebote? ab$/.test(t));
    const price = at >= 0 ? num(texts[at + 2]) : undefined;
    const href = block.match(/href="(\/preisvergleich\/[^"]+)"/)?.[1];
    if (!name || price === undefined || !href) return;
    out.push({ product: name, lowestPrice: price, offers: num(texts[at]), url: new URL(href, BASE).href });
  });
  return out;
}

export async function checkNewPrice(product: string): Promise<NewPrice[]> {
  const url = toppreiseUrl(product);
  const html = await fetchPage(url);
  const offers = parse(html);
  // A real results page with no matches is an answer ("no new price found"),
  // not an outage; only a page that isn't toppreise's search counts as failure.
  if (!offers.length && !/Preisvergleich|toppreise/i.test(html.slice(0, 5000))) throw new SourceUnavailable("toppreise: unexpected page");
  return offers.slice(0, 6);
}
