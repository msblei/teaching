import type { Text } from "../lib/i18n";

// Registry of teaching tools, rendered on the index page in this order.
// `kind` documents how the app runs: "static" is fully prerendered,
// "dynamic" has server endpoints under src/pages/api/<slug>/.
// `icon` is a file in public/.
export type App = {
  slug: string;
  title: Text;
  tagline: Text;
  kind: "static" | "dynamic";
  icon: string;
};

export const apps: App[] = [
  {
    slug: "llm-to-agent",
    title: { de: "Vom Sprachmodell zum Agenten", en: "From LLM to Agent" },
    tagline: {
      de: "Modell, Werkzeuge, Anweisungen: in 20 Minuten zum eigenen Agenten.",
      en: "Model, tools, instructions: build your own agent in 20 minutes.",
    },
    kind: "dynamic",
    icon: "/icons/llm-to-agent.svg",
  },
  {
    slug: "ai-coding-workshop",
    title: { de: "AI Coding Workshop", en: "AI Coding Workshop" },
    tagline: {
      de: "Mit einem KI-Assistenten eine App bauen: erst frei, dann mit Plan.",
      en: "Build an app with an AI coding assistant: vibe first, then with a plan.",
    },
    kind: "static",
    icon: "/icons/ai-coding-workshop.svg",
  },
];
