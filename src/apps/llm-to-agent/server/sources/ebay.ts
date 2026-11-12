import { getSecret } from "astro:env/server";
import type { Listing, ListingDetail } from "../../shared/types";
import { SourceUnavailable } from "./fetch";
import { clean, htmlToText } from "./extract";

// eBay, through its official Browse API (developer.ebay.com): the source of
// second-hand listings. Needs an application keyset: EBAY_CLIENT_ID (App ID)
// and EBAY_CLIENT_SECRET (Cert ID). The app signs in as itself (client
// credentials), no eBay user is involved.
//
// Searches run on ebay.ch for used, fixed-price items from any country.
// Swiss sellers alone are too few (2026-11-12: no ski boots in size 42, one
// pair of poles). A listing's price is the item price in CHF, without
// shipping, so it can be compared with the price printed on the listing page.
//
// eBay prices a listing by where it thinks the buyer is, in the API and on
// its pages. Asked for a buyer in Switzerland, the API adds 8.1% Swiss VAT
// and the numbers no longer match the page a visitor in Switzerland gets
// (checked 2026-11-12 on items 307268908755 and 307268908781: page CHF 184.74
// and 99.73, API for Switzerland 199.70 and 107.80, API for Germany 184.74
// and 99.73). So the default buyer location is Germany; EBAY_BUYER_LOCATION
// changes it.
//
// A sandbox keyset (App ID contains "-SBX-") talks to eBay's sandbox, which
// only holds test listings. EBAY_MARKETPLACE (default EBAY_CH) is there for
// testing against it.

const TIMEOUT_MS = 9_000;
/** The buyer location eBay works out prices for, see the note at the top. */
const buyerLocation = () => getSecret("EBAY_BUYER_LOCATION")?.trim() || "country=DE,zip=80331";
const buyerCountry = () => buyerLocation().match(/country=([A-Za-z]{2})/)?.[1].toUpperCase() ?? "DE";
const SCOPE = "https://api.ebay.com/oauth/api_scope";

const clientId = () => getSecret("EBAY_CLIENT_ID")?.trim() || "";
const clientSecret = () => getSecret("EBAY_CLIENT_SECRET")?.trim() || "";
const marketplace = () => getSecret("EBAY_MARKETPLACE")?.trim() || "EBAY_CH";
const sandbox = () => clientId().includes("-SBX-");
const api = () => (sandbox() ? "https://api.sandbox.ebay.com" : "https://api.ebay.com");
const site = () => (sandbox() ? "https://sandbox.ebay.com" : "https://www.ebay.ch");

const hasKeys = () => !!clientId() && !!clientSecret();

/** True when eBay can be searched. A sandbox keyset has no real listings,
 *  so it only counts when a test marketplace is set on purpose. */
export const ebayConfigured = () => hasKeys() && (!sandbox() || !!getSecret("EBAY_MARKETPLACE")?.trim());

export const ebaySearchUrl = (query: string) => `${site()}/sch/i.html?_nkw=${encodeURIComponent(query.trim())}`;

/** Item number and, for a listing with variants, the variant ("var") of an eBay listing URL. */
function ebayRef(url: string): { id: string; variant?: string } | undefined {
  try {
    const u = new URL(url);
    if (!/(^|\.)ebay\.[a-z.]+$/.test(u.hostname)) return undefined;
    const id = u.pathname.match(/\/itm\/(?:.*\/)?(\d+)\/?$/)?.[1];
    const variant = u.searchParams.get("var")?.match(/^\d+$/)?.[0];
    return id ? { id, variant } : undefined;
  } catch {
    return undefined;
  }
}

/** The item number of an eBay listing URL (with or without the title slug). */
export const ebayItemId = (url: string): string | undefined => ebayRef(url)?.id;

// The application token lasts two hours and is shared by all requests.
let token: { value: string; until: number } | undefined;
let pending: Promise<string> | undefined;

