<script lang="ts">
  // The shop front, laid out like a real second-hand shop: categories with
  // counts on the side, search, sorting, a grid with "new" and "sold" tags.
  // None of it matters for the game except that it feels like a shop.
  import Icon from "../../../components/app/Icon.svelte";
  import { CATEGORIES, ITEMS, type Item } from "../shared/catalog";
  import { photoUrl } from "../shared/photos";
  import { S } from "./strings";
  import type { Lang } from "../../../lib/i18n";

  let { lang, beaconId = "", onopen }: { lang: Lang; /** Item to mark as the place where the level is played. */ beaconId?: string; onopen: (id: string) => void } = $props();

  let query = $state("");
  let category = $state<Item["category"] | null>(null);
  let sort = $state<"new" | "cheap" | "dear">("new");
  const shown = $derived.by(() => {
    const q = query.trim().toLowerCase();
    const list = ITEMS.filter((i) => (!category || i.category === category) && (!q || `${i.title.de} ${i.title.en}`.toLowerCase().includes(q)));
    return sort === "new" ? list : [...list].sort((a, b) => (sort === "cheap" ? a.price - b.price : b.price - a.price));
  });
  // Twelve to a page, like the shops this one is modelled on.
  const PER_PAGE = 12;
  let page = $state(1);
  const pages = $derived(Math.max(1, Math.ceil(shown.length / PER_PAGE)));
  // A new search, category or order starts at the first page again.
  $effect(() => {
    void query;
    void category;
    void sort;
    page = 1;
  });
  const onPage = $derived(shown.slice((page - 1) * PER_PAGE, page * PER_PAGE));
  const count = (c: Item["category"]) => ITEMS.filter((i) => i.category === c).length;
  const rating = (i: Item) => i.reviews.reduce((s, r) => s + r.stars, 0) / Math.max(1, i.reviews.length);
</script>

