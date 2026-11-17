import type { APIRoute } from "astro";
import { guard } from "../../../lib/workshop-access";
import { checkFlag, flagFor, playerOf } from "../../../apps/prompt-injection/server/flags";
import { revealPrompt, tierOf } from "../../../apps/prompt-injection/server/levels";
import { modelFor } from "../../../apps/prompt-injection/server/env";
import { cleanName, scoreOf, scopeOf, solve } from "../../../apps/prompt-injection/server/players";
import { LEVELS, type FlagResult, type Level } from "../../../apps/prompt-injection/shared/types";

export const prerender = false;

// Hand in a flag: POST { token, name, level, flag, prompt }. `prompt` is what
// the browser says cracked the level; it is kept for the debrief only.
export const POST: APIRoute = async ({ request }) => {
  const denied = await guard(request, "prompt-injection");
  if (denied) return denied;
  const body = (await request.json().catch(() => ({}))) as { token?: unknown; name?: unknown; level?: unknown; flag?: unknown; prompt?: unknown };
  const player = await playerOf(body.token);
  if (!player) return Response.json({ error: "bad_player" }, { status: 401 });
  if (!LEVELS.includes(body.level as Level) || typeof body.flag !== "string" || body.flag.length > 200)
    return Response.json({ error: "bad_request" }, { status: 400 });
  const level = body.level as Level;
  if (!(await checkFlag(player, level, body.flag))) return Response.json({ ok: false } satisfies FlagResult);

  const p = await solve(await scopeOf(request), player, cleanName(body.name) || "?", level, typeof body.prompt === "string" ? body.prompt : "");
  const s = p.solved[level]!;
  // Now that it is solved, the player may read what the AI had been told, and by which model.
  return Response.json({
    ok: true,
    solved: LEVELS.filter((l) => p.solved[l]),
    points: s.points,
    place: s.place,
    score: scoreOf(p),
    reveal: revealPrompt(level, await flagFor(player, level)),
    model: modelFor(tierOf(level)).model,
  } satisfies FlagResult);
};
