import type { Lang, Text } from "../../../lib/i18n";

// Stage 3 mission cards. Each template is one sentence with blanks the
// participant fills in ({key}); the rest of the instructions is fixed.
// The assembled text becomes the system prompt and can be shown in full.

export type Blank = { key: string; default: Text; width?: string };

export type Mission = {
  id: "deal" | "sell" | "kit";
  icon: "target" | "camera" | "bag";
  title: Text;
  /** One line on the card. */
  tagline: Text;
  /** Sentence shown on the card, with {key} placeholders rendered as inputs. */
  sentence: Text;
  blanks: Blank[];
  /** Fixed rules appended after the sentence. */
  rules: Text;
  /** First user message that starts the mission. */
  kickoff: Text;
  needsPhoto?: boolean;
};

export const MISSIONS: Mission[] = [
  {
    id: "deal",
    icon: "target",
    title: { de: "Deal-Check", en: "Deal check" },
    tagline: { de: "Bestes Angebot finden und verhandeln", en: "Find the best offer and negotiate" },
    sentence: {
      de: "Finde ein gebrauchtes {item} unter {budget} CHF auf tutti und schreibe dem Verkäufer des besten Angebots ein Angebot, {discount} % unter dem Preis.",
      en: "Find a used {item} under {budget} CHF on tutti and write the seller of the best deal an offer, {discount}% below asking.",
    },
    blanks: [
      { key: "item", default: { de: "Rennvelo, Rahmen 56", en: "road bike, frame size 56" }, width: "13rem" },
      { key: "budget", default: { de: "800", en: "800" }, width: "4rem" },
      { key: "discount", default: { de: "10", en: "10" }, width: "3rem" },
    ],
    rules: {
      de: `So gehst du vor:
1. Suche passende Inserate. Ignoriere Zubehör, Teile und defekte Velos.
2. Prüfe den Neupreis und vergleiche.
3. Lies die vielversprechendsten Inserate und achte auf Betrugsmerkmale (zu billig, Verkäufer erst seit Kurzem Mitglied, nur Vorauskasse, Kontakt per WhatsApp oder E-Mail statt über tutti).
4. Antworte mit den besten 3 Angeboten als Rangliste: Preis, Ersparnis gegenüber neu, kurzes Urteil, Link.
5. Schreibe zum Schluss eine kurze, freundliche Nachricht an den Verkäufer des besten Angebots in einem eigenen Codeblock, damit man sie kopieren kann.`,
      en: `How to work:
1. Search for matching listings. Ignore accessories, parts and broken bikes.
2. Check the new price and compare.
3. Read the most promising listings and look for scam signs (too cheap, seller only a member for a short time, prepayment only, contact via WhatsApp or email instead of tutti).
4. Answer with the best 3 offers as a ranked list: price, saving versus new, a short verdict, link.
5. Finish with a short, friendly message to the seller of the best offer in its own code block, so it can be copied.`,
    },
    kickoff: { de: "Los geht's.", en: "Go." },
  },
  {
    id: "sell",
    icon: "camera",
    title: { de: "Verkaufen", en: "Sell my stuff" },
    tagline: { de: "Foto rein, fertiges Inserat raus", en: "Photo in, ready listing out" },
    sentence: {
      de: "Ich will den Gegenstand auf meinem Foto verkaufen, Zustand: {condition}. Schätze einen fairen Preis und schreibe mir ein fertiges tutti-Inserat.",
      en: "I want to sell the item in my photo, condition: {condition}. Estimate a fair price and write me a ready-to-post tutti listing.",
    },
    blanks: [{ key: "condition", default: { de: "gut", en: "good" }, width: "7rem" }],
    rules: {
      de: `So gehst du vor:
1. Erkenne auf dem Foto möglichst genau, was es ist (Marke, Modell).
2. Suche vergleichbare Inserate auf tutti und prüfe den Neupreis.
3. Schlage zwei Preise vor: einen fairen Preis und einen Schnellverkaufspreis, kurz begründet.
4. Schreibe das Inserat (Titel, Beschreibung, Preis) in einen eigenen Codeblock, damit man es kopieren kann. Ehrlich, konkret, ohne Übertreibung.`,
      en: `How to work:
1. Identify the item in the photo as precisely as possible (brand, model).
2. Search for comparable listings on tutti and check the new price.
3. Suggest two prices: a fair price and a quick-sale price, with a short reason.
4. Write the listing (title, description, price) in its own code block, so it can be copied. Honest, concrete, no hype.`,
    },
    kickoff: { de: "Hier ist mein Foto.", en: "Here is my photo." },
    needsPhoto: true,
  },
  {
    id: "kit",
    icon: "bag",
    title: { de: "Starter-Set", en: "Starter kit" },
    tagline: { de: "Ein Budget, ein ganzes Set", en: "One budget, a whole kit" },
    sentence: {
      de: "Ich will mit {hobby} anfangen und habe {budget} CHF. Stelle mir ein gebrauchtes Starter-Set von tutti zusammen.",
      en: "I want to get into {hobby} and have {budget} CHF. Put together a used starter kit from tutti for me.",
    },
    blanks: [
      { key: "hobby", default: { de: "Skifahren", en: "skiing" }, width: "9rem" },
      { key: "budget", default: { de: "500", en: "500" }, width: "4rem" },
    ],
    rules: {
      de: `So gehst du vor:
1. Überlege zuerst, welche 3 bis 5 Dinge man wirklich braucht, und sag es kurz.
2. Suche für jedes Teil passende Inserate.
3. Wähle pro Teil das beste Angebot, sodass die Summe im Budget bleibt.
4. Antworte mit einer Tabelle (Teil, Inserat, Preis, Link) und der Gesamtsumme. Erkläre in einem Satz, wo du gespart hast.`,
      en: `How to work:
1. First decide which 3 to 5 things are really needed, and say so briefly.
2. Search for matching listings for each item.
3. Pick the best offer per item so the total stays within budget.
4. Answer with a table (item, listing, price, link) and the total. Explain in one sentence where you saved money.`,
    },
    kickoff: { de: "Los geht's.", en: "Go." },
  },
];

export function fillSentence(m: Mission, values: Record<string, string>, lang: Lang): string {
  return m.sentence[lang].replace(/\{(\w+)\}/g, (_, k) => values[k]?.trim() || m.blanks.find((b) => b.key === k)!.default[lang]);
}

/** The full instructions (system prompt) for a mission. */
export function buildInstructions(m: Mission, values: Record<string, string>, lang: Lang): string {
  const role =
    lang === "de"
      ? "Du bist mein persönlicher Shopping-Agent für die Schweiz. Antworte auf Deutsch, kurz und übersichtlich. Preise in CHF."
      : "You are my personal shopping agent for Switzerland. Answer in English, short and clear. Prices in CHF.";
  return `${role}\n\n${fillSentence(m, values, lang)}\n\n${m.rules[lang]}`;
}

/** Split a sentence template into text and blank parts, for rendering inputs inline. */
export function sentenceParts(m: Mission, lang: Lang): Array<{ text: string } | { blank: Blank }> {
  const parts: Array<{ text: string } | { blank: Blank }> = [];
  const re = /\{(\w+)\}/g;
  let last = 0;
  for (const match of m.sentence[lang].matchAll(re)) {
    parts.push({ text: m.sentence[lang].slice(last, match.index) });
    parts.push({ blank: m.blanks.find((b) => b.key === match[1])! });
    last = match.index! + match[0].length;
  }
  parts.push({ text: m.sentence[lang].slice(last) });
  return parts;
}
