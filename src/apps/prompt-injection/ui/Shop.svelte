<script lang="ts">
  // The shop front, laid out like a real second-hand shop: a banner, filters
  // on the side, sorting, a grid of cards with hearts and "new" and "sold"
  // tags. Search and category live in the header above and come in as props.
  // None of it matters for the game except that it feels like a shop.
  import Icon from "../../../components/app/Icon.svelte";
  import { CATEGORIES, ITEMS, type Item } from "../shared/catalog";
  import { photoUrl } from "../shared/photos";
  import { chf } from "./meta";
  import { S } from "./strings";
  import type { Lang } from "../../../lib/i18n";

  let {
    lang,
    beaconId = "",
    query = $bindable(),
    category = $bindable(),
    wish,
    wishOnly = false,
    onopen,
    onwish,
    onsell,
  }: {
    lang: Lang;
    /** Item to mark as the place where the level is played. */
    beaconId?: string;
    query: string;
    category: Item["category"] | null;
    /** Ids on the wishlist. */
    wish: string[];
    /** Show the wishlist instead of the whole stock. */
    wishOnly?: boolean;
    onopen: (id: string) => void;
    onwish: (id: string) => void;
    onsell: () => void;
  } = $props();

  let sort = $state<"new" | "cheap" | "dear">("new");
  let conditions = $state<string[]>([]);
  let availableOnly = $state(false);
  // Conditions in the order the stock first shows them.
  const CONDITIONS = [...new Map(ITEMS.map((i) => [i.condition.en, i.condition])).values()];

  const shown = $derived.by(() => {
    const q = query.trim().toLowerCase();
    const list = ITEMS.filter(
      (i) =>
        (!wishOnly || wish.includes(i.id)) &&
        (!category || i.category === category) &&
        (!q || `${i.title.de} ${i.title.en}`.toLowerCase().includes(q)) &&
        (!conditions.length || conditions.includes(i.condition.en)) &&
        (!availableOnly || i.badge !== "sold"),
    );
    return sort === "new" ? list : [...list].sort((a, b) => (sort === "cheap" ? a.price - b.price : b.price - a.price));
  });
  // Twelve to a page, like the shops this one is modelled on.
  const PER_PAGE = 12;
  let page = $state(1);
  const pages = $derived(Math.max(1, Math.ceil(shown.length / PER_PAGE)));
  // A new search, category, filter or order starts at the first page again.
  $effect(() => {
    void query;
    void category;
    void sort;
    void conditions.length;
    void availableOnly;
    void wishOnly;
    page = 1;
  });
  const onPage = $derived(shown.slice((page - 1) * PER_PAGE, page * PER_PAGE));
  const count = (c: Item["category"]) => ITEMS.filter((i) => i.category === c).length;
  const rating = (i: Item) => i.reviews.reduce((s, r) => s + r.stars, 0) / Math.max(1, i.reviews.length);
  const filtered = $derived(!!query.trim() || !!category || conditions.length > 0 || availableOnly);
  const heading = $derived(
    wishOnly ? S.wishlist[lang] : query.trim() ? S.searchFor[lang].replace("{q}", query.trim()) : category ? CATEGORIES.find((c) => c.id === category)!.label[lang] : S.allItems[lang],
  );
  function reset() {
    query = "";
    category = null;
    conditions = [];
    availableOnly = false;
  }
  let grid: HTMLElement | undefined = $state();
</script>

