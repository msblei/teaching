// Shared by browser and server. Nothing secret lives here: system prompts,
// flags and win checks are in ../server.

export type Level = 1 | 2 | 3 | 4 | 5;
export const LEVELS: Level[] = [1, 2, 3, 4, 5];

/** Longest text a player can send in one go. */
export const MAX_INPUT = 600;
/** Chat levels: how many messages of the conversation (the player's and Bea's) go to the model. */
export const MAX_TURNS = 12;
export const MAX_NAME = 20;

export type Turn = { role: "user" | "assistant"; content: string };

/**
 * Points for solving a level, by place: the first player to crack it gets
 * the most, each later one a little less, down to a floor.
 */
export const pointsFor = (place: number) => Math.max(50, 100 - 10 * (place - 1));

/**
 * The text a model received, exactly as it was sent: the instructions, then
 * what followed, in pieces. `mine` marks the pieces the player wrote, so they
 * can be tinted without adding a single character.
 */
export type Sent = { system: string; parts: { text: string; mine?: boolean }[] };

/** What the player sends, depending on the level. */
export type AttemptInput = { messages: Turn[] } | { text: string; /** Level 3: the stars given with the review, 1 to 5. */ stars?: number };

export type AttemptResult = {
  /** What the AI feature said or did. */
  reply: string;
  /** The message never reached the model (level 5 input filter). */
  blocked?: string;
  /** Level 3: the verdict the summary published. Level 4: the listing the agent bought. */
  verdict?: "recommended" | "mixed" | "not_recommended";
  bought?: string;
  /** Set when the flag is visible to the player: leaked in `reply`, or issued for an action. */
  flag?: string;
  /** What the model was sent; only for levels without a secret in it. */
  sent?: Sent;
};

export type BoardRow = { name: string; score: number; solved: Level[]; you?: boolean };
/** Only ever the three best: nobody further down is shown anywhere. */
export type Board = { top: BoardRow[]; players: number; perLevel: Record<Level, number>; at: number };
export type Winning = { prompt: string; at: number };

export type FlagResult = {
  ok: boolean;
  solved?: Level[];
  points?: number;
  /** 1 = first in the room to solve this level. */
  place?: number;
  score?: number;
  /** What the AI feature had been told, and the model it ran on. */
  reveal?: string;
  model?: string;
};
