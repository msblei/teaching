import type { APIRoute } from "astro";
import { guard } from "../../../lib/workshop-access";
import { runTool } from "../../../apps/llm-to-agent/server/tools";
import { TOOL_NAMES, type ToolName } from "../../../apps/llm-to-agent/shared/types";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const denied = await guard(request, "llm-to-agent");
  if (denied) return denied;

  let body: { name?: unknown; input?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "bad_json" }, { status: 400 });
  }
  const { name, input } = body;
  if (typeof name !== "string" || !TOOL_NAMES.includes(name as ToolName) || !input || typeof input !== "object")
    return Response.json({ error: "bad_tool_call" }, { status: 400 });

  try {
    const run = await runTool(name as ToolName, input as Record<string, unknown>);
    return Response.json({ ok: true, result: run.result, meta: { url: run.url, ms: run.ms } });
  } catch (err) {
    // Returned with 200 so the browser hands it to the model as an error result.
    return Response.json({ ok: false, error: (err as Error).message });
  }
};