{#snippet pager()}
  {#if pages > 1}
    {@const cell = "flex h-8 min-w-8 items-center justify-center rounded px-2 tabular-nums transition"}
    <nav class="flex items-center gap-1" aria-label={S.page[lang].replace("{n}", String(page))}>
      <button type="button" onclick={() => (page = Math.max(1, page - 1))} disabled={page === 1} aria-label={S.prevPage[lang]} class={`${cell} bg-surface enabled:hover:bg-surface-2 disabled:opacity-30`}>
        <Icon name="chevron-right" size={14} class="rotate-180" />
      </button>
      {#each Array(pages) as _, i}
        <button type="button" onclick={() => (page = i + 1)} aria-current={page === i + 1 ? "page" : undefined} aria-label={S.page[lang].replace("{n}", String(i + 1))} class={`${cell} ${page === i + 1 ? "bg-surface-2 text-strong" : "bg-surface hover:bg-surface-2"}`}>{i + 1}</button>
      {/each}
      <button type="button" onclick={() => (page = Math.min(pages, page + 1))} disabled={page === pages} aria-label={S.nextPage[lang]} class={`${cell} bg-surface enabled:hover:bg-surface-2 disabled:opacity-30`}>
        <Icon name="chevron-right" size={14} />
      </button>
    </nav>
  {/if}
{/snippet}

<div class="grid gap-6 md:grid-cols-[13rem_minmax(0,1fr)]">
  <!-- Sidebar -->
  <aside class="flex flex-col gap-4">
    <label class="flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2 focus-within:border-accent/60">
      <Icon name="search" size={17} class="shrink-0 opacity-60" />
      <input bind:value={query} placeholder={S.search[lang]} aria-label={S.search[lang]} class="min-w-0 flex-1 bg-transparent text-strong outline-none placeholder:opacity-50" />
    </label>
    <nav aria-label={S.categories[lang]}>
      <h2 class="mb-1 border-b border-line pb-1.5 text-lg text-strong">{S.categories[lang]}</h2>
      <ul class="flex flex-row flex-wrap gap-x-4 md:flex-col">
        <li>
          <button type="button" onclick={() => (category = null)} class={`flex w-full items-center justify-between gap-2 py-1.5 text-left underline-offset-4 hover:underline ${!category ? "text-accent" : ""}`}>
            {S.all[lang]} <span class="text-sm opacity-60">({ITEMS.length})</span>
          </button>
        </li>
        {#each CATEGORIES as c}
          <li>
            <button type="button" onclick={() => (category = c.id)} class={`flex w-full items-center justify-between gap-2 py-1.5 text-left underline-offset-4 hover:underline ${category === c.id ? "text-accent" : ""}`}>
              {c.label[lang]} <span class="text-sm opacity-60">({count(c.id)})</span>
            </button>
          </li>
        {/each}
      </ul>
    </nav>
  </aside>

  <!-- Grid -->
  <div>
    <div class="mb-3 flex flex-wrap items-center gap-3 text-sm">
      <select bind:value={sort} aria-label={S.sortNew[lang]} class="rounded-lg border border-line bg-surface px-2 py-1.5 text-strong outline-none focus:border-accent/60">
        <option value="new">{S.sortNew[lang]}</option>
        <option value="cheap">{S.sortCheap[lang]}</option>
        <option value="dear">{S.sortDear[lang]}</option>
      </select>
      <span class="opacity-70">
        {S.results[lang].replace("{a}", String(shown.length ? (page - 1) * PER_PAGE + 1 : 0)).replace("{b}", String(Math.min(page * PER_PAGE, shown.length))).replace("{n}", String(shown.length))}
      </span>
    </div>

    <ul class="grid grid-cols-2 gap-x-4 gap-y-6 lg:grid-cols-3">
      {#each onPage as item (item.id)}
        <li class={`rounded-xl ${item.id === beaconId ? "pi-beacon" : ""}`}>
          <button type="button" onclick={() => onopen(item.id)} class="group flex w-full flex-col text-center">
            <span class="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-xl bg-surface-2 text-accent">
              {#if photoUrl(item.id)}
                <img src={photoUrl(item.id)} alt="" loading="lazy" class={`h-full w-full object-cover transition duration-300 group-hover:scale-105 ${item.badge === "sold" ? "opacity-45 grayscale" : ""}`} />
              {:else}
                <svg viewBox="0 0 120 90" class={`h-[62%] w-[62%] ${item.badge === "sold" ? "opacity-40" : ""}`} fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{@html item.art}</svg>
              {/if}
              {#if item.own}
                <span class="absolute left-2 top-2 rounded bg-accent px-1.5 py-0.5 text-xs text-accent-fg">{S.ownTag[lang]}</span>
              {:else if item.badge === "new"}
                <span class="absolute left-2 top-2 rounded bg-bg/90 px-1.5 py-0.5 text-xs text-strong">{S.badgeNew[lang]}</span>
              {/if}
            </span>
            <span class="mt-2.5 px-1 leading-snug text-strong group-hover:underline">{item.title[lang]}</span>
            {#if item.reviews.length}
              <span class="mt-1 flex items-center justify-center gap-1 text-accent" aria-label={`${rating(item).toFixed(1)}/5`}>
                {#each Array(5) as _, i}<Icon name="star" size={12} class={i < Math.round(rating(item)) ? "fill-current" : "opacity-30"} />{/each}
                <span class="text-xs text-current opacity-70">({item.reviews.length})</span>
              </span>
            {/if}
            <span class="mt-1 tabular-nums">CHF {item.price.toFixed(2)}</span>
            {#if item.badge === "sold"}<span class="mt-1.5 w-full rounded bg-accent/25 py-0.5 text-sm text-strong">{S.badgeSold[lang]}</span>{/if}
          </button>
        </li>
      {/each}
    </ul>
    <div class="mt-8 flex justify-center">{@render pager()}</div>
  </div>
</div>
