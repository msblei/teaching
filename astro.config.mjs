import { defineConfig, envField } from "astro/config";
import netlify from "@astrojs/netlify";
import svelte from "@astrojs/svelte";
import tailwindcss from "@tailwindcss/vite";

// Pages are prerendered (static) by default. A dynamic app opts in per route
// with `export const prerender = false`, which runs it as a Netlify Function.
export default defineConfig({
  site: "https://teach.mariusbleif.com",
  output: "static",
  // No edge functions here; skip their Deno emulation in dev.
  adapter: netlify({ devFeatures: { environmentVariables: false, images: true, edgeFunctions: false } }),
  integrations: [svelte()],
  vite: { plugins: [tailwindcss()] },
  env: {
    schema: {
      ADMIN_PASSWORD: envField.string({ context: "server", access: "secret", optional: true }),
      OPENROUTER_API_KEY: envField.string({ context: "server", access: "secret", optional: true }),
      WORKSHOP_CODES: envField.string({ context: "server", access: "secret", optional: true }),
      WORKSHOP_HOURLY_CAP: envField.string({ context: "server", access: "secret", optional: true }),
      LLM_TO_AGENT_CLAUDE_MODEL: envField.string({ context: "server", access: "secret", optional: true }),
      LLM_TO_AGENT_GPT_MODEL: envField.string({ context: "server", access: "secret", optional: true }),
      CACHE_MINUTES: envField.string({ context: "server", access: "secret", optional: true }),
    },
  },
});
