import type { Listing, ListingDetail, NewPrice } from "../../shared/types";
import { ebaySearchUrl as searchUrl } from "../sources/ebay";

// Recorded sample data, used only when the live sites can't be reached, so
// the demo prompts always work. Results from here are marked "demo" in the
// UI. Links point at the real eBay search page for the query.

const demo = (query: string, n: number) => `${searchUrl(query)}#demo-${n}`;

type SearchFixture = { keywords: string[]; listings: ListingDetail[] };

const iphone = (n: number, l: Omit<ListingDetail, "url">): ListingDetail => ({ ...l, url: demo("iphone 15", n) });

export const SEARCH_FIXTURES: SearchFixture[] = [
  {
    keywords: ["iphone"],
    listings: [
      iphone(1, { title: "iPhone 15 128GB Schwarz, Top Zustand", price: 480, location: "8004 Zürich (ZH)", description: "Immer mit Hülle und Panzerglas benutzt. Akku 91 %. Originalverpackung und Kabel dabei. Abholung oder Versand.", sellerName: "mobile_mike", sellerSince: "2014-05-02T10:00:00Z" }),
      iphone(2, { title: "Apple iPhone 15 128 GB Blau", price: 420, location: "3011 Bern (BE)", description: "Kleiner Kratzer am Rahmen, Display einwandfrei. Akku 87 %. Ohne Verpackung.", sellerName: "anna.b", sellerSince: "2018-09-14T10:00:00Z" }),
      iphone(3, { title: "iPhone 15 128GB NEU versiegelt!!! Schnell sein", price: 290, location: "1200 Genève (GE)", description: "Neu und versiegelt. Nur Vorauskasse per Banküberweisung. Bitte per WhatsApp melden, ich antworte schneller.", sellerName: "deal_store", sellerSince: "2026-11-01T10:00:00Z" }),
      iphone(4, { title: "iPhone 15 256GB Rosé mit Garantie", price: 590, location: "4051 Basel (BS)", description: "Gekauft im März, Apple-Garantie bis März nächstes Jahr. Quittung vorhanden.", sellerName: "baselbuy", sellerSince: "2016-02-20T10:00:00Z" }),
      iphone(5, { title: "iPhone 15 128GB Grün, Display gesprungen", price: 180, location: "6003 Luzern (LU)", description: "Display gesprungen, funktioniert sonst. Für Bastler.", sellerName: "luzi", sellerSince: "2020-07-07T10:00:00Z" }),
      iphone(6, { title: "iPhone 15 128GB Schwarz", price: 450, location: "9000 St. Gallen (SG)", description: "Akku 93 %, keine Kratzer, Rechnung vorhanden.", sellerName: "sg_tech", sellerSince: "2012-11-30T10:00:00Z" }),
    ],
  },
  {
    keywords: ["velo"],
    listings: [
      { title: "Rennvelo Alu, Rahmen 56, Shimano 105", price: 650, location: "8400 Winterthur (ZH)", url: demo("rennvelo", 1), description: "Regelmässig gewartet, neue Reifen und Kette. Rahmen 56 cm, passt ab ca. 1.78 m. Abholung in Winterthur, Probefahrt möglich.", sellerName: "veloschmid", sellerSince: "2015-04-01T10:00:00Z" },
      { title: "Cube Attain, Grösse 56, wie neu", price: 780, location: "3011 Bern (BE)", url: demo("rennvelo", 2), description: "Nur 800 km gefahren, Quittung vorhanden. Kleine Kratzer an der Kurbel.", sellerName: "bernbike", sellerSince: "2019-03-12T10:00:00Z" },
      { title: "Carbon Rennvelo NEU 56cm !!! nur heute", price: 290, location: "1200 Genève (GE)", url: demo("rennvelo", 3), description: "Neu, originalverpackt. Nur Vorauskasse per Überweisung, Versand aus dem Ausland. Bitte per WhatsApp melden.", sellerName: "bike_deals", sellerSince: "2026-11-01T10:00:00Z" },
      { title: "Peugeot Stahlrenner Rahmen 56, Vintage", price: 320, location: "4051 Basel (BS)", url: demo("rennvelo", 4), description: "Klassiker aus den 80ern, frisch revidiert. Schaltung am Unterrohr.", sellerName: "vintage_velo", sellerSince: "2013-10-10T10:00:00Z" },
      { title: "Rennvelo Rahmen 56, Gabel gerissen", price: 120, location: "6003 Luzern (LU)", url: demo("rennvelo", 5), description: "Gabel hat einen Riss, für Bastler oder Teile.", sellerName: "luzi", sellerSince: "2020-07-07T10:00:00Z" },
      { title: "Specialized Allez, Grösse 56", price: 590, location: "9000 St. Gallen (SG)", url: demo("rennvelo", 6), description: "Gepflegt, Service im Frühling. Pedale nicht inklusive.", sellerName: "sg_rider", sellerSince: "2012-11-30T10:00:00Z" },
    ],
  },
  // The goal card's default: a beginner ski kit under CHF 300, boots in size
  // 42, within 50 km of Zürich. The data is built so the agent has to work:
  // the obvious first picks are too far away or too expensive, one pair of
  // boots only gives its size in the description, and some listings don't
  // fit at all (children's sizes, damaged). It can be done for about CHF 225
  // to 295; with a budget of CHF 80 it can't. More specific sets come first.
  {
    keywords: ["set", "komplett", "ausrüstung"],
    listings: [
      { title: "Ski-Set komplett: Ski 160 cm, Schuhe Gr. 42, Stöcke", price: 250, location: "8500 Frauenfeld (TG)", url: demo("skiset", 1), description: "Komplettes Einsteiger-Set: Carving-Ski 160 cm mit Bindung, Skischuhe Grösse 42, Stöcke 120 cm. Ohne Helm. Nur zusammen abzugeben.", sellerName: "thurgau_winter", sellerSince: "2017-01-20T10:00:00Z" },
      { title: "Skiausrüstung komplett Damen, Schuhe Gr. 38", price: 180, location: "9000 St. Gallen (SG)", url: demo("skiset", 2), description: "Ski 150 cm, Schuhe Grösse 38, Stöcke, Helm S.", sellerName: "sg_schnee", sellerSince: "2015-11-03T10:00:00Z" },
    ],
  },
  {
    keywords: ["helm"],
    listings: [
      { title: "Skihelm Gr. M (55-59), wie neu", price: 35, location: "7270 Davos Platz (GR)", url: demo("skihelm", 1), description: "Eine Saison getragen, kein Sturz. Abholung in Davos.", sellerName: "davos_sport", sellerSince: "2017-06-06T10:00:00Z" },
      { title: "Uvex Skihelm M, 55-58 cm", price: 45, location: "8180 Bülach (ZH)", url: demo("skihelm", 2), description: "Guter Zustand, kein Sturz, Polster gewaschen.", sellerName: "buelach_max", sellerSince: "2016-03-09T10:00:00Z" },
      { title: "MIPS Skihelm Grösse L", price: 55, location: "6390 Engelberg (OW)", url: demo("skihelm", 3), description: "Mit MIPS, zwei Saisons alt.", sellerName: "engelberg_ski", sellerSince: "2013-10-10T10:00:00Z" },
      { title: "Giro Skihelm mit Visier, Gr. L", price: 70, location: "8953 Dietikon (ZH)", url: demo("skihelm", 4), description: "Visier ohne Kratzer, Originalbeutel dabei.", sellerName: "limmattal", sellerSince: "2019-12-01T10:00:00Z" },
      { title: "Kinder-Skihelm XS (48-52)", price: 15, location: "8004 Zürich (ZH)", url: demo("skihelm", 5), description: "Für Kinder bis ca. 6 Jahre.", sellerName: "familie_k", sellerSince: "2021-02-14T10:00:00Z" },
    ],
  },
  {
    keywords: ["schuh", "boot"],
    listings: [
      { title: "Nordica Skischuhe Herren, guter Zustand", price: 60, location: "8050 Zürich (ZH)", url: demo("skischuhe", 1), description: "Grösse 42 (Mondopoint 27). Schnallen einwandfrei, Innenschuh sauber. Bequemer Einsteigerschuh, Flex 80.", sellerName: "oerlikon_tom", sellerSince: "2014-08-21T10:00:00Z" },
      { title: "Salomon Skischuhe Gr. 42, kaum benutzt", price: 110, location: "8640 Rapperswil (SG)", url: demo("skischuhe", 2), description: "Nur fünf Skitage getragen. Mondopoint 27, Flex 90.", sellerName: "rappi", sellerSince: "2022-05-05T10:00:00Z" },
      { title: "Skischuhe Atomic, Mondopoint 27.5", price: 80, location: "3800 Interlaken (BE)", url: demo("skischuhe", 3), description: "Entspricht etwa Grösse 43. Sohle leicht abgelaufen.", sellerName: "berner_oberland", sellerSince: "2018-01-15T10:00:00Z" },
      { title: "Tecnica Skischuhe 42, neuwertig", price: 140, location: "6003 Luzern (LU)", url: demo("skischuhe", 4), description: "Letzten Winter gekauft, Quittung vorhanden.", sellerName: "luzi", sellerSince: "2020-07-07T10:00:00Z" },
      { title: "Lange Skischuhe Damen Gr. 39", price: 45, location: "8200 Schaffhausen (SH)", url: demo("skischuhe", 5), description: "Damenmodell, Grösse 39.", sellerName: "munot", sellerSince: "2018-10-30T10:00:00Z" },
      { title: "Kinder-Skischuhe Gr. 33", price: 20, location: "8004 Zürich (ZH)", url: demo("skischuhe", 6), description: "Für Kinder, vier Schnallen.", sellerName: "familie_k", sellerSince: "2021-02-14T10:00:00Z" },
    ],
  },
  {
    keywords: ["stöck", "stock", "stoeck", "pole"],
    listings: [
      { title: "Skistöcke Alu 120 cm", price: 10, location: "8600 Dübendorf (ZH)", url: demo("skistöcke", 1), description: "Ein paar Kratzer, Teller und Schlaufen in Ordnung.", sellerName: "duebi", sellerSince: "2016-06-18T10:00:00Z" },
      { title: "Skistöcke Leki 125 cm", price: 20, location: "8000 Zürich (ZH)", url: demo("skistöcke", 2), description: "Leki mit Trigger-Schlaufen, guter Zustand.", sellerName: "zh_winter", sellerSince: "2019-02-02T10:00:00Z" },
      { title: "Komperdell Carbon Stöcke 125 cm", price: 45, location: "3011 Bern (BE)", url: demo("skistöcke", 3), description: "Sehr leicht, fast neu.", sellerName: "bernbike", sellerSince: "2019-03-12T10:00:00Z" },
    ],
  },
  {
    keywords: ["brille", "goggle"],
    listings: [
      { title: "Skibrille Oakley, wie neu", price: 40, location: "6300 Zug (ZG)", url: demo("skibrille", 1), description: "Glas ohne Kratzer, mit Etui.", sellerName: "zug_sport", sellerSince: "2021-11-11T10:00:00Z" },
      { title: "Skibrille Uvex, Wechselglas", price: 25, location: "8400 Winterthur (ZH)", url: demo("skibrille", 2), description: "Zwei Gläser für Sonne und Nebel.", sellerName: "veloschmid", sellerSince: "2015-04-01T10:00:00Z" },
    ],
  },
  {
    keywords: ["ski"],
    listings: [
      { title: "Atomic Redster 165 cm mit Bindung, Top Zustand", price: 220, location: "8400 Winterthur (ZH)", url: demo("ski", 1), description: "Sportlicher Pistenski, frisch geschliffen und gewachst. Eher für Fortgeschrittene.", sellerName: "winti_carver", sellerSince: "2015-01-10T10:00:00Z" },
      { title: "Völkl Allmountain Ski 170 cm mit Bindung", price: 150, location: "1950 Sion (VS)", url: demo("ski", 2), description: "Vielseitiger Ski, Belag gut. Abholung im Wallis.", sellerName: "valais_ski", sellerSince: "2016-12-01T10:00:00Z" },
      { title: "Head Anfänger-Ski 160 cm mit Bindung", price: 120, location: "8610 Uster (ZH)", url: demo("ski", 3), description: "Ideal für Einsteiger, drehfreudig. Service letzten Winter gemacht, Bindung einstellbar.", sellerName: "uster_sport", sellerSince: "2018-04-04T10:00:00Z" },
      { title: "Carving-Ski 163 cm inkl. Bindung, Einsteiger", price: 90, location: "5400 Baden (AG)", url: demo("ski", 4), description: "Gutmütiger Carver für Anfänger. Kanten haben noch Reserve.", sellerName: "baden_ag", sellerSince: "2013-09-09T10:00:00Z" },
      { title: "Stöckli Laser 170 cm, Rennski", price: 380, location: "6300 Zug (ZG)", url: demo("ski", 5), description: "Top Ski für sehr gute Fahrer.", sellerName: "zug_sport", sellerSince: "2021-11-11T10:00:00Z" },
      { title: "Rossignol Ski 155 cm, Belag beschädigt", price: 40, location: "5000 Aarau (AG)", url: demo("ski", 6), description: "Tiefer Kratzer im Belag bis auf den Kern, Bindung defekt. Für Bastler.", sellerName: "aarau_keller", sellerSince: "2020-01-25T10:00:00Z" },
      { title: "Kinderski 110 cm mit Bindung", price: 35, location: "8004 Zürich (ZH)", url: demo("ski", 7), description: "Für Kinder von ca. 5 bis 7 Jahren.", sellerName: "familie_k", sellerSince: "2021-02-14T10:00:00Z" },
    ],
  },
];

