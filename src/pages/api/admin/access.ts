import type { APIRoute } from "astro";
import { adminGuard } from "../../../lib/admin";
import { getAccess, parseCodes, setAccess, type AccessMode } from "../../../lib/workshop-access";
import { apps } from "../../../data/apps";

export const prerender = false;

// Who may use each workshop page. PUT { slug, mode, codes? }: without `codes`
// the page keeps the ones it has.
const MODES: AccessMode[] = ["off", "code", "public"];

const status = async () => Response.json({ pages: Object.fromEntries(await Promise.all(apps.map(async (a) => [a.slug, await getAccess(a.slug)]))) });

export const GET: APIRoute = ({ request }) => adminGuard(request) ?? status();

export const PUT: APIRoute = async ({ request }) => {
  const denied = adminGuard(request);
  if (denied) return denied;
  const body = (await request.json().catch(() => ({}))) as { slug?: unknown; mode?: unknown; codes?: unknown };
  const { slug, mode } = body;
  if (typeof slug !== "string" || !apps.some((a) => a.slug === slug) || !MODES.includes(mode as AccessMode))
    return Response.json({ error: "bad_request" }, { status: 400 });

  const codes = typeof body.codes === "string" ? [...new Set(parseCodes(body.codes))] : (await getAccess(slug)).codes;
  if (codes.length > 20 || !codes.every((c) => /^[a-z0-9-]{3,40}$/.test(c)) || (mode === "code" && !codes.length))
    return Response.json({ error: "invalid_codes" }, { status: 400 });

  await setAccess(slug, { mode: mode as AccessMode, codes });
  return status();
};
