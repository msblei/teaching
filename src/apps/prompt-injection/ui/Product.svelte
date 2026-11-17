<script lang="ts">
  // One item, as a shop would show it: photo, a box to buy from, the seller,
  // description and details, then the AI summary of its reviews, the reviews,
  // and a row of similar items.
  // On the camera, while level 3 is played, the player can add a review. The
  // summary, the box to write in and the player's own review sit directly
  // under one another, so cause and effect are on screen together.
  import Icon from "../../../components/app/Icon.svelte";
  import FlagText from "./FlagText.svelte";
  import { CATEGORIES, ITEMS, type Item } from "../shared/catalog";
  import { PHOTOS, photoUrl } from "../shared/photos";
  import { MAX_INPUT, type AttemptResult } from "../shared/types";
  import { chf, itemNo, listedDays, reviewDate, sellerOf, today } from "./meta";
  import { S } from "./strings";
  import type { Lang } from "../../../lib/i18n";

  let {
    item,
    lang,
    canReview,
    beacon = false,
    busy,
    mine,
    result,
    ownText = "",
    playerName = "",
    inCart = false,
    wished = false,
    onedit,
    onback,
    oncategory,
    onopen,
    oncart,
    onwish,
    onreview,
    oncopy,
  }: {
    item: Item;
    lang: Lang;
    /** The review form is open (the camera, while level 3 is being played). */
    canReview: boolean;
    /** Mark the review form as the place to type. */
    beacon?: boolean;
    busy: boolean;
    /** The player's last review of this item. */
    mine: { text: string; stars: number } | null;
    /** What the summary AI made of it. */
    result: AttemptResult | null;
    /** For the player's own listing: its description as last saved. */
    ownText?: string;
    playerName?: string;
    inCart?: boolean;
    wished?: boolean;
    /** For the player's own listing: go and edit it. */
    onedit?: () => void;
    onback: () => void;
    oncategory: (c: Item["category"]) => void;
    onopen: (id: string) => void;
    oncart: () => void;
    onwish: () => void;
    onreview: (text: string, stars: number) => void;
    oncopy: (flag: string) => void;
  } = $props();

  let text = $state("");
  let stars = $state(5);
  let hover = $state(0);
  const verdict = $derived(result?.verdict ?? item.verdict);
  const summary = $derived(result?.reply || item.summary[lang]);
  const tone = (v: string) => (v === "recommended" ? "bg-accent text-accent-fg" : v === "mixed" ? "bg-surface-2 text-strong" : "bg-danger/15 text-danger");

  function send(e: Event) {
    e.preventDefault();
    if (!text.trim() || busy) return;
    onreview(text.trim(), stars);
    text = "";
  }

  // Scenery around the reviews: the average, how the stars spread, who sells.
  const sold = $derived(item.badge === "sold");
  const seller = $derived(sellerOf(item, playerName));
  const allStars = $derived([...(mine ? [mine.stars] : []), ...item.reviews.map((r) => r.stars)]);
  const average = $derived(allStars.reduce((s, n) => s + n, 0) / Math.max(1, allStars.length));
  const similar = $derived(ITEMS.filter((i) => i.id !== item.id && !i.own && i.category === item.category).slice(0, 4));
  const categoryLabel = $derived(CATEGORIES.find((c) => c.id === item.category)?.label[lang]);
  const initial = (name: string) => name.trim().charAt(0).toUpperCase();
  let reviewsEl: HTMLElement | undefined = $state();
</script>