const price = (product: string, lowestPrice: number, q: string): NewPrice => ({ product, lowestPrice, url: `https://www.toppreise.ch/produktsuche?q=${encodeURIComponent(q)}` });

export const PRICE_FIXTURES: Array<{ keywords: string[]; offers: NewPrice[] }> = [
  { keywords: ["iphone"], offers: [price("Apple iPhone 15 128GB", 543, "iphone 15")] },
  { keywords: ["velo"], offers: [price("Rennvelo Alu, Shimano 105", 1290, "rennvelo")] },
  { keywords: ["helm", "uvex", "giro"], offers: [price("Uvex Skihelm", 89, "skihelm")] },
  { keywords: ["schuh", "boot", "nordica", "salomon", "tecnica"], offers: [price("Skischuhe Herren, Flex 90", 229, "skischuhe")] },
  { keywords: ["stöck", "stock", "leki", "komperdell"], offers: [price("Leki Skistöcke Alu", 39, "skistöcke")] },
  { keywords: ["brille", "oakley"], offers: [price("Skibrille mit Wechselglas", 79, "skibrille")] },
  { keywords: ["redster"], offers: [price("Atomic Redster mit Bindung", 549, "atomic redster")] },
  { keywords: ["stöckli", "laser"], offers: [price("Stöckli Laser mit Bindung", 1190, "stöckli laser")] },
  { keywords: ["ski", "head", "völkl", "rossignol", "carving", "atomic"], offers: [price("Einsteiger-Ski mit Bindung", 349, "ski")] },
];

// A fixture answers a query that contains any of its keywords; the first match wins.
const matches = (q: string, keywords: string[]) => {
  const n = q.toLowerCase();
  return keywords.some((k) => n.includes(k));
};

export function demoSearch(query: string, maxPrice?: number): Listing[] | undefined {
  const f = SEARCH_FIXTURES.find((f) => matches(query, f.keywords));
  if (!f) return undefined;
  return f.listings
    .filter((l) => maxPrice === undefined || l.price <= maxPrice)
    .map(({ description, sellerName, sellerSince, ...l }) => ({ ...l, excerpt: description?.slice(0, 160) }));
}

export function demoListing(url: string): ListingDetail | undefined {
  for (const f of SEARCH_FIXTURES) {
    const l = f.listings.find((l) => l.url === url);
    if (l) return l;
  }
}

export function demoPrice(product: string): NewPrice[] | undefined {
  return PRICE_FIXTURES.find((f) => matches(product, f.keywords))?.offers;
}
