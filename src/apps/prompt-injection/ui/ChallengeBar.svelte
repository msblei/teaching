<script lang="ts">
  // The game strip under the header: progress, hints, flag box and score.
  // The mission itself floats over the shop, see Mission.svelte.
  import Icon from "../../../components/app/Icon.svelte";
  import { LEVELS, type Level } from "../shared/types";
  import { S } from "./strings";
  import type { Lang } from "../../../lib/i18n";

  let {
    lang,
    level,
    solved,
    name,
    score,
    hints,
    canOpenHint,
    flagWaiting,
    boardHref,
    onsubmit,
    onopenhint,
  }: {
    lang: Lang;
    /** The level being played, or null when all are solved. */
    level: Level | null;
    solved: Level[];
    name: string;
    score: number;
    /** Hints the player has opened on this level. */
    hints: string[];
    canOpenHint: boolean;
    /** A flag is on screen and not handed in yet: the flag box lights up. */
    flagWaiting: boolean;
    boardHref: string;
    /** Resolves to whether the flag was right. */
    onsubmit: (flag: string) => Promise<boolean>;
    onopenhint: () => void;
  } = $props();

  let flag = $state("");
  let wrong = $state(false);
  let sending = $state(false);
  let hintsOpen = $state(false);
  let hintsBox: HTMLElement | undefined = $state();

  async function submit(e: Event) {
    e.preventDefault();
    if (!flag.trim() || sending) return;
    sending = true;
    wrong = false;
    const ok = await onsubmit(flag.trim());
    sending = false;
    if (ok) flag = "";
    else wrong = true;
  }

  // A new level starts with a clean bar.
  $effect(() => {
    void level;
    wrong = false;
    hintsOpen = false;
  });
</script>

<!-- The hints close on Escape and on a click anywhere else. -->
<svelte:window
  onkeydown={(e) => e.key === "Escape" && (hintsOpen = false)}
  onclick={(e) => hintsOpen && hintsBox && !hintsBox.contains(e.target as Node) && (hintsOpen = false)}
/>

<div class="relative z-30 shrink-0">
  <div class="border-y border-line bg-surface">
    <div class="mx-auto flex max-w-[1100px] flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2">
      <!-- Progress -->
      <div class="flex items-center gap-1" aria-label={S.level[lang]}>
        {#each LEVELS as l}
          <span
            class={`flex h-7 w-7 items-center justify-center rounded-full text-sm tabular-nums ${
              solved.includes(l) ? "bg-accent text-accent-fg" : l === level ? "text-strong ring-2 ring-accent" : "opacity-40 ring-1 ring-line"
            }`}
          >
            {#if solved.includes(l)}<Icon name="check" size={14} />{:else}{l}{/if}
          </span>
        {/each}
      </div>

      <div class="ml-auto flex flex-wrap items-center gap-x-3 gap-y-2">
        {#if level}
          <!-- Hints: free, opened one at a time -->
          <div class="relative" bind:this={hintsBox}>
            <button
              type="button"
              onclick={() => (hintsOpen = !hintsOpen)}
              aria-expanded={hintsOpen}
              class={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition hover:bg-surface-2 ${hintsOpen ? "border-accent/60 bg-surface-2" : "border-line"}`}
            >
              <Icon name="bulb" size={16} class="text-accent" />
              {S.hints[lang]}
              {#if hints.length}<span class="tabular-nums opacity-70">{hints.length}</span>{/if}
            </button>
            {#if hintsOpen}
              <div class="absolute right-0 top-full z-40 mt-2 w-[min(26rem,calc(100vw-1.5rem))] rounded-2xl border border-line bg-bg p-3 pr-10 text-sm shadow-xl">
                <button type="button" onclick={() => (hintsOpen = false)} aria-label={S.close[lang]} title={S.close[lang]} class="absolute right-2 top-2 rounded-lg p-1 opacity-60 hover:bg-surface-2 hover:opacity-100"><Icon name="x" size={16} /></button>
                {#each hints as h, i}
                  <p class="flex gap-2 py-1.5"><span class="shrink-0 tabular-nums text-accent">{i + 1}.</span><span class="leading-relaxed text-strong">{h}</span></p>
                {/each}
                {#if canOpenHint}
                  <button type="button" onclick={onopenhint} class={`rounded-full ${hints.length ? "mt-2" : ""} bg-accent px-3 py-1 text-accent-fg transition hover:brightness-110`}>
                    {hints.length ? S.hintNext[lang] : S.hintShow[lang]}
                  </button>
                {/if}
              </div>
            {/if}
          </div>

          <!-- Flag box -->
          <form
            onsubmit={submit}
            class={`flex items-center gap-1 rounded-full border bg-bg p-1 ${flagWaiting && !flag ? "pi-beacon" : ""} ${wrong ? "shake border-danger" : "border-line focus-within:border-accent/60"}`}
          >
            <Icon name="flag" size={16} class="ml-2 shrink-0 text-accent" />
            <input
              bind:value={flag}
              oninput={() => (wrong = false)}
              placeholder={S.flagPlaceholder[lang]}
              aria-label={S.flagLabel[lang]}
              autocomplete="off"
              autocapitalize="off"
              spellcheck="false"
              class="w-48 min-w-0 bg-transparent px-1 font-mono text-sm text-strong outline-none placeholder:font-sans placeholder:opacity-50"
            />
            <button type="submit" disabled={!flag.trim() || sending} class="rounded-full bg-accent px-3 py-1 text-sm text-accent-fg transition enabled:hover:brightness-110 disabled:opacity-40">{S.flagSubmit[lang]}</button>
          </form>
        {/if}

        <!-- Score -->
        <a href={boardHref} target="_blank" rel="noopener" class="flex items-center gap-2 rounded-full px-2 py-1.5 text-sm transition hover:bg-surface-2" title={S.board[lang]}>
          <Icon name="trophy" size={16} class="text-accent" />
          <span class="max-w-[8rem] truncate opacity-80">{name}</span>
          <span class="rounded-full bg-accent/15 px-2 py-0.5 tabular-nums text-strong">{score} {S.points[lang]}</span>
        </a>
      </div>
      {#if wrong}<p class="w-full text-right text-sm text-danger">{S.flagWrong[lang]}</p>{/if}
    </div>
  </div>

</div>

<style>
  .shake {
    animation: shake 0.35s ease-in-out;
  }
  @keyframes shake {
    25% { transform: translateX(-4px); }
    75% { transform: translateX(4px); }
  }
  @media (prefers-reduced-motion: reduce) {
    .shake { animation: none; }
  }
</style>
