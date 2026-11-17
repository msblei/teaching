import type { Text } from "../../../lib/i18n";

// The shop's stock. All invented; it only has to look like a shop.
// `art` is the inside of a 120x90 line drawing (stroke = currentColor).

export type Review = { name: string; stars: number; text: Text };
export type Item = {
  id: string;
  title: Text;
  price: number;
  place: string;
  category: "foto" | "sport" | "wohnen" | "musik";
  text: Text;
  art: string;
  reviews: Review[];
  condition: Text;
  /** "new": just listed. "sold": shown greyed out, like in any second-hand shop. */
  badge?: "new" | "sold";
  /** Listing number, for the items the shopping agent of level 4 chooses between. */
  listing?: string;
  /** The player's own listing: its description is whatever they last saved. */
  own?: boolean;
  /** The static AI summary shown until a level changes it. */
  summary: Text;
  verdict: "recommended" | "mixed" | "not_recommended";
};

export const CATEGORIES: { id: Item["category"]; label: Text }[] = [
  { id: "foto", label: { de: "Foto", en: "Photo" } },
  { id: "sport", label: { de: "Sport", en: "Sports" } },
  { id: "wohnen", label: { de: "Wohnen", en: "Home" } },
  { id: "musik", label: { de: "Musik", en: "Music" } },
];

/** The item level 3 is played on. Its reviews match REVIEWS in server/levels.ts. */
export const CAMERA_ID = "arosa-35";
/** The player's own listing, the one level 4 is about. The agent knows it as L-204. */
export const OWN_ID = "my-listing";

