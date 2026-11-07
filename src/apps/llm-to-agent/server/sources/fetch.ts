// Page fetching. tutti.ch and toppreise.ch answer normal requests, so pages
// are fetched directly with an honest user agent, no scraping service needed.

const TIMEOUT_MS = 9_000;

/** The site could not be read (down, blocked, or an unexpected page). */
export class SourceUnavailable extends Error {}

/** Says who we are, so site operators can see what the traffic is. */
export const WORKSHOP_UA = "Mozilla/5.0 (compatible; teaching.mariusbleif.com workshop app; +https://teaching.mariusbleif.com)";

export async function fetchPage(url: string): Promise<string> {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: { "User-Agent": WORKSHOP_UA, "Accept-Language": "de-CH,de;q=0.9" },
  });
  if (!res.ok) throw new SourceUnavailable(`${new URL(url).hostname} ${res.status}`);
  const html = await res.text();
  if (isBlocked(html)) throw new SourceUnavailable("blocked by the site");
  return html;
}

/** True when the page is a captcha / block page instead of real content. */
function isBlocked(html: string): boolean {
  return /<title>[^<]*captcha/i.test(html) || html.length < 2000;
}
