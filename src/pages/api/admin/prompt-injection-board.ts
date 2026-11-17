import type { APIRoute } from "astro";
import { adminGuard } from "../../../lib/admin";
import { reset, winning } from "../../../apps/prompt-injection/server/players";
import { LEVELS, type Level } from "../../../apps/prompt-injection/shared/types";

export const prerender = false;

// For the presenter. `scope` is the workshop code of the board, or "public".
// GET ?scope=&level= lists the prompts that solved a level; DELETE ?scope= empties the board.
const scope = (url: URL) => {
  const s = (url.searchParams.get("scope") ?? "").trim().toLowerCase();
  return /^[a-z0-9-]{3,40}$/.test(s) ? s : undefined;
};

export const GET: APIRoute = async ({ request, url }) => {
  const denied = adminGuard(request);
  if (denied) return denied;
  const s = scope(url);
  const level = Number(url.searchParams.get("level")) as Level;
  if (!s || !LEVELS.includes(level)) return Response.json({ error: "bad_request" }, { status: 400 });
  return Response.json({ prompts: await winning(s, level) }, { headers: { "Cache-Control": "no-store" } });
};

export const DELETE: APIRoute = async ({ request, url }) => {
  const denied = adminGuard(request);
  if (denied) return denied;
  const s = scope(url);
  if (!s) return Response.json({ error: "bad_request" }, { status: 400 });
  return Response.json({ removed: await reset(s) });
};