async function requestToken(): Promise<string> {
  const res = await fetch(`${api()}/identity/v1/oauth2/token`, {
    method: "POST",
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${btoa(`${clientId()}:${clientSecret()}`)}`,
    },
    body: `grant_type=client_credentials&scope=${encodeURIComponent(SCOPE)}`,
  });
  const body = (await res.json().catch(() => ({}))) as { access_token?: string; expires_in?: number };
  if (!res.ok || !body.access_token) throw new SourceUnavailable(`ebay: sign-in failed (${res.status})`);
  token = { value: body.access_token, until: Date.now() + ((body.expires_in ?? 7200) - 120) * 1000 };
  return token.value;
}

async function accessToken(): Promise<string> {
  if (token && Date.now() < token.until) return token.value;
  pending ??= requestToken().finally(() => (pending = undefined));
  return pending;
}

async function get(path: string, optional = false): Promise<any> {
  if (!hasKeys()) throw new SourceUnavailable("ebay: no keys configured");
  const res = await fetch(`${api()}/buy/browse/v1${path}`, {
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: {
      Authorization: `Bearer ${await accessToken()}`,
      "X-EBAY-C-MARKETPLACE-ID": marketplace(),
      "X-EBAY-C-ENDUSERCTX": `contextualLocation=${encodeURIComponent(buyerLocation())}`,
      "Accept-Language": "de-CH",
    },
  });
  if (res.status === 401) token = undefined;
  if (optional && (res.status === 400 || res.status === 404)) return undefined;
  if (!res.ok) throw new SourceUnavailable(`ebay ${res.status}`);
  return res.json();
}

type Item = Record<string, any>;

function where(loc: Item | undefined): string | undefined {
  if (!loc) return undefined;
  const place = [loc.postalCode, loc.city].filter(Boolean).join(" ");
  return [place, loc.country ? `(${loc.country})` : ""].filter(Boolean).join(" ") || undefined;
}

function toListing(item: Item): Listing | undefined {
  const title = clean(item?.title ?? "");
  const price = Number(item?.price?.value);
  const id = item?.legacyItemId;
  if (!title || !Number.isFinite(price) || !id) return undefined;
  if (marketplace() === "EBAY_CH" && item.price.currency !== "CHF") return undefined;
  // "v1|<item number>|<variant>": a variant other than 0 is one size or colour of the listing.
  const variant = typeof item.itemId === "string" ? item.itemId.split("|")[2] : undefined;
  let origin = site();
  try {
    origin = new URL(item.itemWebUrl).origin;
  } catch {}
  const condition = typeof item.condition === "string" ? item.condition : undefined;
  const short = typeof item.shortDescription === "string" ? clean(item.shortDescription) : "";
  return {
    title,
    price,
    location: where(item.itemLocation),
    postedAt: typeof item.itemCreationDate === "string" ? item.itemCreationDate : undefined,
    excerpt: [condition, short.slice(0, 160)].filter(Boolean).join(". ") || undefined,
    imageUrl: item.image?.imageUrl,
    url: `${origin}/itm/${id}${variant && variant !== "0" ? `?var=${variant}` : ""}`,
  };
}

/** Used items at a fixed price. The deliveryCountry filter is what makes
 *  the search report prices for the buyer location. */
export async function searchEbay(query: string, maxPrice?: number): Promise<Listing[]> {
  const filters = ["buyingOptions:{FIXED_PRICE}", "conditions:{USED}"];
  if (marketplace() === "EBAY_CH") {
    filters.push(`deliveryCountry:${buyerCountry()}`);
    if (maxPrice !== undefined) filters.push(`price:[..${maxPrice}]`, "priceCurrency:CHF");
  }
  const params = new URLSearchParams({ q: query.trim(), limit: "50", filter: filters.join(",") });
  const data = await get(`/item_summary/search?${params}`);
  const listings = ((data?.itemSummaries ?? []) as Item[]).map(toListing).filter((l): l is Listing => !!l);
  return listings.filter((l) => maxPrice === undefined || l.price <= maxPrice).slice(0, 15);
}

export async function getEbayListing(url: string): Promise<ListingDetail> {
  const ref = ebayRef(url);
  if (!ref) throw new Error("not an eBay listing URL");
  // A listing with variants can't be read by its number alone: ask for the
  // variant from the link, or else take the first one of the group.
  const item = ((await get(`/item/${encodeURIComponent(`v1|${ref.id}|${ref.variant ?? "0"}`)}`, true)) ??
    (await get(`/item/get_items_by_item_group?item_group_id=${ref.id}`))?.items?.[0]) as Item | undefined;
  const base = item && toListing(item);
  if (!base) throw new SourceUnavailable("ebay: listing data not found");
  const text = typeof item!.description === "string" ? clean(htmlToText(item!.description)) : "";
  const s = item!.seller as Item | undefined;
  const rating = s?.feedbackPercentage ? `${s.feedbackPercentage}% positive, ${s.feedbackScore ?? 0} ratings` : undefined;
  return {
    ...base,
    excerpt: undefined,
    description: [typeof item!.condition === "string" ? `Condition: ${item!.condition}.` : "", text.slice(0, 1500)].filter(Boolean).join(" ") || undefined,
    sellerName: s?.username ? `${s.username}${rating ? ` (${rating})` : ""}` : undefined,
  };
}
