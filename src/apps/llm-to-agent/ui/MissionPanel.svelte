<script lang="ts">
  // Stage 3: one goal card above the composer. Closed, it is a single row
  // that leaves the chat free; open, the goal is a sentence with blanks to
  // fill in. Start hands the assembled instructions up.
  import { MISSION, buildInstructions, goalLabel, initialGoal, sentenceParts } from "../shared/missions";
  import type { Goal } from "../shared/types";
  import { S } from "./strings";
  import Icon from "./Icon.svelte";
  import type { Lang } from "../../../lib/i18n";

  export type Start = { label: string; system: string; kickoff: string; goal: Goal };

  let { lang, onstart, onopen }: { lang: Lang; onstart: (s: Start) => void; onopen?: () => void } = $props();

  let open = $state(false);

  // Blanks left untouched follow the language; typed ones stay as typed.
  let typed = $state<Record<string, string>>({});
  const values = $derived(Object.fromEntries(MISSION.blanks.map((b) => [b.key, typed[b.key] ?? b.default[lang]])));
  let showInstr = $state(false);
  let edited = $state<string | null>(null);

  const instructions = $derived(edited ?? buildInstructions(values, lang));

  function start() {
    onstart({ label: goalLabel(values, lang), system: instructions, kickoff: MISSION.kickoff[lang], goal: initialGoal(values, lang) });
  }
</script>

{#if !open}
  <div class="appear flex">
    <button
      type="button"
      data-tour="missions"
      onclick={() => {
        open = true;
        onopen?.();
      }}
      class="flex max-w-full items-center gap-2 rounded-2xl border border-accent/40 bg-surface px-4 py-2.5 text-left transition hover:border-accent/70 hover:bg-surface-2"
    >
      <Icon name="target" size={20} class="shrink-0 text-accent" />
      <span class="shrink-0 text-strong">{S.missionsTitle[lang]}</span>
      <span class="truncate text-sm opacity-70">{values.kit}, CHF {values.budget}</span>
      <Icon name="chevron-right" size={14} class="shrink-0 opacity-50" />
    </button>
  </div>
{:else}
<div class="appear rounded-2xl border border-accent/40 bg-surface p-4">
  <div class="flex items-center gap-2">
    <Icon name="target" size={20} class="text-accent" />
    <span class="text-strong">{S.missionsTitle[lang]}</span>
    <button type="button" onclick={() => (open = false)} aria-label={S.cancel[lang]} title={S.cancel[lang]} class="ml-auto rounded-lg p-1 opacity-60 hover:bg-surface-2 hover:opacity-100">
      <Icon name="x" size={18} />
    </button>
  </div>

  <p class="mt-2 text-[1.05rem] leading-[2.2] text-strong">
    {#each sentenceParts(lang) as part}
      {#if "text" in part}{part.text}{:else}
        <input
          value={values[part.blank.key]}
          oninput={(e) => {
            typed[part.blank.key] = e.currentTarget.value;
            edited = null;
          }}
          onkeydown={(e) => e.key === "Enter" && start()}
          style:width={part.blank.width}
          aria-label={part.blank.key}
          class="mx-1 max-w-full rounded-md border-b-2 border-accent bg-accent/10 px-2 py-0.5 text-center text-accent outline-none focus:bg-accent/20"
        />
      {/if}
    {/each}
  </p>

  {#if showInstr}
    <textarea
      value={instructions}
      oninput={(e) => (edited = e.currentTarget.value)}
      rows="10"
      class="mt-3 w-full rounded-xl border border-line bg-bg p-3 font-mono text-sm leading-relaxed text-strong outline-none focus:border-accent/60"
    ></textarea>
    <p class="text-xs opacity-60">{S.editHint[lang]}</p>
  {/if}

  <div class="mt-3 flex flex-wrap items-center gap-4">
    <button type="button" onclick={start} class="rounded-full bg-accent px-5 py-2 text-accent-fg transition hover:brightness-110">
      {S.startMission[lang]}
    </button>
    <button type="button" onclick={() => (showInstr = !showInstr)} class="text-sm opacity-70 underline-offset-4 hover:underline hover:opacity-100">
      {showInstr ? S.hideInstructions[lang] : S.showInstructions[lang]}
    </button>
  </div>
</div>
{/if}

<svelte:window onkeydown={(e) => e.key === "Escape" && (open = false)} />

<style>
  .appear {
    animation: appear 0.45s ease-out both;
  }
  @keyframes appear {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: none; }
  }
</style>
