import type { APIRoute } from "astro";
import { adminEnabled, checkPassword, clearCookie, recordFailure, sessionCookie, tooManyFailures } from "../../../lib/admin";

export const prerender = false;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const POST: APIRoute = async (ctx) => {
  if (!adminEnabled()) return new Response(null, { status: 404 });
  if (await tooManyFailures(ctx)) return Response.json({ error: "too_many" }, { status: 429 });
  const body = (await ctx.request.json().catch(() => ({}))) as { password?: unknown };
  if (typeof body.password !== "string" || !checkPassword(body.password)) {
    await recordFailure(ctx);
    await sleep(1000);
    return Response.json({ error: "wrong_password" }, { status: 401 });
  }
  return Response.json({ ok: true }, { headers: { "Set-Cookie": sessionCookie(ctx.request) } });
};

export const DELETE: APIRoute = ({ request }) => Response.json({ ok: true }, { headers: { "Set-Cookie": clearCookie(request) } });
