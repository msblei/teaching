import type { APIRoute } from "astro";
import { guard } from "../../../lib/workshop-access";
import { newPlayerId, tokenFor } from "../../../apps/prompt-injection/server/flags";
import { cleanName, join, scopeOf } from "../../../apps/prompt-injection/server/players";

export const prerender = false;

// A new player: POST { name } gives back a token the browser keeps.
export const POST: APIRoute = async ({ request }) => {
  const denied = await guard(request, "prompt-injection");
  if (denied) return denied;
  const body = (await request.json().catch(() => ({}))) as { name?: unknown };
  const name = cleanName(body.name);
  if (name.length < 2) return Response.json({ error: "bad_name" }, { status: 400 });
  const id = newPlayerId();
  await join(await scopeOf(request), id, name);
  return Response.json({ token: await tokenFor(id), name });
};
