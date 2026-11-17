<script lang="ts">
  // One item: photo, details, the AI summary of its reviews, and the reviews.
  // On the camera, while level 3 is played, the player can add a review. The
  // summary, the box to write in and the player's own review sit directly
  // under one another, so cause and effect are on screen together.
  import Icon from "../../../components/app/Icon.svelte";
  import FlagText from "./FlagText.svelte";
  import { CATEGORIES, type Item } from "../shared/catalog";
  import { PHOTOS, photoUrl } from "../shared/photos";
  import { MAX_INPUT, type AttemptResult } from "../shared/types";
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
    onedit,
    onback,
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
    /** For the player's own listing: go and edit it. */
    onedit?: () => void;
    onback: () => void;
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
</script>

{#snippet rating(n: number)}
  <span class="flex shrink-0 text-accent" aria-label={S.stars[lang].replace("{n}", String(n))}>
    {#each Array(5) as _, i}<Icon name="star" size={13} class={i < n ? "fill-current" : "opacity-30"} />{/each}
  </span>
{/snippet}

<div class="flex flex-col gap-5">
  <nav class="flex flex-wrap items-center gap-1.5 text-sm opacity-70">
    <button type="button" onclick={onback} class="underline-offset-4 hover:underline">{S.navShop[lang]}</button>
    <Icon name="chevron-right" size={13} />
    <span>{CATEGORIES.find((c) => c.id === item.category)?.label[lang]}</span>
    <Icon name="chevron-right" size={13} />
    <span class="text-strong">{item.title[lang]}</span>
  </nav>

  <div class="grid gap-5 sm:grid-cols-[minmax(0,4fr)_minmax(0,6fr)]">
    <figure>
      <div class="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-2xl border border-line bg-surface-2 text-accent">
        {#if photoUrl(item.id)}
          <img src={photoUrl(item.id)} alt={item.title[lang]} class="h-full w-full object-cover" />
        {:else}
          <svg viewBox="0 0 120 90" class="h-[70%] w-[70%]" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{@html item.art}</svg>
        {/if}
      </div>
      {#if PHOTOS[item.id]}
        <figcaption class="mt-1 text-xs opacity-50">{S.photoBy[lang]} <a href={PHOTOS[item.id].page} target="_blank" rel="noopener" class="underline-offset-2 hover:underline">{PHOTOS[item.id].author}</a>, {PHOTOS[item.id].licence}</figcaption>
      {/if}
    </figure>
    <div class="flex flex-col gap-3">
      {#if item.own}<p class="self-start rounded-full bg-accent px-2.5 py-0.5 text-sm text-accent-fg">{S.ownTag[lang]}</p>{/if}
      <h1 class="text-2xl leading-snug text-strong">{item.title[lang]}</h1>
      <p class="text-3xl tabular-nums text-strong">CHF {item.price}</p>
      <p class="whitespace-pre-wrap break-words">{item.own ? ownText || item.text[lang] : item.text[lang]}</p>
      <dl class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 border-y border-line py-2.5 text-sm">
        <dt class="opacity-60">{S.condition[lang]}</dt>
        <dd class="text-strong">{item.condition[lang]}</dd>
        <dt class="opacity-60">{S.location[lang]}</dt>
        <dd class="text-strong">{item.place}</dd>
        <dt class="opacity-60">{S.shipping[lang]}</dt>
        <dd class="text-strong">{S.shippingText[lang]}</dd>
      </dl>
      {#if item.own}
        <button type="button" onclick={onedit} class="flex items-center gap-2 self-start rounded-lg border border-line px-4 py-2 transition hover:bg-surface-2"><Icon name="instructions" size={18} />{S.ownEdit[lang]}</button>
      {:else if item.badge === "sold"}
        <p class="self-start rounded bg-accent/25 px-3 py-1.5 text-strong">{S.badgeSold[lang]}</p>
      {:else}
        <button type="button" class="flex items-center gap-2 self-start rounded-lg bg-accent px-4 py-2 text-accent-fg transition hover:brightness-110"><Icon name="cart" size={18} />{S.addToCart[lang]}</button>
      {/if}
    </div>
  </div>

  {#if !item.own}
  <section class="flex flex-col gap-3">
    <h2 class="text-xl text-strong">{S.reviews[lang]}</h2>

    <!-- What the AI makes of the reviews -->
    <div class={`rounded-2xl border bg-surface p-4 transition-colors ${result?.flag ? "border-accent" : "border-line"}`}>
      <div class="flex flex-wrap items-center gap-2">
        <Icon name="bot" size={18} class="text-accent" />
        <h3 class="text-strong">{S.aiSummary[lang]}</h3>
        {#if busy}
          <span class="ml-auto flex items-center gap-2 text-sm opacity-70"><span class="dot"></span>{S.reviewBusy[lang]}</span>
        {:else}
          <span class={`ml-auto rounded-full px-2.5 py-0.5 text-sm ${tone(verdict)}`}>{S[`verdict_${verdict}`][lang]}</span>
        {/if}
      </div>
      <p class={`mt-2 ${busy ? "opacity-40" : ""}`}>{summary}</p>
      {#if result?.flag}
        <p class="mt-3 text-strong">{S.flagWon[lang]} <FlagText text={result.flag} {lang} {oncopy} /></p>
      {/if}
    </div>

    <!-- Write one: stars, text, Enter -->
    {#if canReview}
      <form onsubmit={send} class={`flex flex-col gap-2 rounded-2xl border border-line bg-surface p-3 ${beacon ? "pi-beacon" : ""}`}>
        <div class="flex items-center gap-3">
          <label for="review" class="text-sm text-strong">{S.writeReview[lang]}</label>
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
          <button type="submit" disabled={!text.trim() || busy} class="shrink-0 rounded-full bg-accent px-4 py-2 text-accent-fg transition enabled:hover:brightness-110 disabled:opacity-40">{S.reviewSend[lang]}</button>
        </div>
      </form>
    {/if}

    <!-- Newest first: the player's own review on top -->
    <ul class="flex flex-col gap-2">
      {#if mine}
        <li class="rounded-xl border border-accent/60 bg-accent/10 px-3 py-2">
          <p class="flex items-center gap-2 text-sm">{@render rating(mine.stars)}<span class="text-accent">{S.you[lang]}</span></p>
          <p class="mt-0.5 whitespace-pre-wrap break-words text-strong">{mine.text}</p>
        </li>
      {/if}
      {#each item.reviews as r}
        <li class="rounded-xl border border-line px-3 py-2">
          <p class="flex items-center gap-2 text-sm">{@render rating(r.stars)}<span class="opacity-70">{r.name}</span></p>
          <p class="mt-0.5">{r.text[lang]}</p>
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
