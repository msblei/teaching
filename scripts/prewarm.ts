// Fills the shared tool cache right before a workshop, so the first wave of
// participants gets instant answers. Optional with tutti.ch (which handles
// parallel requests fine), but it also catches a blocked server early.
//
//   node scripts/prewarm.ts https://teach.mariusbleif.com <workshop-code>
//
// Searches the mission defaults (DE and EN wording), reads the top listings
// of each search, and checks the new prices. Run it about 10 minutes before
// the session, with CACHE_MINUTES set to 90 or so in Netlify.

const [base = "http://localhost:4329", code = "dev"] = process.argv.slice(2);

// Mission defaults: Deal check (Rennvelo, Rahmen 56) and Starter kit (Skifahren).
const SEARCHES = ["Rennvelo", "Rennvelo 56", "Rennvelo Rahmen 56", "Ski", "Skischuhe", "Skihelm", "Skibrille", "Skistöcke", "Skijacke"];
const PRICES = ["Rennvelo", "Skihelm"];
const LISTINGS_PER_SEARCH = 5;
const PARALLEL = 3; // gentle on the sites

async function tool(name: string, input: Record<string, unknown>) {
  const t0 = Date.now();
  const res = await fetch(`${base}/api/llm-to-agent/tool`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-workshop-code": code },
    body: JSON.stringify({ name, input }),
  });
  const json = await res.json();
  const label = `${name} ${JSON.stringify(input).slice(0, 70)}`;
  console.log(`${json.ok ? json.result.source.padEnd(5) : "FAIL "} ${String(Date.now() - t0).padStart(6)} ms  ${label}${json.ok ? "" : `  (${json.error})`}`);
  return json.ok ? json.result : undefined;
}

async function pool<T>(items: T[], fn: (x: T) => Promise<unknown>) {
  const queue = [...items];
  await Promise.all(Array.from({ length: PARALLEL }, async () => {
    while (queue.length) await fn(queue.shift()!);
  }));
}

const urls: string[] = [];
await pool(SEARCHES, async (query) => {
  const r = await tool("search_tutti", { query });
  for (const l of r?.listings?.slice(0, LISTINGS_PER_SEARCH) ?? []) if (!urls.includes(l.url)) urls.push(l.url);
});
await pool(urls, (url) => tool("get_listing", { url }));
await pool(PRICES, (product) => tool("check_new_price", { product }));
console.log(`\nDone: ${SEARCHES.length} searches, ${urls.length} listings, ${PRICES.length} prices.`);

export {};
