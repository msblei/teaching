import type { APIRoute } from "astro";
import { adminGuard, deleteStoredSecret, setStoredSecret } from "../../../lib/admin";
import { CODES_SECRET, parseCodes, workshopCodes } from "../../../lib/workshop-access";

export const prerender = false;

// Workshop codes: read, replace (comma- or space-separated), remove (locks
// the app, overriding WORKSHOP_CODES), or ?reset=1 to fall back to the env var.
const status = async () => Response.json(await workshopCodes());

export const GET: APIRoute = ({ request }) => adminGuard(request) ?? status();

export const PUT: APIRoute = async ({ request }) => {
  const denied = adminGuard(request);
  if (denied) return denied;
  const body = (await request.json().catch(() => ({}))) as { codes?: unknown };
  const codes = typeof body.codes === "string" ? parseCodes(body.codes) : [];
  if (!codes.length || codes.length > 20 || !codes.every((c) => /^[a-z0-9-]{3,40}$/.test(c)))
    return Response.json({ error: "invalid_codes" }, { status: 400 });
  await setStoredSecret(CODES_SECRET, [...new Set(codes)].join(","));
  return status();
};

export const DELETE: APIRoute = async ({ request }) => {
  const denied = adminGuard(request);
  if (denied) return denied;
  if (new URL(request.url).searchParams.has("reset")) await deleteStoredSecret(CODES_SECRET);
  else await setStoredSecret(CODES_SECRET, "");
  return status();
};
