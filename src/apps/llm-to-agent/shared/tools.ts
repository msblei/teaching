import type { AgentTool, ToolName } from "./types";
import type { Text } from "../../../lib/i18n";

// Tool definitions sent to the model, plus the labels the UI shows for them.
// Descriptions are what the model reads to decide when to use a tool.

type ToolDef = {
  name: AgentTool;
  description: string;
  input_schema: {
    type: "object";
    properties: Record<string, unknown>;
    required: string[];
    additionalProperties: false;
  };
};

export const TOOL_DEFS: Record<AgentTool, ToolDef> = {
  search_tutti: {
    name: "search_tutti",
    description:
      "Search current listings on tutti.ch, the Swiss classifieds marketplace for second-hand items. Returns up to 15 listings with title, price in CHF, location (postcode, town, canton), posting date, the start of the description, and URL. Use short product queries like a person would type them, in German, since tutti is a Swiss German-language site (e.g. 'Skischuhe 42', not 'ski boots').",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search words in German, e.g. 'Skischuhe 42'" },
        max_price: { type: "number", description: "Optional upper price limit in CHF" },
      },
      required: ["query"],
      additionalProperties: false,
    },
  },
  get_listing: {
    name: "get_listing",
    description:
      "Get the full details of one tutti.ch listing: full description, seller name and since when the seller is a member, location. Use it to judge condition or spot scam signs before recommending a listing.",
    input_schema: {
      type: "object",
      properties: {
        url: { type: "string", description: "The listing URL returned by search_tutti" },
      },
      required: ["url"],
      additionalProperties: false,
    },
  },
  check_new_price: {
    name: "check_new_price",
    description:
      "Look up the lowest current price for a NEW product in Swiss shops (toppreise.ch price comparison). Use it to judge whether a used offer is a good deal. Query brand and model only, without category words (e.g. 'Atomic Redster', not 'Atomic Redster Ski'). Older models are often no longer sold new: if nothing is found, try a comparable current model or a broader name.",
    input_schema: {
      type: "object",
      properties: {
        product: { type: "string", description: "Product name, as specific as possible" },
      },
      required: ["product"],
      additionalProperties: false,
    },
  },
  // Only offered while a goal is active. Answered by the harness, see ui/agent.ts.
  track_goal: {
    name: "track_goal",
    description:
      "Report your progress on the user's goal to the harness. Call it after every round of searching and whenever your selection changes. Always send the complete current list: one entry per item the user needs, with the tutti listing you currently pick for it, or found=false while you have none. The harness checks every URL against your tool results, adds up the real prices itself and answers with what is still open and how much budget is left. If one listing covers several items (a set), give the same URL for each of them; it is counted once.",
    input_schema: {
      type: "object",
      properties: {
        budget_chf: { type: "number", description: "The total budget in CHF the user currently asks for" },
        items: {
          type: "array",
          description: "Every item the goal needs, found or not",
          items: {
            type: "object",
            properties: {
              name: { type: "string", description: "Short name of the item in the user's language, e.g. 'Helm'" },
              found: { type: "boolean", description: "true if you picked a listing for it" },
              url: { type: "string", description: "URL of the picked listing, exactly as returned by search_tutti" },
            },
            required: ["name", "found"],
          },
        },
        note: { type: "string", description: "One short sentence in the user's language: what you do next and why" },
      },
      required: ["budget_chf", "items"],
      additionalProperties: false,
    },
  },
};

export type IconName = "search" | "file" | "tag";

export const TOOL_LABELS: Record<ToolName, { label: Text; desc: Text; running: Text; done: Text; icon: IconName }> = {
  search_tutti: {
    label: { de: "tutti-Suche", en: "tutti search" },
    desc: { de: "Aktuelle Inserate auf tutti.ch", en: "Current listings on tutti.ch" },
    running: { de: "Durchsucht tutti", en: "Searching tutti" },
    done: { de: "tutti durchsucht", en: "Searched tutti" },
    icon: "search",
  },
  get_listing: {
    label: { de: "Inserat lesen", en: "Read listing" },
    desc: { de: "Beschreibung und Verkäufer auf tutti.ch", en: "Description and seller on tutti.ch" },
    running: { de: "Liest Inserat", en: "Reading listing" },
    done: { de: "Inserat gelesen", en: "Read listing" },
    icon: "file",
  },
  check_new_price: {
    label: { de: "Neupreis prüfen", en: "Check new price" },
    desc: { de: "Tiefster Neupreis auf toppreise.ch", en: "Lowest new price on toppreise.ch" },
    running: { de: "Prüft Neupreis", en: "Checking new price" },
    done: { de: "Neupreis geprüft", en: "Checked new price" },
    icon: "tag",
  },
};
