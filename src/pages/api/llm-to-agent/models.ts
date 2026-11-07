import type { APIRoute } from "astro";
import { env } from "../../../apps/llm-to-agent/server/env";
import { MODEL_KEYS, describeModel } from "../../../apps/llm-to-agent/shared/types";

export const prerender = false;

// The exact models behind the picker, so the UI can name the real version.
export const GET: APIRoute = () => Response.json(MODEL_KEYS.map((k) => describeModel(k, env.modelId(k))));