{#snippet rating(n: number, size = 13)}
  <span class="flex shrink-0 text-accent" aria-label={S.stars[lang].replace("{n}", String(n))}>
    {#each Array(5) as _, i}<Icon name="star" {size} class={i < n ? "fill-current" : "opacity-30"} />{/each}
  </span>
{/snippet}

<div class="flex flex-col gap-8">
  <nav class="-mb-3 flex flex-wrap items-center gap-1.5 text-[13px] opacity-70">
    <button type="button" onclick={onback} class="underline-offset-4 hover:underline">{S.navShop[lang]}</button>
    <Icon name="chevron-right" size={12} />
    <button type="button" onclick={() => oncategory(item.category)} class="underline-offset-4 hover:underline">{categoryLabel}</button>
    <Icon name="chevron-right" size={12} />
    <span class="text-strong">{item.title[lang]}</span>
  </nav>

  <div class="grid gap-x-9 gap-y-5 md:grid-cols-[minmax(0,11fr)_minmax(0,9fr)]">
    <figure>
      <div class="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-2xl bg-surface-2 text-accent">
        {#if photoUrl(item.id)}
          <img src={photoUrl(item.id)} alt={item.title[lang]} class={`h-full w-full object-cover ${sold ? "opacity-60 grayscale" : ""}`} />
        {:else}
          <svg viewBox="0 0 120 90" class="h-[70%] w-[70%]" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{@html item.art}</svg>
        {/if}
        {#if item.badge === "new" && !item.own}<span class="absolute left-3 top-3 rounded-full bg-accent px-2.5 py-0.5 text-xs font-semibold text-accent-fg">{S.badgeNew[lang]}</span>{/if}
      </div>
      {#if PHOTOS[item.id]}
        <figcaption class="mt-1.5 text-xs opacity-50">{S.photoBy[lang]} <a href={PHOTOS[item.id].page} target="_blank" rel="noopener" class="underline-offset-2 hover:underline">{PHOTOS[item.id].author}</a>, {PHOTOS[item.id].licence}</figcaption>
      {/if}
    </figure>

    <!-- The box to buy from -->
    <div class="flex flex-col gap-3.5">
      <div>
        {#if item.own}<p class="mb-2 inline-block rounded-full bg-accent px-2.5 py-0.5 text-xs font-semibold text-accent-fg">{S.ownTag[lang]}</p>{/if}
        <p class="text-[13px] opacity-60">{categoryLabel} · {S.itemNo[lang]} {itemNo(item)}</p>
        <h1 class="db-serif mt-0.5 text-3xl leading-tight text-strong">{item.title[lang]}</h1>
        {#if allStars.length}
          <button type="button" onclick={() => reviewsEl?.scrollIntoView({ behavior: "smooth", block: "start" })} class="mt-1.5 flex items-center gap-2 text-sm underline-offset-4 hover:underline">
            {@render rating(Math.round(average), 15)}
            <span class="tabular-nums">{average.toFixed(1)}</span>
            <span class="opacity-70">({S.reviewCount[lang].replace("{n}", String(allStars.length))})</span>
          </button>
        {/if}
      </div>

      <div>
        <p class={`text-[2rem] font-semibold leading-none tabular-nums text-strong ${sold ? "line-through opacity-50" : ""}`}>{chf(item.price)}</p>
        <p class="mt-1 text-xs opacity-60">{S.vat[lang]}</p>
      </div>

      <p class="flex flex-wrap items-center gap-2 text-sm">
        <span class="rounded-full border border-line px-2.5 py-0.5 text-strong">{S.condition[lang]}: {item.condition[lang]}</span>
        {#if !sold}<span class="flex items-center gap-1.5"><span class="h-2 w-2 rounded-full bg-accent"></span>{S.oneOff[lang]}</span>{/if}
      </p>

      {#if item.own}
        <button type="button" onclick={onedit} class="flex items-center justify-center gap-2 rounded-full border border-line px-5 py-2.5 font-semibold text-strong transition hover:bg-surface-2"><Icon name="instructions" size={18} />{S.ownEdit[lang]}</button>
      {:else if sold}
        <p class="rounded-full bg-surface-2 px-5 py-2.5 text-center font-semibold text-strong">{S.badgeSold[lang]}</p>
      {:else}
        <div class="flex gap-2">
          <button type="button" onclick={oncart} class={`flex flex-1 items-center justify-center gap-2 rounded-full px-5 py-2.5 font-semibold transition ${inCart ? "border border-accent text-strong hover:bg-surface-2" : "bg-accent text-accent-fg hover:brightness-110"}`}>
            <Icon name={inCart ? "check" : "cart"} size={18} />{(inCart ? S.inCart : S.addToCart)[lang]}
          </button>
          <button type="button" onclick={onwish} aria-pressed={wished} aria-label={(wished ? S.wishRemove : S.wishAdd)[lang]} title={(wished ? S.wishRemove : S.wishAdd)[lang]} class={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line transition hover:bg-surface-2 ${wished ? "text-accent" : "text-strong"}`}>
            <Icon name="heart" size={19} class={wished ? "fill-current" : ""} />
          </button>
        </div>
      {/if}

      <ul class="flex flex-col gap-2 rounded-xl border border-line px-4 py-3 text-sm">
        <li class="flex items-start gap-2.5"><Icon name="truck" size={17} class="mt-0.5 shrink-0 text-accent" />{S.delivery[lang]}</li>
        <li class="flex items-start gap-2.5"><Icon name="pin" size={17} class="mt-0.5 shrink-0 text-accent" />{S.pickup[lang]}</li>
        <li class="flex items-start gap-2.5"><Icon name="return" size={17} class="mt-0.5 shrink-0 text-accent" />{S.returns[lang]}</li>
      </ul>

      <div class="flex items-center gap-3 rounded-xl bg-surface px-4 py-3 text-sm">
        <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-2 text-base font-semibold text-strong">{initial(seller.name)}</span>
        <div class="min-w-0">
          <p class="truncate"><span class="opacity-70">{S.soldBy[lang]}</span> <span class="font-semibold text-strong">{seller.name}</span></p>
          <p class="flex flex-wrap items-center gap-x-1.5 text-[13px] opacity-80">
            {#if seller.sales}<span class="flex items-center gap-0.5 text-strong"><Icon name="star" size={12} class="fill-current text-accent" />{seller.rating.toFixed(1)}</span> ·
              {S.sellerSales[lang].replace("{n}", String(seller.sales))} ·{/if}
            {S.sellerSince[lang].replace("{y}", String(seller.since))}
          </p>
        </div>
      </div>
    </div>
  </div>

  <!-- Description and details -->
  <div class="grid gap-x-9 gap-y-6 border-t border-line pt-6 md:grid-cols-[minmax(0,11fr)_minmax(0,9fr)]">
    <section>
      <h2 class="db-serif text-xl text-strong">{S.description[lang]}</h2>
      <p class="mt-2 whitespace-pre-wrap break-words leading-relaxed">{item.own ? ownText || item.text[lang] : item.text[lang]}</p>
    </section>
    <section>
      <h2 class="db-serif text-xl text-strong">{S.details[lang]}</h2>
      <dl class="mt-2 grid grid-cols-[auto_1fr] text-sm [&>dd]:border-b [&>dd]:border-line [&>dd]:py-1.5 [&>dd]:text-right [&>dd]:text-strong [&>dt]:border-b [&>dt]:border-line [&>dt]:py-1.5 [&>dt]:opacity-70">
        <dt>{S.condition[lang]}</dt>
        <dd>{item.condition[lang]}</dd>
        <dt>{S.category[lang]}</dt>
        <dd>{categoryLabel}</dd>
        <dt>{S.location[lang]}</dt>
        <dd>{item.place}</dd>
        <dt>{S.shipping[lang]}</dt>
        <dd>{S.shippingText[lang]}</dd>
        <dt>{S.listed[lang]}</dt>
        <dd>{S.daysAgo[lang].replace("{n}", String(listedDays(item)))}</dd>
        <dt>{S.itemNo[lang]}</dt>
        <dd class="tabular-nums">{itemNo(item)}</dd>
      </dl>
    </section>
  </div>

  {#if !item.own}
  <section bind:this={reviewsEl} class="scroll-mt-28 border-t border-line pt-6">
    <h2 class="db-serif text-xl text-strong">{S.reviews[lang]}</h2>

    <div class="mt-3 grid items-start gap-x-9 gap-y-4 md:grid-cols-[13rem_minmax(0,1fr)]">
      <!-- The numbers a shop puts next to its reviews -->
      <div class="rounded-2xl bg-surface p-4">
        <p class="flex items-baseline gap-2"><span class="text-4xl font-semibold tabular-nums text-strong">{average.toFixed(1)}</span><span class="text-sm opacity-60">/ 5</span></p>
        <div class="mt-1 flex items-center gap-2 text-[13px]">{@render rating(Math.round(average), 15)}<span class="opacity-70">{S.reviewCount[lang].replace("{n}", String(allStars.length))}</span></div>
        <ul class="mt-3 flex flex-col gap-1 text-xs tabular-nums">
          {#each [5, 4, 3, 2, 1] as n}
            {@const share = allStars.filter((s) => s === n).length / Math.max(1, allStars.length)}
            <li class="flex items-center gap-2">
              <span class="w-2">{n}</span><Icon name="star" size={11} class="fill-current text-accent" />
              <span class="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2"><span class="block h-full rounded-full bg-accent transition-[width] duration-500" style:width={`${share * 100}%`}></span></span>
              <span class="w-4 text-right opacity-70">{allStars.filter((s) => s === n).length}</span>
            </li>
          {/each}
        </ul>
      </div>

      <div class="flex flex-col gap-3">
        <!-- What the AI makes of the reviews -->
        <div class={`rounded-2xl border bg-surface p-4 transition-colors ${result?.flag ? "border-accent" : "border-line"}`}>
          <div class="flex flex-wrap items-center gap-2">
            <Icon name="bot" size={18} class="text-accent" />
            <h3 class="font-semibold text-strong">{S.aiSummary[lang]}</h3>
            {#if busy}
              <span class="ml-auto flex items-center gap-2 text-sm opacity-70"><span class="dot"></span>{S.reviewBusy[lang]}</span>
            {:else}
              <span class={`ml-auto rounded-full px-2.5 py-0.5 text-sm font-semibold ${tone(verdict)}`}>{S[`verdict_${verdict}`][lang]}</span>
            {/if}
          </div>
          <p class={`mt-2 leading-relaxed ${busy ? "opacity-40" : ""}`}>{summary}</p>
          {#if result?.flag}
            <p class="mt-3 text-strong">{S.flagWon[lang]} <FlagText text={result.flag} {lang} {oncopy} /></p>
          {/if}
        </div>

        <!-- Write one: stars, text, Enter -->
        {#if canReview}
          <form onsubmit={send} class={`flex flex-col gap-2 rounded-2xl border border-line bg-surface p-3 ${beacon ? "pi-beacon" : ""}`}>
            <div class="flex items-center gap-3">
              <label for="review" class="text-sm font-semibold text-strong">{S.writeReview[lang]}</label>
              <span class="flex text-accent" role="group" aria-label={S.stars[lang].replace("{n}", String(stars))} onmouseleave={() => (hover = 0)}>
                {#each Array(5) as _, i}
                  <button type="button" aria-pressed={stars === i + 1} aria-label={S.stars[lang].replace("{n}", String(i + 1))} onmouseenter={() => (hover = i + 1)} onclick={() => (stars = i + 1)} class="p-0.5">
                    <Icon name="star" size={20} class={i < (hover || stars) ? "fill-current" : "opacity-30"} />
                  </button>
                {/each}
              </span>
            </div>
            <div class="flex items-end gap-2">
              <textarea
                id="review"
                bind:value={text}
                rows="2"
                maxlength={MAX_INPUT}
                placeholder={S.reviewPlaceholder[lang]}
                onkeydown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && !e.isComposing) send(e);
                }}
                class="min-w-0 flex-1 resize-y rounded-xl border border-line bg-bg px-3 py-2 text-strong outline-none placeholder:opacity-50 focus:border-accent/60"
              ></textarea>
              <button type="submit" disabled={!text.trim() || busy} class="shrink-0 rounded-full bg-accent px-4 py-2 font-semibold text-accent-fg transition enabled:hover:brightness-110 disabled:opacity-40">{S.reviewSend[lang]}</button>
            </div>
          </form>
        {/if}

        <!-- Newest first: the player's own review on top -->
        <ul class="flex flex-col">
          {#if mine}
            <li class="mb-2 flex gap-3 rounded-xl border border-accent/60 bg-accent/10 px-3 py-3">
              <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-fg">{initial(playerName || S.you[lang])}</span>
              <div class="min-w-0">
                <p class="flex flex-wrap items-center gap-x-2 text-sm"><span class="font-semibold text-accent">{S.you[lang]}</span>{@render rating(mine.stars)}<span class="text-xs opacity-60">{today(lang)}</span></p>
                <p class="mt-1 whitespace-pre-wrap break-words text-strong">{mine.text}</p>
              </div>
            </li>
          {/if}
          {#each item.reviews as r, i}
            <li class="flex gap-3 border-b border-line px-3 py-3 last:border-0">
              <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-2 text-sm font-semibold text-strong">{initial(r.name)}</span>
              <div class="min-w-0">
                <p class="flex flex-wrap items-center gap-x-2 text-sm"><span class="font-semibold text-strong">{r.name}</span>{@render rating(r.stars)}<span class="text-xs opacity-60">{reviewDate(item, i, lang)}</span></p>
                <p class="flex items-center gap-1 text-xs opacity-60"><Icon name="badge-check" size={13} />{S.verified[lang]}</p>
                <p class="mt-1 leading-relaxed">{r.text[lang]}</p>
              </div>
            </li>
          {/each}
        </ul>
      </div>
    </div>
  </section>
  {/if}

  {#if similar.length}
    <section class="border-t border-line pt-6">
      <h2 class="db-serif text-xl text-strong">{S.similar[lang]}</h2>
      <ul class="mt-3 grid grid-cols-2 gap-4 md:grid-cols-4">
        {#each similar as s (s.id)}
          <li>
            <button type="button" onclick={() => onopen(s.id)} class="group flex w-full flex-col text-left">
              <img src={photoUrl(s.id)} alt="" loading="lazy" class={`aspect-[4/3] w-full rounded-xl object-cover ${s.badge === "sold" ? "opacity-45 grayscale" : ""}`} />
              <span class="mt-2 text-sm leading-snug text-strong group-hover:underline">{s.title[lang]}</span>
              <span class="mt-0.5 font-semibold tabular-nums text-strong">{chf(s.price)}</span>
            </button>
          </li>
        {/each}
      </ul>
    </section>
  {/if}
</div>

<style>
  .dot {
    width: 0.5rem;
    height: 0.5rem;
    border-radius: 9999px;
    background: var(--accent);
    animation: pulse 1.2s ease-in-out infinite;
  }
  @keyframes pulse {
    0%, 100% { opacity: 0.3; }
    50% { opacity: 1; }
  }
</style>
