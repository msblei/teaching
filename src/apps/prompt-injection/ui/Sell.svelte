<script lang="ts">
  // The seller's area, as a marketplace would offer it: the player's listing
  // with a description to edit, their balance, and "Insights", the list of
  // shopping agents that looked at the listing and what they decided.
  // Level 4 is played here: every save brings the next agent by, and its
  // decision turns up as a new row.
  import { tick } from "svelte";
  import Icon from "../../../components/app/Icon.svelte";
  import FlagText from "./FlagText.svelte";
  import { ITEMS, OWN_ID } from "../shared/catalog";
  import { PHOTOS, photoUrl } from "../shared/photos";
  import { MAX_INPUT, type AttemptResult } from "../shared/types";
  import { S } from "./strings";
  import type { Lang } from "../../../lib/i18n";

  let {
    lang,
    phase,
    beacon = false,
    busy,
    description,
    visits,
    onback,
    onopen,
    onsave,
    oncopy,
  }: {
    lang: Lang;
    /** Before level 4, while it is played, and after it is solved. */
    phase: "locked" | "open" | "done";
    /** Mark where to click or type next. */
    beacon?: boolean;
    busy: boolean;
    /** The listing's description as it stands. */
    description: string;
    /** What the agents that came by since made of it, newest first. */
    visits: AttemptResult[];
    onback: () => void;
    onopen: (itemId: string) => void;
    onsave: (text: string) => void;
    oncopy: (flag: string) => void;
  } = $props();

  const mine = ITEMS.find((i) => i.id === OWN_ID)!;
  const byListing = (no: string) => ITEMS.find((i) => i.listing === no);

  let editing = $state(false);
  let text = $state("");
  let field: HTMLTextAreaElement | undefined = $state();
  async function edit() {
    text = description;
    editing = true;
    await tick();
    field?.focus();
    field?.select();
  }
  function save(e: Event) {
    e.preventDefault();
    if (!text.trim() || busy) return;
    editing = false;
    onsave(text.trim());
  }

  const sold = $derived(phase === "done" || visits.some((v) => v.bought === mine.listing));
</script>

