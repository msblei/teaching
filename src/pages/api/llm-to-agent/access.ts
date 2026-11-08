import type { APIRoute } from "astro";
import { CODE_HEADER, closed, gate, getAccess } from "../../../lib/workshop-access";

export const prerender = false;

// Lets the page ask whether it is open, needs a code or is off, and check a
// code, before the first chat message.
export const POST: APIRoute = async ({ request }) => {
  const state = gate(await getAccess("llm-to-agent"), request.headers.get(CODE_HEADER));
  return state === "open" ? Response.json({ ok: true }) : closed(state);
};
