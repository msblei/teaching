<script lang="ts">
  // Model switcher under the message box, like the Claude web app: shows
  // the exact model version, opens a menu (upward) with the alternatives.
  import { MODEL_KEYS, MODEL_LABELS, type ModelInfo, type ModelKey } from "../shared/types";
  import Icon from "./Icon.svelte";

  let { model = $bindable(), models, disabled = false }: { model: ModelKey; models: ModelInfo[]; disabled?: boolean } = $props();
  let open = $state(false);
  let root: HTMLDivElement | undefined = $state();

  const info = (k: ModelKey) => models.find((m) => m.key === k);
  const current = $derived(info(model)?.label ?? MODEL_LABELS[model]);
</script>

<svelte:window
  onclick={(e) => open && root && !root.contains(e.target as Node) && (open = false)}
  onkeydown={(e) => e.key === "Escape" && (open = false)}
/>

<div bind:this={root} class="relative">
  <button
    type="button"
    onclick={() => (open = !open)}
    {disabled}
    aria-haspopup="menu"
    aria-expanded={open}
    class="flex items-center gap-1.5 rounded-lg px-2 py-1 text-strong transition hover:bg-surface-2 disabled:opacity-60"
  >
    {current}
    <Icon name="chevron-down" size={14} class="opacity-50" />
  </button>

  {#if open}
    <div class="absolute bottom-full right-0 z-30 mb-1 w-64 rounded-2xl border border-line bg-surface p-1.5 shadow-xl" role="menu">
      {#each MODEL_KEYS as k}
        <button
          type="button"
          role="menuitemradio"
          aria-checked={model === k}
          onclick={() => ((model = k), (open = false))}
          class="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-surface-2"
        >
          <span class="min-w-0 flex-1">
            <span class="block text-strong">{info(k)?.label ?? MODEL_LABELS[k]}</span>
            <span class="block text-sm opacity-60">{info(k)?.provider ?? ""}</span>
          </span>
          {#if model === k}<Icon name="check" size={18} class="text-accent" />{/if}
        </button>
      {/each}
    </div>
  {/if}
</div>
