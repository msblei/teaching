<script lang="ts">
  // A card in the middle of the screen that moves the story on: the intro,
  // the story of a level, the explanation of a solved one, the wrap-up.
  import { onMount } from "svelte";
  import type { Snippet } from "svelte";
  import Icon, { type IconName } from "../../../components/app/Icon.svelte";

  let {
    icon,
    kicker,
    title,
    action,
    onaction,
    wide = false,
    children,
  }: { icon: IconName; kicker: string; title: string; action: string; onaction: () => void; /** Room for a prompt listing. */ wide?: boolean; children?: Snippet } = $props();

  let button: HTMLButtonElement | undefined = $state();
  onMount(() => button?.focus());
</script>

<div class="fixed inset-0 z-[55] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={title}>
  <div class={`card max-h-full w-full overflow-y-auto ${wide ? "max-w-2xl" : "max-w-lg"} rounded-3xl border border-line bg-bg p-6 shadow-2xl`}>
    <p class="flex items-center gap-2 text-sm text-accent"><Icon name={icon} size={18} />{kicker}</p>
    <h2 class="mt-2 text-2xl leading-snug text-strong">{title}</h2>
    <div class="mt-3 flex flex-col gap-3 leading-relaxed">{@render children?.()}</div>
    <div class="mt-5 flex justify-end">
      <button bind:this={button} type="button" onclick={onaction} class="rounded-full bg-accent px-5 py-2 text-accent-fg outline-none transition hover:brightness-110 focus-visible:ring-2 focus-visible:ring-accent/50">{action}</button>
    </div>
  </div>
</div>

<style>
  .card {
    animation: in 0.3s ease-out both;
  }
  @keyframes in {
    from { opacity: 0; transform: translateY(10px) scale(0.98); }
    to { opacity: 1; transform: none; }
  }
  @media (prefers-reduced-motion: reduce) {
    .card { animation: none; }
  }
</style>
