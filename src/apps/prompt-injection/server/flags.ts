import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { getStoredSecret, setStoredSecret } from "../../../lib/admin";
import type { Level } from "../shared/types";

// Flags and player tokens are HMACs under one server secret, so nothing has
// to be stored to check them and no flag works for a second player. The
// secret is made on first use and kept with the other admin secrets.

const SECRET_NAME = "prompt-injection-hmac";
let cached: string | undefined;

async function secret(): Promise<string> {
  if (cached) return cached;
  let stored = (await getStoredSecret(SECRET_NAME))?.value;
  if (!stored) {
    await setStoredSecret(SECRET_NAME, randomBytes(32).toString("hex"));
    // Read back: if two instances raced, both end up with the one that was kept.
    stored = (await getStoredSecret(SECRET_NAME))?.value;
  }
  return (cached = stored!);
}

const mac = async (what: string) => createHmac("sha256", await secret()).update(what).digest("hex");

// Plain words on purpose: with "filter" as the word of level 5 the model
// dropped or mangled it, and the flag could not be put back together.
const WORDS: Record<Level, string> = { 1: "hello", 2: "polite", 3: "review", 4: "buyer", 5: "amber" };

export const flagFor = async (playerId: string, level: Level) => `FLAG{${WORDS[level]}-${(await mac(`flag:${playerId}:${level}`)).slice(0, 4)}}`;

/** Letters and digits only, so "f l a g { ... }" typed back from a spelled-out answer still counts. */
const bare = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

export async function checkFlag(playerId: string, level: Level, typed: string): Promise<boolean> {
  const want = Buffer.from(bare(await flagFor(playerId, level)));
  const got = Buffer.from(bare(typed));
  return got.length === want.length && timingSafeEqual(got, want);
}

export const newPlayerId = () => randomBytes(6).toString("hex");
export const tokenFor = async (id: string) => `${id}.${(await mac(`player:${id}`)).slice(0, 24)}`;

/** The player id of a token we issued, else undefined. */
export async function playerOf(token: unknown): Promise<string | undefined> {
  if (typeof token !== "string") return undefined;
  const [id, sig] = token.split(".");
  if (!id || !sig || !/^[0-9a-f]{12}$/.test(id)) return undefined;
  const want = Buffer.from((await tokenFor(id)).split(".")[1]);
  const got = Buffer.from(sig);
  return got.length === want.length && timingSafeEqual(got, want) ? id : undefined;
}
