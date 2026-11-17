import type { APIRoute } from "astro";
import { CODE_HEADER, closed, gate, getAccess } from "../../../lib/workshop-access";
import { playerOf } from "../../../apps/prompt-injection/server/flags";
import { board, scopeOf } from "../../../apps/prompt-injection/server/players";

export const prerender = false;

// The leaderboard of this workshop code. Polled by the board page, so it
// does not count toward the hourly cap.
export const GET: APIRoute = async ({ request }) => {
  const state = gate(await getAccess("prompt-injection"), request.headers.get(CODE_HEADER));
  if (state !== "open") return closed(state);
  const me = await playerOf(request.headers.get("x-player"));
  return Response.json(await board(await scopeOf(request), me), { headers: { "Cache-Control": "no-store" } });
};
