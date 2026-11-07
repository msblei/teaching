<script lang="ts">
  // "Level unlocked" moment, like in a video game: rings and a burst of
  // particles around the new level's icon, then Continue (or Enter, or
  // after a few seconds) hands over to the spotlight.
  import { onMount } from "svelte";
  import Icon from "./Icon.svelte";
  import { S } from "./strings";
  import type { Lang } from "../../../lib/i18n";

  let { level, lang, ondone }: { level: 2 | 3; lang: Lang; ondone: () => void } = $props();

  const title = $derived(level === 2 ? S.tools : S.instructions);
  const sub = $derived(level === 2 ? S.levelToolsSub : S.levelInstrSub);
  const PARTICLES = 14;

  let button: HTMLButtonElement | undefined = $state();
  let closed = false;
  const close = () => {
    if (closed) return;
    closed = true;
    ondone();
  };
  onMount(() => {
    button?.focus();
    const t = setTimeout(close, 4500);
    return () => clearTimeout(t);
  });
</script>

<svelte:window onkeydown={(e) => e.key === "Escape" && close()} />

<div class="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={`${S.levelUnlocked[lang].replace("{n}", String(level))}: ${title[lang]}`}>
  <div class="card flex flex-col items-center px-8 text-center">
    <div class="relative flex h-40 w-40 items-center justify-center">
      <span class="ring r1"></span>
      <span class="ring r2"></span>
      <span class="ring r3"></span>
      {#each Array(PARTICLES) as _, i}
        <span class="spark" style:--a={`${(360 / PARTICLES) * i}deg`} style:--d={`${(i % 3) * 60}ms`}></span>
      {/each}
      <span class="badge relative flex h-20 w-20 items-center justify-center rounded-full bg-accent text-accent-fg">
        <Icon name={level === 2 ? "tools" : "instructions"} size={36} />
      </span>
    </div>

    <h2 class="rise mt-4 text-5xl text-white" style:--delay="300ms">{title[lang]}</h2>
    <p class="rise mt-3 text-lg text-white/75" style:--delay="500ms">{sub[lang]}</p>
    <button
      bind:this={button}
      type="button"
      onclick={close}
      class="rise mt-8 rounded-full bg-accent px-6 py-2.5 text-accent-fg outline-none transition hover:brightness-110 focus-visible:ring-2 focus-visible:ring-white/60"
      style:--delay="700ms"
    >
      {S.levelGo[lang]}
    </button>
  </div>
</div>

<style>
  .badge {
    animation: pop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both;
    box-shadow: 0 0 40px color-mix(in srgb, var(--accent) 70%, transparent);
  }
  .ring {
    position: absolute;
    inset: 30%;
    border-radius: 9999px;
    border: 2px solid var(--accent);
    opacity: 0;
    animation: ring 1.8s ease-out infinite;
  }
  .r2 { animation-delay: 0.6s; }
  .r3 { animation-delay: 1.2s; }
  .spark {
    position: absolute;
    left: 50%;
    top: 50%;
    width: 6px;
    height: 6px;
    margin: -3px;
    border-radius: 9999px;
    background: var(--accent);
    opacity: 0;
    animation: spark 0.9s ease-out both;
    animation-delay: calc(150ms + var(--d));
  }
  .rise {
    animation: rise 0.5s ease-out both;
    animation-delay: var(--delay);
  }
  @keyframes pop {
    from { transform: scale(0.2); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
  }
  @keyframes ring {
    0% { transform: scale(0.8); opacity: 0.8; }
    100% { transform: scale(2.6); opacity: 0; }
  }
  @keyframes spark {
    0% { transform: rotate(var(--a)) translateY(0) scale(1); opacity: 1; }
    100% { transform: rotate(var(--a)) translateY(-78px) scale(0.3); opacity: 0; }
  }
  @keyframes rise {
    from { transform: translateY(12px); opacity: 0; }
    to { transform: none; opacity: 1; }
  }
  @media (prefers-reduced-motion: reduce) {
    .badge, .ring, .spark, .rise { animation: none; }
    .ring, .spark { display: none; }
  }
</style>