{#snippet pager()}
  {#if pages > 1}
    {@const cell = "flex h-9 min-w-9 items-center justify-center rounded-full px-2 tabular-nums transition"}
    <nav class="flex items-center gap-1" aria-label={S.page[lang].replace("{n}", String(page))}>
      <button type="button" onclick={() => (page = Math.max(1, page - 1))} disabled={page === 1} aria-label={S.prevPage[lang]} class={`${cell} border border-line enabled:hover:bg-surface-2 disabled:opacity-30`}>
        <Icon name="chevron-right" size={14} class="rotate-180" />
      </button>
      {#each Array(pages) as _, i}
        <button type="button" onclick={() => (page = i + 1)} aria-current={page === i + 1 ? "page" : undefined} aria-label={S.page[lang].replace("{n}", String(i + 1))} class={`${cell} ${page === i + 1 ? "bg-accent font-semibold text-accent-fg" : "border border-line hover:bg-surface-2"}`}>{i + 1}</button>
      {/each}
      <button type="button" onclick={() => (page = Math.min(pages, page + 1))} disabled={page === pages} aria-label={S.nextPage[lang]} class={`${cell} border border-line enabled:hover:bg-surface-2 disabled:opacity-30`}>
        <Icon name="chevron-right" size={14} />
      </button>
    </nav>
  {/if}
{/snippet}

<!-- The banner, on the untouched front page only. -->
{#if !filtered && !wishOnly && page === 1}
  <section class="mb-6 grid overflow-hidden rounded-2xl bg-surface-2 sm:grid-cols-[minmax(0,5fr)_minmax(0,4fr)]">
    <div class="flex flex-col items-start justify-center gap-1.5 px-6 py-5 sm:px-9">
      <p class="rounded-full bg-accent px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-accent-fg">{S.heroKicker[lang]}</p>
      <h1 class="db-serif text-4xl leading-tight text-strong">{S.shopTagline[lang]}</h1>
      <p class="max-w-md leading-relaxed">{S.heroText[lang]}</p>
      <div class="mt-1.5 flex flex-wrap gap-2">
        <button type="button" onclick={() => grid?.scrollIntoView({ behavior: "smooth", block: "start" })} class="rounded-full bg-accent px-5 py-2 font-semibold text-accent-fg transition hover:brightness-110">{S.heroCta[lang]}</button>
        <button type="button" onclick={onsell} class="rounded-full border border-strong/30 px-5 py-2 font-semibold text-strong transition hover:bg-bg/50">{S.heroSell[lang]}</button>
      </div>
    </div>
    <div class="grid h-48 grid-cols-[3fr_2fr] grid-rows-2 gap-1.5 max-sm:hidden" aria-hidden="true">
      <img src={photoUrl("sessel")} alt="" class="row-span-2 h-full w-full object-cover" />
      <img src={photoUrl("plattenspieler")} alt="" class="h-full w-full object-cover" />
      <img src={photoUrl("schreibmaschine")} alt="" class="h-full w-full object-cover" />
    </div>
  </section>
{/if}

<div bind:this={grid} class="grid scroll-mt-28 gap-x-8 gap-y-5 md:grid-cols-[12.5rem_minmax(0,1fr)]">
  <!-- Filters -->
  <aside class="flex flex-col gap-5 text-sm max-md:hidden">
    <nav aria-label={S.categories[lang]}>
      <h2 class="mb-1.5 text-[13px] font-semibold uppercase tracking-wider text-strong">{S.categories[lang]}</h2>
      <ul>
        <li>
          <button type="button" onclick={() => (category = null)} class={`flex w-full items-center justify-between gap-2 py-1 text-left hover:text-strong ${!category ? "font-semibold text-accent" : ""}`}>
            {S.all[lang]} <span class="text-xs font-normal tabular-nums opacity-60">{ITEMS.length}</span>
          </button>
        </li>
        {#each CATEGORIES as c}
          <li>
            <button type="button" onclick={() => (category = c.id)} class={`flex w-full items-center justify-between gap-2 py-1 text-left hover:text-strong ${category === c.id ? "font-semibold text-accent" : ""}`}>
              {c.label[lang]} <span class="text-xs font-normal tabular-nums opacity-60">{count(c.id)}</span>
            </button>
          </li>
        {/each}
      </ul>
    </nav>
    <div role="group" aria-label={S.condFilter[lang]} class="border-t border-line pt-4">
      <h2 class="mb-1.5 text-[13px] font-semibold uppercase tracking-wider text-strong">{S.condFilter[lang]}</h2>
      {#each CONDITIONS as c}
        <label class="flex cursor-pointer items-center gap-2 py-1 hover:text-strong">
          <input type="checkbox" bind:group={conditions} value={c.en} class="h-4 w-4 accent-[var(--accent)]" />{c[lang]}
        </label>
      {/each}
    </div>
    <label class="flex cursor-pointer items-center gap-2 border-t border-line pt-4 hover:text-strong">
      <input type="checkbox" bind:checked={availableOnly} class="h-4 w-4 accent-[var(--accent)]" />{S.onlyAvailable[lang]}
    </label>
    {#if filtered}
      <button type="button" onclick={reset} class="self-start underline underline-offset-4 hover:text-strong">{S.resetFilters[lang]}</button>
    {/if}
  </aside>

  <!-- Grid -->
  <div>
    <div class="mb-4 flex flex-wrap items-end gap-x-4 gap-y-2">
      <div class="mr-auto">
        <h2 class="db-serif text-2xl leading-tight text-strong">{heading}</h2>
        <p class="text-[13px] opacity-70">
          {S.results[lang].replace("{a}", String(shown.length ? (page - 1) * PER_PAGE + 1 : 0)).replace("{b}", String(Math.min(page * PER_PAGE, shown.length))).replace("{n}", String(shown.length))}
        </p>
      </div>
      <select bind:value={sort} aria-label={S.sortNew[lang]} class="rounded-full border border-line bg-surface px-3 py-1.5 text-sm text-strong outline-none focus:border-accent">
        <option value="new">{S.sortNew[lang]}</option>
        <option value="cheap">{S.sortCheap[lang]}</option>
        <option value="dear">{S.sortDear[lang]}</option>
      </select>
    </div>

    {#if !shown.length}
      <div class="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-line px-6 py-14 text-center">
        <Icon name={wishOnly ? "heart" : "search"} size={36} class="opacity-30" />
        <p>{(wishOnly && !filtered ? S.wishEmpty : S.noResults)[lang]}</p>
        {#if filtered}<button type="button" onclick={reset} class="rounded-full border border-line px-4 py-1.5 transition hover:bg-surface-2">{S.resetFilters[lang]}</button>{/if}
      </div>
    {/if}

    <ul class="grid grid-cols-2 gap-x-4 gap-y-7 lg:grid-cols-3">
      {#each onPage as item (item.id)}
        {@const sold = item.badge === "sold"}
        {@const wished = wish.includes(item.id)}
        <li class={`relative rounded-xl ${item.id === beaconId ? "pi-beacon" : ""}`}>
          <button type="button" onclick={() => onopen(item.id)} class="group flex w-full flex-col text-left">
            <span class="relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-xl bg-surface-2 text-accent">
              {#if photoUrl(item.id)}
                <img src={photoUrl(item.id)} alt="" loading="lazy" class={`h-full w-full object-cover transition duration-300 group-hover:scale-105 ${sold ? "opacity-45 grayscale" : ""}`} />
              {:else}
                <svg viewBox="0 0 120 90" class={`h-[62%] w-[62%] ${sold ? "opacity-40" : ""}`} fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{@html item.art}</svg>
              {/if}
              {#if item.own}
                <span class="absolute left-2 top-2 rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-accent-fg">{S.ownTag[lang]}</span>
              {:else if sold}
                <span class="absolute left-2 top-2 rounded-full bg-strong px-2 py-0.5 text-xs font-semibold text-bg">{S.badgeSold[lang]}</span>
              {:else if item.badge === "new"}
                <span class="absolute left-2 top-2 rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-accent-fg">{S.badgeNew[lang]}</span>
              {/if}
            </span>
            <span class="mt-2.5 text-xs opacity-60">{item.condition[lang]} · {item.place}</span>
            <span class="mt-0.5 leading-snug text-strong group-hover:underline">{item.title[lang]}</span>
            {#if item.reviews.length}
              <span class="mt-1 flex items-center gap-0.5 text-accent" aria-label={`${rating(item).toFixed(1)}/5`}>
                {#each Array(5) as _, i}<Icon name="star" size={12} class={i < Math.round(rating(item)) ? "fill-current" : "opacity-30"} />{/each}
                <span class="ml-1 text-xs tabular-nums text-fg opacity-70">({item.reviews.length})</span>
              </span>
            {/if}
            <span class={`mt-1 text-[17px] font-semibold tabular-nums text-strong ${sold ? "line-through opacity-50" : ""}`}>{chf(item.price)}</span>
          </button>
          {#if !item.own}
            <button
              type="button"
              onclick={() => onwish(item.id)}
              aria-pressed={wished}
              aria-label={(wished ? S.wishRemove : S.wishAdd)[lang]}
              title={(wished ? S.wishRemove : S.wishAdd)[lang]}
              class={`absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-bg/85 shadow transition hover:scale-110 ${wished ? "text-accent" : "text-strong"}`}
            >
              <Icon name="heart" size={17} class={wished ? "fill-current" : ""} />
            </button>
          {/if}
        </li>
      {/each}
    </ul>
    <div class="mt-9 flex justify-center">{@render pager()}</div>
  </div>
</div>
