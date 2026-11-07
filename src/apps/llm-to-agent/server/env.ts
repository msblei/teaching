import { getSecret } from "astro:env/server";
import type { ModelKey } from "../shared/types";

// All server config in one place. Values come from Netlify env vars
// (or .env in local dev).
export const env = {
  /** OpenRouter model ids behind the Claude / GPT picker. Same price tier by default. */
  modelId: (key: ModelKey) =>
    key === "gpt"
      ? getSecret("LLM_TO_AGENT_GPT_MODEL") || "openai/gpt-6-luna"
      : getSecret("LLM_TO_AGENT_CLAUDE_MODEL") || "anthropic/claude-haiku-5.5",
};
