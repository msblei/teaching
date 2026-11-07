import type { Listing, ListingDetail } from "../../shared/types";
import { fetchPage, SourceUnavailable } from "./fetch";
import { nextData, clean } from "./extract";

// tutti.ch, read from its normal pages. Its robots.txt allows search
// (/de/q/) and listing pages (/de/vi/) for every user agent, so requests go
// out directly with an honest user agent; only /api/ is off limits, so the
// internal API is not used. Data comes from __NEXT_DATA__ ->
// props.pageProps.dehydratedState.queries (confirmed 2026-11-07):
// - search: "SearchListingsByConstraints" -> listings.edges[].node
// - listing: "GetListingDetails" -> listing

const BASE = "https://www.tutti.ch";

export const searchUrl = (query: string) => `${BASE}/de/q/suche?query=${encodeURIComponent(query.trim())}`;
export const listingUrl = (id: string) => `${BASE}/de/vi/${id}`;

/** The numeric listing id of a tutti listing URL (with or without the long slug). */
export function listingId(url: string): string | undefined {
  try {
    const u = new URL(url);
    if (!u.hostname.endsWith("tutti.ch")) return undefined;
    return u.pathname.match(/\/vi\/(?:.*\/)?(\d+)\/?$/)?.[1];
  } catch {
    return undefined;
  }
}

/** "480.-", "1'200.-", "Gratis" -> number; "Preis auf Anfrage" -> undefined. */
export function parsePrice(s: unknown): number | undefined {
  if (typeof s !== "string") return undefined;
  if (/gratis|gratuit|free/i.test(s)) return 0;
  const m = s.replace(/['’\s]/g, "").match(/\d+(?:\.\d+)?/);
  return m ? Number(m[0]) : undefined;
}

type Node = Record<string, any>;

function queryData(html: string, name: string): any {
  const queries = nextData(html)?.props?.pageProps?.dehydratedState?.queries as Array<{ queryKey?: unknown[]; state?: { data?: unknown } }> | undefined;
  return queries?.find((q) => q.queryKey?.[0] === name)?.state?.data;
}

function where(p: Node | undefined): string | undefined {
  if (!p) return undefined;
  const place = [p.postcode, p.locationName].filter(Boolean).join(" ");
  return place ? `${place}${p.canton?.shortName ? ` (${p.canton.shortName})` : ""}` : undefined;
}

function toListing(n: Node): Listing | undefined {
  const title = clean(n?.localization?.title ?? "");
  const price = parsePrice(n?.formattedPrice);
  if (!title || price === undefined || !n.listingID) return undefined;
  const body = typeof n.localization?.body === "string" ? clean(n.localization.body) : "";
  return {
    title,
    price,
    location: where(n.postcodeInformation),
    postedAt: typeof n.timestamp === "string" ? n.timestamp : undefined,
    excerpt: body ? body.slice(0, 160) : undefined,
    imageUrl: n.thumbnail?.normalRendition?.src ?? n.thumbnail?.rendition?.src,
    url: listingUrl(String(n.listingID)),
  };
}

export async function searchTutti(query: string, maxPrice?: number): Promise<Listing[]> {
  const data = queryData(await fetchPage(searchUrl(query)), "SearchListingsByConstraints");
  if (!data?.listings) throw new SourceUnavailable("tutti: no listing data in page");
  const listings = ((data.listings.edges ?? []) as Array<{ node: Node }>).map((e) => toListing(e.node)).filter((l): l is Listing => !!l);
  return listings.filter((l) => maxPrice === undefined || l.price <= maxPrice).slice(0, 15);
}

export async function getTuttiListing(url: string): Promise<ListingDetail> {
  const id = listingId(url);
  if (!id) throw new Error("not a tutti listing URL");
  const l = queryData(await fetchPage(listingUrl(id)), "GetListingDetails")?.listing as Node | undefined;
  if (!l) throw new SourceUnavailable("tutti: listing data not found");
  const base = toListing(l);
  return {
    ...(base ?? { title: clean(l.localization?.title ?? ""), price: 0, url: listingUrl(id) }),
    excerpt: undefined,
    imageUrl: l.images?.[0]?.rendition?.src ?? base?.imageUrl,
    description: typeof l.localization?.body === "string" ? clean(l.localization.body).slice(0, 1500) : undefined,
    sellerName: typeof l.sellerInfo?.alias === "string" ? l.sellerInfo.alias : undefined,
    sellerSince: typeof l.sellerInfo?.memberSince === "string" ? l.sellerInfo.memberSince : undefined,
  };
}
