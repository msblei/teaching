// Shapes shared by the browser and the server endpoints.

export type ToolName = "search_ebay" | "get_listing" | "check_new_price";
export const TOOL_NAMES: ToolName[] = ["search_ebay", "get_listing", "check_new_price"];

/**
 * A tool the harness runs itself (in the browser, no website involved): the
 * agent reports its progress on the goal, the harness checks it.
 */
export const GOAL_TOOL = "track_goal";
export type AgentTool = ToolName | typeof GOAL_TOOL;
export const AGENT_TOOLS: AgentTool[] = [...TOOL_NAMES, GOAL_TOOL];

/** One thing the goal needs, with the listing currently picked for it. */
export type GoalItem = { name: string; found: boolean; title?: string; price?: number; location?: string; url?: string };

/** The goal as the harness tracks it. Prices and sums come from tool results, never from the model. */
export type Goal = {
  items: GoalItem[];
  budget: number; // CHF
  total: number; // CHF, each listing counted once
  /** All items found and the total within budget. */
  reached: boolean;
  /** The agent's own line on what it does next. */
  note?: string;
  /** How often the agent has reported so far. */
  updates: number;
};

/** Where a tool result came from. "demo" is recorded sample data, shown with a marker in the UI. */
export type DataSource = "live" | "cache" | "demo";

export type Listing = {
  title: string;
  price: number; // CHF, without shipping; 0 = free
  location?: string; // "88*** (DE)", demo data: "8004 Zürich (ZH)"
  postedAt?: string; // ISO date
  excerpt?: string; // start of the description
  imageUrl?: string;
  url: string;
};

export type ListingDetail = Listing & {
  description?: string;
  sellerName?: string;
  /** ISO date the seller's account was created; very new accounts are a scam sign. */
  sellerSince?: string;
};

export type NewPrice = {
  product: string;
  lowestPrice: number; // CHF, incl. shipping
  offers?: number; // number of shops
  shop?: string;
  url: string;
};

export type ToolResult =
  | { tool: "search_ebay"; source: DataSource; query: string; listings: Listing[] }
  | { tool: "get_listing"; source: DataSource; listing: ListingDetail }
  | { tool: "check_new_price"; source: DataSource; offers: NewPrice[] };

// ---- Models (via OpenRouter) ----

/** The browser only ever names a model family; the server maps it to an id. */
export type ModelKey = "claude" | "gpt";
export const MODEL_KEYS: ModelKey[] = ["claude", "gpt"];
export const MODEL_LABELS: Record<ModelKey, string> = { claude: "Claude", gpt: "GPT" };

export type ModelInfo = { key: ModelKey; id: string; label: string; provider: string };

/** "anthropic/claude-haiku-5.5" -> "Claude Haiku 5.5", "openai/gpt-6-luna" -> "GPT-6 Luna". */
export function describeModel(key: ModelKey, id: string): ModelInfo {
  const [vendor, name = vendor] = id.split("/");
  const provider = vendor === "openai" ? "OpenAI" : vendor === "anthropic" ? "Anthropic" : vendor;
  const words = name.split("-");
  const label =
    words[0] === "gpt"
      ? [`GPT-${words[1] ?? ""}`, ...words.slice(2).map(cap)].join(" ")
      : words.map(cap).join(" ");
  return { key, id, label, provider };
}
const cap = (w: string) => (w ? w[0].toUpperCase() + w.slice(1) : w);

// ---- Chat messages (OpenAI-compatible format, as used by OpenRouter) ----

export type ToolCall = { id: string; type: "function"; function: { name: string; arguments: string } };

export type ContentPart = { type: "text"; text: string } | { type: "image_url"; image_url: { url: string } };

export type ChatMessage =
  | { role: "user"; content: string | ContentPart[] }
  | {
      role: "assistant";
      content: string | null;
      tool_calls?: ToolCall[];
      /** Provider reasoning state; passed back unchanged, but only to the model that wrote it. */
      reasoning_details?: unknown[];
      /** Which model family wrote this turn (ours, stripped before sending). */
      model?: ModelKey;
    }
  | { role: "tool"; tool_call_id: string; content: string };
