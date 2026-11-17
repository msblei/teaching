import { getSecret } from "astro:env/server";
import type { ModelTier } from "./levels";

// Which OpenRouter model plays which part. The weak one is an old, small
// model that follows almost any instruction it reads; the stronger one is a
// newer mid-size model. Current top models resisted every attack in the
// calibration run (see README), which is too hard for a 20-minute session.
//
// The host matters as much as the model. OpenRouter spreads an open model
// over several hosting providers, and they do not behave alike: on
// 2026-11-15 the same attacks worked 56 times out of 62 on DeepInfra,
// DekaLLM and Venice and 0 times out of 44 on Mistral's own hosting. So the
// default models are pinned to the host the levels were calibrated on,
// DeepInfra, which also took 20 requests at once without passing any on.
// The second name is only used if DeepInfra is down.
const DEFAULTS: Record<ModelTier, { model: string; providers: string[] }> = {
  weak: { model: "mistralai/mistral-nemo", providers: ["DeepInfra", "DekaLLM"] },
  strong: { model: "mistralai/mistral-small-3.2-24b-instruct", providers: ["DeepInfra", "Venice"] },
};
const ENV: Record<ModelTier, string> = { weak: "PROMPT_INJECTION_MODEL_WEAK", strong: "PROMPT_INJECTION_MODEL_STRONG" };

/** The model for a tier. A model set by env var runs wherever OpenRouter puts it: calibrate it first. */
export function modelFor(tier: ModelTier): { model: string; providers?: string[] } {
  const override = getSecret(ENV[tier])?.trim();
  return override ? { model: override } : DEFAULTS[tier];
}
