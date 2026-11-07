<script lang="ts">
  // Stage 3: mission cards above the composer. Picking one opens the
  // fill-in-the-blanks sentence; Start hands the assembled instructions up.
  import { MISSIONS, buildInstructions, sentenceParts, type Mission } from "../shared/missions";
  import { prepareImage } from "./agent";
  import { S } from "./strings";
  import Icon from "./Icon.svelte";
  import type { Lang } from "../../../lib/i18n";

  export type Start = { mission: Mission; system: string; kickoff: string; image?: { data: string; mediaType: "image/jpeg" } };

  let { lang, onstart }: { lang: Lang; onstart: (s: Start) => void } = $props();

  let active = $state<Mission | null>(null);
  let values = $state<Record<string, string>>({});
  let showInstr = $state(false);
  let edited = $state<string | null>(null);
  let photo = $state<{ data: string; mediaType: "image/jpeg" } | null>(null);

  const instructions = $derived(active ? (edited ?? buildInstructions(active, values, lang)) : "");

  function pick(m: Mission) {
    active = m;
    values = Object.fromEntries(m.blanks.map((b) => [b.key, b.default[lang]]));
    edited = null;
    showInstr = false;
    photo = null;
  }

  async function onPhoto(e: Event) {
    const f = (e.currentTarget as HTMLInputElement).files?.[0];
    if (f) photo = await prepareImage(f);
  }

  function start() {
    if (!active || (active.needsPhoto && !photo)) return;
    onstart({ mission: active, system: instructions, kickoff: active.kickoff[lang], image: photo ?? undefined });
    active = null;
  }
</script>

<div class="appear" data-tour="missions">
  {#if !active}
    <p class="mb-2 px-1 text-sm opacity-70">{S.missionsTitle[lang]}</p>
    <div class="flex gap-2 overflow-x-auto pb-1 sm:grid sm:grid-cols-3">
      {#each MISSIONS as m}
        <button
          type="button"
          onclick={() => pick(m)}
          class="w-56 shrink-0 rounded-2xl border border-line bg-surface p-3 text-left transition hover:border-accent/60 hover:bg-surface-2 sm:w-auto"
        >
          <Icon name={m.icon} size={20} class="text-accent" />
          <span class="mt-2 block text-strong">{m.title[lang]}</span>
          <span class="block text-sm opacity-70">{m.tagline[lang]}</span>
        </button>
      {/each}
    </div>
  {:else}
    <div class="rounded-2xl border border-accent/40 bg-surface p-4">
      <div class="flex items-center gap-2">
        <Icon name={active.icon} size={20} class="text-accent" />
        <span class="text-strong">{active.title[lang]}</span>
        <button type="button" onclick={() => (active = null)} aria-label={S.cancel[lang]} class="ml-auto rounded-lg p-1 opacity-60 hover:bg-surface-2 hover:opacity-100">
          <Icon name="x" size={18} />
        </button>
      </div>

      <p class="mt-3 text-[1.05rem] leading-[2.2] text-strong">
        {#each sentenceParts(active, lang) as part}
          {#if "text" in part}{part.text}{:else}
            <input
              bind:value={values[part.blank.key]}
              oninput={() => (edited = null)}
              style:width={part.blank.width}
              aria-label={part.blank.key}
              class="mx-1 rounded-md border-b-2 border-accent bg-accent/10 px-2 py-0.5 text-center text-accent outline-none focus:bg-accent/20"
            />
          {/if}
        {/each}
      </p>

      {#if active.needsPhoto}
        <label class="mt-3 inline-flex cursor-pointer items-center gap-3">
          <input type="file" accept="image/*" capture="environment" class="hidden" onchange={onPhoto} />
          {#if photo}
            <img src={`data:${photo.mediaType};base64,${photo.data}`} alt="" class="h-16 w-16 rounded-xl object-cover" />
            <span class="text-sm underline underline-offset-4 opacity-70">{S.changePhoto[lang]}</span>
          {:else}
            <span class="flex items-center gap-2 rounded-xl border border-dashed border-line px-4 py-3 hover:bg-surface-2">
              <Icon name="camera" size={18} />
              {S.takePhoto[lang]}
            </span>
          {/if}
        </label>
      {/if}

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
        <button type="button" onclick={start} disabled={active.needsPhoto && !photo} class="rounded-full bg-accent px-5 py-2 text-accent-fg transition hover:brightness-110 disabled:opacity-30">
          {S.startMission[lang]}
        </button>
        <button type="button" onclick={() => (showInstr = !showInstr)} class="text-sm opacity-70 underline-offset-4 hover:underline hover:opacity-100">
          {showInstr ? S.hideInstructions[lang] : S.showInstructions[lang]}
        </button>
      </div>
    </div>
  {/if}
</div>

<style>
  .appear {
    animation: appear 0.45s ease-out both;
  }
  @keyframes appear {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: none; }
  }
</style>