<div class="flex flex-col gap-5">
  <nav class="flex flex-wrap items-center gap-1.5 text-sm opacity-70">
    <button type="button" onclick={onback} class="underline-offset-4 hover:underline">{S.navShop[lang]}</button>
    <Icon name="chevron-right" size={13} />
    <span class="text-strong">{S.myListings[lang]}</span>
  </nav>

  <div class="flex flex-wrap items-end justify-between gap-3">
    <h1 class="text-2xl text-strong">{S.myListings[lang]}</h1>
    <!-- What selling has brought in so far -->
    <div class={`rounded-2xl border px-4 py-2 text-right transition-colors ${sold ? "border-accent bg-accent/10" : "border-line bg-surface"}`}>
      <p class="text-xs opacity-60">{S.balance[lang]}</p>
      <p class="text-xl tabular-nums text-strong">CHF {sold ? "480.00" : "0.00"}</p>
      <p class="text-xs opacity-60">{S.soldCount[lang].replace("{n}", sold ? "1" : "0")}</p>
    </div>
  </div>

  <!-- The listing -->
  <section class="rounded-2xl border border-line bg-surface p-4">
    <div class="flex gap-4">
      <img src={photoUrl(mine.id)} alt={mine.title[lang]} class={`h-28 w-28 shrink-0 rounded-xl object-cover sm:h-36 sm:w-36 ${phase === "done" ? "opacity-50 grayscale" : ""}`} />
      <div class="min-w-0 flex-1">
        <p class="flex flex-wrap items-center gap-2 text-xs">
          <span class="opacity-60">{mine.listing}</span>
          <span class={`rounded-full px-2 py-0.5 ${phase === "done" ? "bg-accent/25 text-strong" : "bg-surface-2"}`}>{(phase === "done" ? S.listingSold : S.listingOnline)[lang]}</span>
          <button type="button" onclick={() => onopen(mine.id)} class="underline-offset-2 opacity-70 hover:underline hover:opacity-100">{S.listingView[lang]}</button>
        </p>
        <h2 class="mt-1 text-lg leading-snug text-strong">{mine.title[lang]}</h2>
        <p class="text-xl tabular-nums text-strong">CHF {mine.price}</p>

        <p class="mt-3 text-sm opacity-60">{S.listingText[lang]}</p>
        {#if editing}
          <form onsubmit={save} class="mt-1 flex flex-col gap-2">
            <textarea
              bind:this={field}
              bind:value={text}
              rows="4"
              maxlength={MAX_INPUT}
              placeholder={S.listingPlaceholder[lang]}
              aria-label={S.listingText[lang]}
              onkeydown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !e.isComposing) save(e);
                if (e.key === "Escape") editing = false;
              }}
              class={`resize-y rounded-xl border border-line bg-bg px-3 py-2 text-strong outline-none placeholder:opacity-50 focus:border-accent/60 ${beacon ? "pi-beacon" : ""}`}
            ></textarea>
            <div class="flex flex-wrap items-center gap-2">
              <button type="submit" disabled={!text.trim() || busy} class="rounded-full bg-accent px-4 py-1.5 text-accent-fg transition enabled:hover:brightness-110 disabled:opacity-40">{S.listingSave[lang]}</button>
              <button type="button" onclick={() => (editing = false)} class="rounded-full px-3 py-1.5 transition hover:bg-surface-2">{S.listingCancel[lang]}</button>
              <span class="ml-auto text-xs opacity-60">{S.listingFixed[lang]}</span>
            </div>
          </form>
        {:else}
          <p class="mt-0.5 whitespace-pre-wrap break-words text-strong">{description}</p>
          {#if phase === "open"}
            <button type="button" onclick={edit} disabled={busy} class={`mt-3 flex items-center gap-1.5 rounded-full border border-line px-3.5 py-1.5 transition enabled:hover:bg-surface-2 disabled:opacity-40 ${beacon ? "pi-beacon" : ""}`}>
              <Icon name="instructions" size={16} />{S.listingEdit[lang]}
            </button>
          {:else if phase === "locked"}
            <p class="mt-3 flex items-center gap-2 text-sm opacity-70"><Icon name="lock" size={16} />{S.listingLocked[lang]}</p>
          {/if}
        {/if}
      </div>
    </div>
    <p class="mt-3 text-xs opacity-50">{S.photoBy[lang]} <a href={PHOTOS[mine.id].page} target="_blank" rel="noopener" class="underline-offset-2 hover:underline">{PHOTOS[mine.id].author}</a>, {PHOTOS[mine.id].licence}</p>
  </section>

  <!-- Insights: which agents came by, and what they did -->
  <section>
    <h2 class="flex items-center gap-2 text-xl text-strong">{S.insights[lang]} <span class="rounded bg-accent px-1.5 text-xs text-accent-fg">{S.badgeNew[lang]}</span></h2>
    <p class="mt-1 text-sm opacity-70">{S.insightsTitle[lang]}. {S.insightsText[lang]}</p>

    <ul class="mt-3 flex flex-col gap-2">
      {#if busy}
        <li class="flex items-center gap-2.5 rounded-xl border border-accent/50 bg-surface px-4 py-3">
          <span class="dot"></span><span class="text-strong">{S.visitBusy[lang]}</span>
        </li>
      {/if}
      {#each visits as v, i}
        {@const yours = v.bought === mine.listing}
        {@const other = v.bought ? byListing(v.bought) : undefined}
        <li class={`rounded-xl border px-4 py-3 ${yours ? "border-accent bg-accent/10" : "border-line bg-surface"}`}>
          <p class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span class="w-24 shrink-0 text-sm opacity-60">{(i === 0 && !busy ? S.visitNow : S.visitEarlier)[lang]}</span>
            <span class="min-w-0 flex-1"><span class="text-sm opacity-60">{S.visitAsked[lang]}:</span> «{S.buyerRequest[lang]}»</span>
          </p>
          <p class="mt-1.5 flex flex-wrap items-center gap-2 sm:pl-[6.75rem]">
            <Icon name={yours ? "check" : "cart"} size={16} class={`shrink-0 ${yours ? "text-accent" : "opacity-60"}`} />
            {#if yours}
              <span class="text-strong">{S.visitBoughtYours[lang]}</span>
            {:else if other}
              <span class="text-strong">{S.visitBought[lang].replace("{what}", `${other.listing}, ${other.title[lang]}, CHF ${other.price}`)}</span>
              <button type="button" onclick={() => onopen(other.id)} class="text-sm underline underline-offset-2 opacity-70 hover:opacity-100">{S.listingView[lang]}</button>
            {:else}
              <span class="text-strong">{v.bought ? S.visitBought[lang].replace("{what}", v.bought) : S.visitNothing[lang]}</span>
            {/if}
          </p>
          {#if v.reply}<p class="mt-1 text-sm opacity-80 sm:pl-[6.75rem]"><span class="opacity-70">{S.visitReason[lang]}:</span> {v.reply}</p>{/if}
          {#if v.flag}<p class="mt-2 text-strong sm:pl-[6.75rem]">{S.flagWon[lang]} <FlagText text={v.flag} {lang} {oncopy} /></p>{/if}
        </li>
      {/each}
      <!-- Before the player touched anything: two agents that passed the listing by. -->
      {#each [[S.visitYesterday, S.oldRequest1], [S.visitTwoDays, S.oldRequest2]] as [when, asked]}
        <li class="rounded-xl border border-line px-4 py-3 opacity-80">
          <p class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span class="w-24 shrink-0 text-sm opacity-60">{when[lang]}</span>
            <span class="min-w-0 flex-1"><span class="text-sm opacity-60">{S.visitAsked[lang]}:</span> «{asked[lang]}»</span>
          </p>
          <p class="mt-1.5 flex items-center gap-2 sm:pl-[6.75rem]"><Icon name="x" size={16} class="shrink-0 opacity-60" />{S.visitNotBought[lang]}</p>
        </li>
      {/each}
    </ul>
  </section>
</div>

<style>
  .dot {
    width: 0.55rem;
    height: 0.55rem;
    flex-shrink: 0;
    border-radius: 9999px;
    background: var(--accent);
    animation: pulse 1.2s ease-in-out infinite;
  }
  @keyframes pulse {
    0%, 100% { opacity: 0.3; }
    50% { opacity: 1; }
  }
</style>
