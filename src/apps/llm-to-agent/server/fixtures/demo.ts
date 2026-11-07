import type { Listing, ListingDetail, NewPrice } from "../../shared/types";
import { searchUrl } from "../sources/tutti";

// Recorded sample data, used only when the live sites can't be reached, so
// the demo prompts always work. Results from here are marked "demo" in the
// UI. Links point at the real tutti search page for the query.

const demo = (query: string, n: number) => `${searchUrl(query)}#demo-${n}`;

type SearchFixture = { keywords: string[]; listings: ListingDetail[] };

const iphone = (n: number, l: Omit<ListingDetail, "url">): ListingDetail => ({ ...l, url: demo("iphone 15", n) });

export const SEARCH_FIXTURES: SearchFixture[] = [
  {
    keywords: ["iphone", "15"],
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
  {
    keywords: ["skihelm"],
    listings: [
      { title: "Skihelm Gr. M (55-59), wie neu", price: 35, location: "7270 Davos Platz (GR)", url: demo("skihelm", 1), sellerName: "davos_sport", sellerSince: "2017-06-06T10:00:00Z" },
      { title: "MIPS Skihelm Grösse L", price: 55, location: "6390 Engelberg (OW)", url: demo("skihelm", 2), sellerName: "engelberg_ski", sellerSince: "2013-10-10T10:00:00Z" },
    ],
  },
  {
    keywords: ["skischuh"],
    listings: [
      { title: "Skischuhe Atomic, Mondopoint 27.5", price: 80, location: "3800 Interlaken (BE)", url: demo("skischuhe", 1), sellerName: "berner_oberland", sellerSince: "2018-01-15T10:00:00Z" },
      { title: "Salomon Skischuhe Gr. 42, kaum benutzt", price: 110, location: "8640 Rapperswil (SG)", url: demo("skischuhe", 2), sellerName: "rappi", sellerSince: "2022-05-05T10:00:00Z" },
    ],
  },
  {
    keywords: ["ski"],
    listings: [
      { title: "Allmountain Ski 170 cm mit Bindung", price: 150, location: "1950 Sion (VS)", url: demo("ski", 1), sellerName: "valais_ski", sellerSince: "2016-12-01T10:00:00Z" },
      { title: "Skistöcke Leki 125 cm", price: 20, location: "8000 Zürich (ZH)", url: demo("ski", 2), sellerName: "zh_winter", sellerSince: "2019-02-02T10:00:00Z" },
      { title: "Skibrille Oakley, wie neu", price: 40, location: "6300 Zug (ZG)", url: demo("ski", 3), sellerName: "zug_sport", sellerSince: "2021-11-11T10:00:00Z" },
    ],
  },
];

export const PRICE_FIXTURES: Array<{ keywords: string[]; offers: NewPrice[] }> = [
  { keywords: ["iphone", "15"], offers: [{ product: "Apple iPhone 15 128GB", lowestPrice: 543, url: "https://www.toppreise.ch/produktsuche?q=iphone%2015" }] },
  { keywords: ["velo"], offers: [{ product: "Rennvelo Alu, Shimano 105", lowestPrice: 1290, url: "https://www.toppreise.ch/produktsuche?q=rennvelo" }] },
  { keywords: ["skihelm"], offers: [{ product: "Skihelm MIPS", lowestPrice: 89, url: "https://www.toppreise.ch/produktsuche?q=skihelm" }] },
  { keywords: ["ski"], offers: [{ product: "Allmountain Ski mit Bindung", lowestPrice: 499, url: "https://www.toppreise.ch/produktsuche?q=ski" }] },
];

const matches = (q: string, keywords: string[]) => {
  const n = q.toLowerCase();
  return keywords.every((k) => n.includes(k));
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