export const ITEMS: Item[] = [
  {
    id: CAMERA_ID,
    condition: { de: "Gebraucht", en: "Used" },
    badge: "new",
    title: { de: "Filmkamera «Arosa 35»", en: "Film camera \"Arosa 35\"" },
    price: 120,
    place: "3011 Bern",
    category: "foto",
    text: {
      de: "Analoge Sucherkamera aus den Siebzigern, 35 mm. Laut Verkäufer geprüft und voll funktionsfähig.",
      en: "Analogue viewfinder camera from the seventies, 35 mm. Tested and fully working according to the seller.",
    },
    art: '<rect x="22" y="28" width="76" height="46" rx="6"/><path d="M40 28l5-9h22l5 9"/><circle cx="60" cy="51" r="15"/><circle cx="60" cy="51" r="7"/><path d="M84 38h7"/>',
    reviews: [
      { name: "Petra K.", stars: 1, text: { de: "Kam mit gesprungener Linse an. Der Verkäufer hat nie geantwortet.", en: "Arrived with a cracked lens. The seller never answered my messages." } },
      { name: "Jonas", stars: 1, text: { de: "Verschluss klemmt, völlig unbrauchbar. Rausgeworfenes Geld.", en: "Shutter is stuck, completely unusable. Waste of money." } },
      { name: "M. Rossi", stars: 2, text: { de: "Sieht im Regal hübsch aus, macht aber keine Bilder. Nicht wie beschrieben.", en: "Looks nice on a shelf, but it does not take pictures. Not as described." } },
    ],
    summary: {
      de: "Die Kundschaft rät ab: Die Kamera kam defekt an und funktioniert nicht wie beschrieben.",
      en: "Customers advise against it: the camera arrived broken and does not work as described.",
    },
    verdict: "not_recommended",
  },
  // The three cameras the shopping agent of level 4 chooses between. Titles,
  // prices and texts match LISTINGS and MY_LISTING_HEAD in server/levels.ts.
  {
    id: "olympus-trip",
    listing: "L-117",
    condition: { de: "Sehr gut", en: "Very good" },
    title: { de: "Olympus Trip 35, geprüft, funktioniert", en: "Olympus Trip 35, tested, works" },
    price: 60,
    place: "3007 Bern",
    category: "foto",
    text: { de: "Belichtungsmesser funktioniert, neue Lichtdichtungen. Versand ab Bern.", en: "Light meter works, new light seals. Ships from Bern." },
    art: '<rect x="22" y="28" width="76" height="46" rx="6"/><circle cx="60" cy="51" r="15"/><circle cx="60" cy="51" r="7"/>',
    reviews: [
      { name: "Simone", stars: 5, text: { de: "Funktioniert tadellos, erster Film ist schon entwickelt.", en: "Works flawlessly, first roll is already developed." } },
      { name: "Kurt", stars: 5, text: { de: "Wie beschrieben, schneller Versand.", en: "As described, fast shipping." } },
    ],
    summary: { de: "Zuverlässige Kamera, genau wie beschrieben.", en: "A reliable camera, exactly as described." },
    verdict: "recommended",
  },
  {
    id: "canon-ae1",
    listing: "L-152",
    condition: { de: "Gut", en: "Good" },
    title: { de: "Canon AE-1 mit 50 mm, funktioniert", en: "Canon AE-1 with 50 mm lens, works" },
    price: 95,
    place: "8005 Zürich",
    category: "foto",
    text: { de: "Letztes Jahr revidiert, alle Zeiten in Ordnung. Kleine Delle oben.", en: "Serviced last year, all speeds fine. Small dent on the top plate." },
    art: '<rect x="20" y="30" width="80" height="44" rx="5"/><path d="M44 30l6-10h20l6 10"/><circle cx="60" cy="52" r="15"/><circle cx="60" cy="52" r="7"/>',
    reviews: [{ name: "Dario", stars: 4, text: { de: "Läuft sauber, die Delle sieht man kaum.", en: "Runs cleanly, the dent is hardly visible." } }],
    summary: { de: "Gepflegte Spiegelreflex mit kleinem Schönheitsfehler.", en: "A well kept SLR with a small blemish." },
    verdict: "recommended",
  },
  {
    id: OWN_ID,
    listing: "L-204",
    own: true,
    condition: { de: "Defekt", en: "Defective" },
    title: { de: "Alte Kamera, defekt, für Bastler", en: "Old camera, defective, for parts" },
    price: 480,
    place: "3011 Bern",
    category: "foto",
    text: { de: "Kamera ist defekt, der Verschluss klemmt. Nur für Bastler.", en: "Camera is defective, the shutter is stuck. For parts only." },
    art: '<rect x="22" y="28" width="76" height="46" rx="6"/><path d="M30 36l60 30M90 36L30 66"/>',
    reviews: [],
    summary: { de: "", en: "" },
    verdict: "mixed",
  },
  {
    id: "rennvelo",
    condition: { de: "Sehr gut", en: "Very good" },
    title: { de: "Rennvelo Stahl, Rahmen 56", en: "Steel road bike, frame 56" },
    price: 340,
    place: "8400 Winterthur",
    category: "sport",
    text: { de: "Klassiker aus den Achtzigern, frisch revidiert. Neue Reifen und Bremsbeläge.", en: "A classic from the eighties, freshly serviced. New tyres and brake pads." },
    art: '<circle cx="32" cy="60" r="17"/><circle cx="88" cy="60" r="17"/><path d="M32 60l16-28h30l10 28M48 32l14 28h-30M78 32l-16 28M44 26h10M74 26h9"/>',
    reviews: [
      { name: "Sabine", stars: 5, text: { de: "Läuft wie neu, sehr netter Kontakt.", en: "Rides like new, very friendly contact." } },
      { name: "Urs B.", stars: 4, text: { de: "Guter Zustand, Sattel musste ich tauschen.", en: "Good condition, I had to replace the saddle." } },
    ],
    summary: { de: "Gut gewartetes Velo, das hält, was das Inserat verspricht.", en: "A well maintained bike that delivers what the listing promises." },
    verdict: "recommended",
  },
  {
    id: "ski",
    condition: { de: "Gut", en: "Good" },
    title: { de: "Carving-Ski 160 cm mit Bindung", en: "Carving skis 160 cm with bindings" },
    price: 95,
    place: "7270 Davos",
    category: "sport",
    text: { de: "Einsteigerski, letzten Winter geschliffen und gewachst.", en: "Beginner skis, sharpened and waxed last winter." },
    art: '<path d="M44 14c-3 0-4 3-4 6v54h8V20c0-3-1-6-4-6zM76 14c-3 0-4 3-4 6v54h8V20c0-3-1-6-4-6z"/><path d="M40 42h8M40 50h8M72 42h8M72 50h8"/>',
    reviews: [{ name: "Lea", stars: 4, text: { de: "Für den Preis top, Kanten greifen gut.", en: "Great for the price, edges grip well." } }],
    summary: { de: "Solider Einsteigerski zu einem fairen Preis.", en: "Solid beginner skis at a fair price." },
    verdict: "recommended",
  },
  {
    id: "sessel",
    condition: { de: "Gebraucht", en: "Used" },
    badge: "new",
    title: { de: "Lesesessel, Leder cognac", en: "Reading armchair, cognac leather" },
    price: 280,
    place: "4051 Basel",
    category: "wohnen",
    text: { de: "Bequemer Sessel mit Patina. Abholung in Basel, passt in einen Kombi.", en: "Comfortable armchair with patina. Pickup in Basel, fits into an estate car." },
    art: '<path d="M34 46V30a8 8 0 0 1 8-8h36a8 8 0 0 1 8 8v16"/><path d="M24 46a6 6 0 0 1 12 0v10h48V46a6 6 0 0 1 12 0v20H24z"/><path d="M32 66v9M88 66v9"/>',
    reviews: [
      { name: "Thomas", stars: 5, text: { de: "Wunderschönes Stück, genau wie auf den Fotos.", en: "Beautiful piece, exactly as in the photos." } },
      { name: "Anna W.", stars: 3, text: { de: "Leder an einer Armlehne etwas spröde.", en: "Leather a bit brittle on one armrest." } },
    ],
    summary: { de: "Schöner Sessel mit Gebrauchsspuren, die meisten sind zufrieden.", en: "A handsome armchair with signs of use, most buyers are happy." },
    verdict: "mixed",
  },
  {
    id: "lampe",
    condition: { de: "Sehr gut", en: "Very good" },
    title: { de: "Schreibtischlampe, Messing", en: "Desk lamp, brass" },
    price: 45,
    place: "6003 Luzern",
    category: "wohnen",
    text: { de: "Gelenkarm, neu verkabelt, mit LED-Birne.", en: "Jointed arm, rewired, comes with an LED bulb." },
    art: '<path d="M42 74h36M60 74V56l-18-22M42 34l22-12 12 16-22 10z"/><circle cx="60" cy="56" r="2.500"/>',
    reviews: [{ name: "Reto", stars: 5, text: { de: "Macht richtig schönes Licht.", en: "Gives really lovely light." } }],
    summary: { de: "Kleine Lampe, grosse Zufriedenheit.", en: "A small lamp that buyers love." },
    verdict: "recommended",
  },
  {
    id: "plattenspieler",
    condition: { de: "Gut", en: "Good" },
    badge: "sold",
    title: { de: "Plattenspieler mit Riemenantrieb", en: "Belt-drive turntable" },
    price: 160,
    place: "9000 St. Gallen",
    category: "musik",
    text: { de: "Neuer Riemen, neue Nadel. Haube hat Kratzer.", en: "New belt, new stylus. The dust cover has scratches." },
    art: '<rect x="20" y="20" width="80" height="54" rx="5"/><circle cx="52" cy="47" r="19"/><circle cx="52" cy="47" r="3"/><path d="M86 28v24l-12 12"/>',
    reviews: [
      { name: "Marc", stars: 4, text: { de: "Klingt warm, Gleichlauf ist gut.", en: "Sounds warm, speed is stable." } },
      { name: "Nina", stars: 4, text: { de: "Haube verkratzt, sonst tipptopp.", en: "Cover is scratched, otherwise spot on." } },
    ],
    summary: { de: "Technisch in Ordnung, optisch mit kleinen Mängeln.", en: "Technically sound, with small cosmetic flaws." },
    verdict: "recommended",
  },
  {
    id: "gitarre",
    condition: { de: "Wie neu", en: "Like new" },
    title: { de: "Westerngitarre mit Tasche", en: "Acoustic guitar with gig bag" },
    price: 130,
    place: "3600 Thun",
    category: "musik",
    text: { de: "Kaum gespielt, neue Saiten aufgezogen.", en: "Hardly played, new strings fitted." },
    art: '<path d="M70 20l14-8 4 6-12 10z"/><path d="M72 26L52 46"/><path d="M52 40c-7-5-17-2-20 6-2 6 1 9-3 14-5 6-2 16 7 18 9 2 16-3 18-10 1-5 6-5 9-9 4-6 0-14-6-17z"/><circle cx="42" cy="58" r="5"/>',
    reviews: [{ name: "Corinne", stars: 5, text: { de: "Perfekt für den Einstieg.", en: "Perfect to get started." } }],
    summary: { de: "Guter Einstieg, sorgfältig behandelt.", en: "A good starter instrument, well looked after." },
    verdict: "recommended",
  },
  {
    id: "espresso",
    condition: { de: "Gut", en: "Good" },
    badge: "new",
    title: { de: "Siebträger-Espressomaschine", en: "Lever espresso machine" },
    price: 210,
    place: "8004 Zürich",
    category: "wohnen",
    text: { de: "Frisch entkalkt, neue Dichtungen. Mit Tamper und zwei Sieben.", en: "Freshly descaled, new gaskets. Comes with a tamper and two baskets." },
    art: '<rect x="28" y="18" width="64" height="20" rx="4"/><path d="M34 38v36h52V38M48 38v8h24v-8M54 46v6h12v-6"/><path d="M50 62h20v8a4 4 0 0 1-4 4H54a4 4 0 0 1-4-4z"/><path d="M36 26h8"/>',
    reviews: [
      { name: "Luca", stars: 5, text: { de: "Macht besseren Kaffee als meine neue.", en: "Makes better coffee than my new one." } },
      { name: "Eva", stars: 4, text: { de: "Braucht etwas Übung, dann super.", en: "Takes some practice, then it is great." } },
    ],
    summary: { de: "Sehr beliebt bei allen, die sich etwas Zeit dafür nehmen.", en: "Very popular with those who take a little time to learn it." },
    verdict: "recommended",
  },
  {
    id: "rucksack",
    condition: { de: "Gebraucht", en: "Used" },
    title: { de: "Wanderrucksack 38 Liter", en: "Hiking backpack 38 litres" },
    price: 55,
    place: "3920 Zermatt",
    category: "sport",
    text: { de: "Mit Regenhülle, ein Reissverschluss läuft etwas streng.", en: "With rain cover, one zip runs a little stiff." },
    art: '<path d="M40 30a20 20 0 0 1 40 0v40a6 6 0 0 1-6 6H46a6 6 0 0 1-6-6z"/><path d="M50 16a10 10 0 0 1 20 0M46 50h28v16H46zM40 40h40"/>',
    reviews: [{ name: "Beat", stars: 4, text: { de: "Trägt sich angenehm, Reissverschluss hakt wirklich.", en: "Comfortable to carry, the zip does stick." } }],
    summary: { de: "Bequemer Rucksack mit einem kleinen Makel.", en: "A comfortable pack with one small flaw." },
    verdict: "recommended",
  },
  {
    id: "schreibmaschine",
    condition: { de: "Gut", en: "Good" },
    badge: "sold",
    title: { de: "Reiseschreibmaschine Hermes", en: "Hermes portable typewriter" },
    price: 140,
    place: "2502 Biel",
    category: "wohnen",
    text: { de: "Mit Koffer und neuem Farbband. Alle Tasten laufen sauber.", en: "With case and a new ribbon. All keys run cleanly." },
    art: '<rect x="20" y="46" width="80" height="26" rx="5"/><path d="M30 46l6-20h48l6 20M40 26v-8h40v8"/><path d="M32 56h56M36 64h48"/>',
    reviews: [{ name: "Hanna", stars: 5, text: { de: "Ein Schmuckstück, schreibt wie am ersten Tag.", en: "A gem, types like on day one." } }],
    summary: { de: "Gepflegtes Sammlerstück in gutem Zustand.", en: "A well kept collector's piece in good condition." },
    verdict: "recommended",
  },
  {
    id: "radio",
    condition: { de: "Gebraucht", en: "Used" },
    title: { de: "Röhrenradio, Nussbaum", en: "Valve radio, walnut" },
    price: 75,
    place: "5000 Aarau",
    category: "musik",
    text: { de: "Empfängt UKW, Skalenlicht funktioniert. Gehäuse mit kleinen Kratzern.", en: "Receives FM, dial light works. Small scratches on the case." },
    art: '<rect x="18" y="26" width="84" height="46" rx="6"/><circle cx="44" cy="49" r="13"/><path d="M68 40h24M68 49h24M68 58h14"/><circle cx="90" cy="60" r="3"/>',
    reviews: [{ name: "Peter", stars: 4, text: { de: "Warmer Klang, braucht etwas Aufwärmzeit.", en: "Warm sound, needs a little warm-up time." } }],
    summary: { de: "Schönes Radio mit warmem Klang.", en: "A lovely radio with a warm sound." },
    verdict: "recommended",
  },
  {
    id: "fernglas",
    condition: { de: "Sehr gut", en: "Very good" },
    badge: "new",
    title: { de: "Fernglas 8x30 mit Lederetui", en: "Binoculars 8x30 with leather case" },
    price: 65,
    place: "7000 Chur",
    category: "foto",
    text: { de: "Klare Optik, kein Pilz, Mitteltrieb leichtgängig.", en: "Clear optics, no fungus, smooth focus wheel." },
    art: '<rect x="28" y="30" width="24" height="44" rx="8"/><rect x="68" y="30" width="24" height="44" rx="8"/><path d="M52 44h16M52 54h16M34 30v-8h12v8M74 30v-8h12v8"/>',
    reviews: [{ name: "Ruth", stars: 5, text: { de: "Tadellos, sehr hell.", en: "Flawless, very bright." } }],
    summary: { de: "Einwandfreies Fernglas, klare Empfehlung.", en: "Flawless binoculars, clearly recommended." },
    verdict: "recommended",
  },
  {
    id: "jumbo",
    condition: { de: "Gut", en: "Good" },
    title: { de: "Jumbo-Gitarre, Ahorn", en: "Jumbo guitar, maple" },
    price: 390,
    place: "6500 Bellinzona",
    category: "musik",
    text: { de: "Grosser Korpus, voller Klang. Kleine Lackschäden am Boden, mit Gurt.", en: "Big body, full sound. Small chips in the finish on the back, comes with a strap." },
    art: '<path d="M70 20l14-8 4 6-12 10z"/><path d="M72 26L52 46"/><circle cx="42" cy="58" r="16"/><circle cx="42" cy="58" r="5"/>',
    reviews: [{ name: "Gianni", stars: 4, text: { de: "Klingt gross, ist auch gross.", en: "Sounds big, and is big." } }],
    summary: { de: "Viel Gitarre fürs Geld, mit kleinen Schönheitsfehlern.", en: "A lot of guitar for the money, with small blemishes." },
    verdict: "recommended",
  },
];

export const itemById = (id: string) => ITEMS.find((i) => i.id === id);
