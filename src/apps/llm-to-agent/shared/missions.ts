import type { Lang, Text } from "../../../lib/i18n";
import type { Goal } from "./types";

// Stage 3: one goal card. The goal is a sentence with blanks the participant
// fills in ({key}); the rest of the instructions is fixed. The assembled text
// becomes the system prompt and can be shown in full.
//
// One card on purpose: a goal with a checkable end (every item found, total
// within budget) that a single search can't meet. The agent has to split it
// up, search several times, notice it isn't there yet, adapt, and stop.

export type Blank = { key: string; default: Text; width?: string };

/** The most model requests one message may set off while a goal is active. */
export const GOAL_STEPS = 15;

export type Mission = {
  /** Sentence shown on the card, with {key} placeholders rendered as inputs. */
  sentence: Text;
  blanks: Blank[];
  /** Fixed rules appended after the sentence. */
  rules: Text;
  /** First user message that starts the run. */
  kickoff: Text;
};

export const MISSION: Mission = {
  sentence: {
    de: "Stelle mir ein komplettes {kit} zusammen: {items}. Alles gebraucht von tutti.ch, zusammen höchstens {budget} CHF. Ausserdem: {wish}.",
    en: "Put together a complete {kit} for me: {items}. All second-hand from tutti.ch, at most CHF {budget} in total. Also: {wish}.",
  },
  blanks: [
    { key: "kit", default: { de: "Ski-Set für Anfänger", en: "beginner ski kit" }, width: "13rem" },
    { key: "items", default: { de: "Ski, Skischuhe, Helm, Stöcke", en: "skis, ski boots, helmet, poles" }, width: "17rem" },
    { key: "budget", default: { de: "300", en: "300" }, width: "4.5rem" },
    {
      key: "wish",
      default: { de: "Skischuhe in Grösse 42, alles höchstens 50 km von Zürich", en: "ski boots in size 42, everything within 50 km of Zürich" },
      width: "28rem",
    },
  ],
  rules: {
    de: `So gehst du vor:
1. Suche jedes Teil einzeln. Ignoriere Inserate, die nicht passen (anderes Produkt, defekt, Kindergrösse, nur Zubehör).
2. Melde nach jeder Suchrunde mit track_goal deine ganze aktuelle Auswahl. Der Harness prüft deine Links, rechnet die echten Preise zusammen und sagt dir, was noch offen ist. Verlass dich auf seine Summe, nicht auf deine eigene.
3. Fehlt etwas oder ist die Summe zu hoch, passe dich an: andere Suchwörter, ein günstigeres Inserat, ein Set, das mehrere Teile abdeckt. Lies ein Inserat (get_listing), wenn der Titel offen lässt, ob es zu meinen Wünschen passt, zum Beispiel die Grösse. Entfernungen schätzt du aus Postleitzahl und Ort.
4. Du hast höchstens ${GOAL_STEPS} Schritte. Höre auf, sobald der Harness das Ziel bestätigt.
5. Schlussantwort: eine Tabelle (Teil, Inserat, Ort, Preis, Link zum Inserat) und die Gesamtsumme. Dazu ein Satz, wo du dich anpassen musstest.
6. Ist das Ziel nicht erreichbar, sag es klar: was fehlt, was am nächsten herankommt und was es kosten würde. Erfinde nie Inserate oder Preise.`,
    en: `How to work:
1. Search for each item separately. Ignore listings that don't fit (different product, broken, children's size, accessories only).
2. After every round of searching, report your complete current selection with track_goal. The harness checks your links, adds up the real prices and tells you what is still open. Rely on its total, not on your own.
3. If something is missing or the total is too high, adapt: other search words, a cheaper listing, a set that covers several items. Read a listing (get_listing) when the title leaves open whether it fits my wishes, for example the size. Estimate distances from postcode and town.
4. You have at most ${GOAL_STEPS} steps. Stop as soon as the harness confirms the goal.
5. Final answer: a table (item, listing, place, price, link to the listing) and the total. Add one sentence on where you had to adapt.
6. If the goal can't be reached, say so plainly: what is missing, what comes closest, and what it would cost. Never invent listings or prices.`,
  },
  kickoff: { de: "Los geht's.", en: "Go." },
};

const value = (values: Record<string, string>, key: string, lang: Lang) =>
  values[key]?.trim() || MISSION.blanks.find((b) => b.key === key)!.default[lang];

export function fillSentence(values: Record<string, string>, lang: Lang): string {
  return MISSION.sentence[lang].replace(/\{(\w+)\}/g, (_, k) => value(values, k, lang));
}

/** The full instructions (system prompt) for the goal. */
export function buildInstructions(values: Record<string, string>, lang: Lang): string {
  const role =
    lang === "de"
      ? "Du bist mein persönlicher Shopping-Agent für die Schweiz. Antworte auf Deutsch, kurz und übersichtlich. Preise in CHF."
      : "You are my personal shopping agent for Switzerland. Answer in English, short and clear. Prices in CHF.";
  return `${role}\n\n${lang === "de" ? "Mein Ziel" : "My goal"}: ${fillSentence(values, lang)}\n\n${MISSION.rules[lang]}`;
}

/** What the tracker shows before the agent's first report: every item open. */
export function initialGoal(values: Record<string, string>, lang: Lang): Goal {
  const items = value(values, "items", lang)
    .split(/[,;\n]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 12);
  const budget = Number(value(values, "budget", lang).replace(/[^\d.]/g, "")) || 0;
  return { items: items.map((name) => ({ name, found: false })), budget, total: 0, reached: false, updates: 0 };
}

/** Short name of the goal, for the divider and the chip in the composer. */
export const goalLabel = (values: Record<string, string>, lang: Lang): string => value(values, "kit", lang);

/** Split the sentence template into text and blank parts, for rendering inputs inline. */
export function sentenceParts(lang: Lang): Array<{ text: string } | { blank: Blank }> {
  const parts: Array<{ text: string } | { blank: Blank }> = [];
  let last = 0;
  for (const match of MISSION.sentence[lang].matchAll(/\{(\w+)\}/g)) {
    parts.push({ text: MISSION.sentence[lang].slice(last, match.index) });
    parts.push({ blank: MISSION.blanks.find((b) => b.key === match[1])! });
    last = match.index! + match[0].length;
  }
  parts.push({ text: MISSION.sentence[lang].slice(last) });
  return parts;
}
