<script lang="ts">
  // DigiBroki's logo: a price tag with a little block of pixels on it, the
  // thrift shop gone digital. Mark alone, or mark with the name.
  let { size = 40, name = false }: { size?: number; name?: boolean } = $props();
</script>

<span class="inline-flex items-center gap-2.5">
  <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" class="shrink-0">
    <!-- tag -->
    <path d="M6 9a5 5 0 0 1 5-5h14.300a5 5 0 0 1 3.500 1.500l14.200 14.200a5 5 0 0 1 0 7L28.700 41a5 5 0 0 1-7 0L7.500 26.800A5 5 0 0 1 6 23.300z" fill="var(--accent)" />
    <!-- eyelet -->
    <circle cx="15" cy="13" r="3" fill="var(--bg)" />
    <!-- pixels -->
    <g fill="var(--accent-fg)">
      <rect x="20.500" y="18" width="5" height="5" rx="1" />
      <rect x="27" y="18" width="5" height="5" rx="1" opacity="0.55" />
      <rect x="20.500" y="24.500" width="5" height="5" rx="1" opacity="0.55" />
      <rect x="27" y="24.500" width="5" height="5" rx="1" />
      <rect x="23.750" y="31" width="5" height="5" rx="1" opacity="0.8" />
    </g>
  </svg>
  {#if name}
    <span class="leading-none tracking-tight text-strong" style:font-size={`${size * 0.92}px`}>Digi<span class="text-accent">Broki</span></span>
  {/if}
</span>
