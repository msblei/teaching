<script lang="ts">
  // SaaS-style onboarding spotlight: dims everything except one element
  // (found by its data-tour attribute) and blocks clicks outside it, with a
  // short hint next to it. Follows the element as the layout changes.
  import { onMount } from "svelte";
  import { S } from "./strings";
  import type { Lang, Text } from "../../../lib/i18n";

  let { target, hint, lang, onskip }: { target: string; hint: Text; lang: Lang; onskip: () => void } = $props();

  const PAD = 8;
  let rect = $state<{ x: number; y: number; w: number; h: number } | null>(null);
  let vw = $state(0);
  let vh = $state(0);

  onMount(() => {
    let raf = 0;
    const tick = () => {
      const el = document.querySelector(`[data-tour="${target}"]`);
      vw = window.innerWidth;
      vh = window.innerHeight;
      if (el) {
        const r = el.getBoundingClientRect();
        const next = { x: r.left - PAD, y: r.top - PAD, w: r.width + PAD * 2, h: r.height + PAD * 2 };
        if (!rect || Object.keys(next).some((k) => Math.abs(next[k as keyof typeof next] - rect![k as keyof typeof next]) > 0.5)) rect = next;
      } else rect = null;
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  });

  // Outer frame minus the hole (even-odd), so clicks inside the hole reach the element.
  const clip = $derived(
    rect
      ? `polygon(evenodd, 0 0, ${vw}px 0, ${vw}px ${vh}px, 0 ${vh}px, 0 0, ${rect.x}px ${rect.y}px, ${rect.x}px ${rect.y + rect.h}px, ${rect.x + rect.w}px ${rect.y + rect.h}px, ${rect.x + rect.w}px ${rect.y}px, ${rect.x}px ${rect.y}px)`
      : "none",
  );
  const above = $derived(rect ? rect.y > 120 : true);
  const hintX = $derived(rect ? Math.min(Math.max(rect.x + rect.w / 2, 150), vw - 150) : vw / 2);
</script>

<svelte:window onkeydown={(e) => e.key === "Escape" && onskip()} />

{#if rect}
  <!-- Click blocker with a hole over the target. -->
  <div class="fixed inset-0 z-50" style:clip-path={clip} aria-hidden="true"></div>
  <!-- Dimmed backdrop drawn as the ring's shadow, so the hole has round corners. -->
  <div
    class="ring pointer-events-none fixed z-50 rounded-[1.5rem]"
    style:left={`${rect.x}px`}
    style:top={`${rect.y}px`}
    style:width={`${rect.w}px`}
    style:height={`${rect.h}px`}
    aria-hidden="true"
  ></div>

  <!-- Hint above the element when there is room, otherwise below; kept on screen. -->
  <div
    class="fixed z-50"
    style:left={`${hintX}px`}
    style:transform="translateX(-50%)"
    style:top={above ? undefined : `${rect.y + rect.h + 14}px`}
    style:bottom={above ? `${vh - rect.y + 14}px` : undefined}
    role="status"
  >
    <!-- Bubble nearest the element, skip link on the far side. -->
    <div class={`hint flex items-center gap-2 text-center ${above ? "flex-col-reverse" : "flex-col"}`}>
      <div class="w-max max-w-sm rounded-2xl bg-accent px-4 py-2.5 text-accent-fg shadow-xl">
        <p>{hint[lang]}</p>
      </div>
      <button type="button" onclick={onskip} class="text-xs text-white/70 underline-offset-4 hover:text-white hover:underline">{S.tourSkip[lang]}</button>
    </div>
  </div>
{/if}

<style>
  .ring {
    box-shadow:
      0 0 0 2px var(--accent),
      0 0 0 9999px rgb(0 0 0 / 0.62);
    transition: left 0.25s, top 0.25s, width 0.25s, height 0.25s;
    animation: glow 1.8s ease-in-out infinite;
  }
  .hint {
    animation: hint-in 0.35s ease-out both;
  }
  @keyframes glow {
    0%, 100% { box-shadow: 0 0 0 2px var(--accent), 0 0 18px 2px color-mix(in srgb, var(--accent) 45%, transparent), 0 0 0 9999px rgb(0 0 0 / 0.62); }
    50% { box-shadow: 0 0 0 2px var(--accent), 0 0 30px 8px color-mix(in srgb, var(--accent) 65%, transparent), 0 0 0 9999px rgb(0 0 0 / 0.62); }
  }
  @keyframes hint-in {
    from { opacity: 0; transform: translateY(6px); }
    to { opacity: 1; transform: none; }
  }
  @media (prefers-reduced-motion: reduce) {
    .ring, .hint { animation: none; transition: none; }
  }
</style>
