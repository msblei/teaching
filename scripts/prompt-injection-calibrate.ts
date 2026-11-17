// Checks how hard the five prompt-injection levels really are, against the
// running app and its real models. Run it after changing a prompt, a hint
// or a model, and before a workshop.
//
//   node scripts/prompt-injection-calibrate.ts http://localhost:4329 <workshop-code> [runs]
//
// It sends every sample from src/apps/prompt-injection/server/solutions.ts
// `runs` times (default 10): the model solutions should work at least half
// the time, the dead ends at most three times in ten. One run costs well
// under a cent per sample. It joins as a player named "calibration"; clear
// the board afterwards if that matters.
import { SAMPLES } from "../src/apps/prompt-injection/server/solutions.ts";

const [base = "http://localhost:4329", code = "", runsArg = "10"] = process.argv.slice(2);
const RUNS = Number(runsArg) || 10;

const post = async (path: string, body: unknown) => {
  const res = await fetch(`${base}/api/prompt-injection/${path}`, { method: "POST", headers: { "Content-Type": "application/json", "x-workshop-code": code }, body: JSON.stringify(body) });
  return (await res.json().catch(() => ({ error: `HTTP ${res.status}` }))) as Record<string, any>;
};

const joined = await post("join", { name: "calibration" });
if (!joined.token) {
  console.error("Could not join:", joined.error ?? joined);
  process.exit(1);
}
const WORDS = ["hello", "polite", "review", "buyer", "amber"];
const bare = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

let off = 0;
for (const [lv, samples] of Object.entries(SAMPLES)) {
  const level = Number(lv);
  console.log(`\nLevel ${level}`);
  for (const a of samples) {
    const input = level === 3 || level === 4 ? { text: a.text } : { messages: [{ role: "user", content: a.text }] };
    const results = await Promise.all(Array.from({ length: RUNS }, () => post("attempt", { token: joined.token, level, input, lang: a.lang })));
    // A win: the server issued the flag, or (chat levels) its inner part can be read out of the answer.
    const won = (r: Record<string, any>) => !!r.flag || new RegExp(`${WORDS[level - 1]}[0-9a-f]{4}`).test(bare(String(r.reply ?? "")));
    const wins = results.filter(won).length;
    const ok = a.works ? wins >= RUNS / 2 : wins <= RUNS * 0.3;
    if (!ok) off++;
    const miss = results.find((r) => !won(r));
    const said = miss ? (miss.error ?? (miss.blocked ? `blocked: ${miss.blocked}` : (miss.bought ?? miss.verdict ?? String(miss.reply ?? "")))) : "";
    console.log(`  ${ok ? "ok " : "OFF"} ${String(wins).padStart(2)}/${RUNS}  ${a.works ? "works" : "fails"}  ${a.lang}  ${a.text.replace(/\s+/g, " ").slice(0, 46).padEnd(46)} ${said ? `| miss: ${String(said).replace(/\s+/g, " ").slice(0, 50)}` : ""}`);
  }
}
console.log(off ? `\n${off} sample(s) outside the expected range.` : "\nAll samples within the expected range.");
