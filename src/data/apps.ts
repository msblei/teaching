import type { Text } from "../lib/i18n";

// Registry of teaching tools, rendered on the index page in this order: from the
// foundations of machine learning, through neural networks and LLMs, to working with them.
// `kind`: "dynamic" has server endpoints under src/pages/api/<slug>/, "static"
// has no backend of its own, "placeholder" is not built yet and only shows a
// code screen (src/pages/[slug].astro). Each slug gets its access setting on /admin.
// `icon` is a file in public/.
export type App = {
  slug: string;
  title: Text;
  kind: "static" | "dynamic" | "placeholder";
  icon: string;
};

export const apps: App[] = [
  { slug: "loss-functions", title: { de: "Verlustfunktionen", en: "Loss Functions" }, kind: "placeholder", icon: "/icons/loss-functions.svg" },
  { slug: "gradient-descent", title: { de: "Gradientenabstieg", en: "Gradient Descent" }, kind: "placeholder", icon: "/icons/gradient-descent.svg" },
  { slug: "support-vector-machines", title: { de: "Support Vector Machines", en: "Support Vector Machines" }, kind: "placeholder", icon: "/icons/support-vector-machines.svg" },
  { slug: "backpropagation", title: { de: "Backpropagation", en: "Backpropagation" }, kind: "placeholder", icon: "/icons/backpropagation.svg" },
  { slug: "generative-adversarial-networks", title: { de: "Generative Adversarial Networks (GANs)", en: "Generative Adversarial Networks (GANs)" }, kind: "placeholder", icon: "/icons/generative-adversarial-networks.svg" },
  { slug: "attention", title: { de: "Attention-Mechanismus", en: "Attention Mechanism" }, kind: "placeholder", icon: "/icons/attention.svg" },
  { slug: "transformer", title: { de: "Transformer-Architektur", en: "Transformer Architecture" }, kind: "placeholder", icon: "/icons/transformer.svg" },
  { slug: "llm-reasoning", title: { de: "LLM-Reasoning", en: "LLM Reasoning" }, kind: "placeholder", icon: "/icons/llm-reasoning.svg" },
  {
    slug: "llm-to-agent",
    title: { de: "Vom Sprachmodell zum Agenten", en: "From LLM to Agent" },
    kind: "dynamic",
    icon: "/icons/llm-to-agent.svg",
  },
  {
    slug: "ai-coding-workshop",
    title: { de: "AI Coding Workshop", en: "AI Coding Workshop" },
    kind: "static",
    icon: "/icons/ai-coding-workshop.svg",
  },
];
