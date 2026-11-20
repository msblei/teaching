// Scenery for the shop: who sells each item, when it was listed, when a
// review was written. None of it reaches a model or decides a level; it only
// makes the pages read like a marketplace's.
import type { Lang } from "../../../lib/i18n";
import { ITEMS, type Item } from "../shared/catalog";

export type Seller = { name: string; since: number; sales: number; rating: number };

const SELLERS: Record<string, Seller> = {
  // Luca from the story of level 3: his camera, his reputation.
  "arosa-35": { name: "Luca M.", since: 2025, sales: 3, rating: 1.3 },
  "olympus-trip": { name: "Fotokeller Bern", since: 2019, sales: 412, rating: 4.9 },
  "canon-ae1": { name: "Stefan H.", since: 2021, sales: 27, rating: 4.7 },
  rennvelo: { name: "Velowerkstatt Töss", since: 2018, sales: 236, rating: 4.8 },
  ski: { name: "Familie Caduff", since: 2022, sales: 14, rating: 4.6 },
  sessel: { name: "Claire D.", since: 2023, sales: 9, rating: 4.4 },
  lampe: { name: "Atelier Messing", since: 2020, sales: 88, rating: 4.9 },
  plattenspieler: { name: "Vinyl-Urs", since: 2017, sales: 301, rating: 4.7 },
  gitarre: { name: "Miriam L.", since: 2024, sales: 5, rating: 5.0 },
  espresso: { name: "Kaffeebar Kreis 4", since: 2021, sales: 52, rating: 4.8 },
  rucksack: { name: "Fabian Z.", since: 2022, sales: 11, rating: 4.5 },
  schreibmaschine: { name: "Tastenwerk Biel", since: 2016, sales: 174, rating: 4.9 },
  radio: { name: "Röhren-Ruedi", since: 2019, sales: 67, rating: 4.6 },
  fernglas: { name: "Optik Calanda", since: 2020, sales: 129, rating: 4.9 },
  jumbo: { name: "Marco B.", since: 2023, sales: 8, rating: 4.5 },
};

/** The seller of an item. The player's own listing is sold by the player. */
export const sellerOf = (item: Item, playerName: string): Seller =>
  item.own ? { name: playerName || "…", since: new Date().getFullYear(), sales: 0, rating: 0 } : (SELLERS[item.id] ?? { name: "DigiBrocki", since: 2016, sales: 900, rating: 4.8 });

/** Days since the item was listed: the catalogue is in order of arrival, newest first. */
export const listedDays = (item: Item) => 2 + ITEMS.indexOf(item) * 2;

/** The item number printed on the page: the agent's listing number where there is one. */
export const itemNo = (item: Item) => item.listing ?? `L-${String(300 + ITEMS.indexOf(item) * 7)}`;

/** A date for the n-th review of an item, newest first, a few weeks apart. */
export function reviewDate(item: Item, n: number, lang: Lang): string {
  const days = listedDays(item) + 6 + n * 11 + (item.id.length % 5);
  return new Date(Date.now() - days * 864e5).toLocaleDateString(lang === "de" ? "de-CH" : "en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export const today = (lang: Lang) => new Date().toLocaleDateString(lang === "de" ? "de-CH" : "en-GB", { day: "numeric", month: "short", year: "numeric" });

export const chf = (n: number) => `CHF ${n.toFixed(2)}`;
