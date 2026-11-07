import type { APIRoute } from "astro";
import { CODE_HEADER, isValidCode } from "../../../lib/workshop-access";

export const prerender = false;

// Lets the page check a workshop code before the first chat message.
export const POST: APIRoute = async ({ request }) =>
  (await isValidCode(request.headers.get(CODE_HEADER)))
    ? Response.json({ ok: true })
    : Response.json({ error: "invalid_code" }, { status: 401 });
