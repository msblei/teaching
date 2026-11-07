import type { ToolName } from "./types";
import type { Text } from "../../../lib/i18n";

// Tool definitions sent to the model, plus the labels the UI shows for them.
// Descriptions are what the model reads to decide when to use a tool.

type ToolDef = {
  name: ToolName;
  description: string;
  input_schema: {
    type: "object";
    properties: Record<string, unknown>;
    required: string[];
    additionalProperties: false;
  };
};

export const TOOL_DEFS: Record<ToolName, ToolDef> = {
  search_tutti: {
    name: "search_tutti",
    description:
      "Search current listings on tutti.ch, the Swiss classifieds marketplace for second-hand items. Returns up to 15 listings with title, price in CHF, location (postcode, town, canton), posting date, the start of the description, and URL. Use short product queries like a person would type them, in German, since tutti is a Swiss German-language site (e.g. 'Rennvelo 56', not 'road bike').",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search words in German, e.g. 'Rennvelo 56'" },
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
      "Look up the lowest current price for a NEW product in Swiss shops (toppreise.ch price comparison). Use it to judge whether a used offer is a good deal. Query brand and model only, without category words (e.g. 'Cube Attain', not 'Cube Attain Rennrad'). Older models are often no longer sold new: if nothing is found, try a comparable current model or a broader name.",
    input_schema: {
      type: "object",
      properties: {
        product: { type: "string", description: "Product name, as specific as possible" },
      },
      required: ["product"],
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
