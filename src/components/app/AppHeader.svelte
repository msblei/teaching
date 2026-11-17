<script lang="ts">
  // The site-wide header row, same as on every other page, for apps that
  // draw their own page (Base.astro with `app`).
  import type { Lang } from "../../lib/i18n";
  import { setTheme, type Theme } from "../../lib/theme";
  import { HEADER_CLASS, BRAND_CLASS, ICON_BTN_CLASS } from "../../lib/site";
  import Icon from "./Icon.svelte";
  import LangPicker from "./LangPicker.svelte";
  import { A } from "./strings";

  let { lang, theme }: { lang: Lang; theme: Theme } = $props();
</script>

<!-- Above whatever an app puts right below it, so the language menu is never covered. -->
<header class={`${HEADER_CLASS} relative z-50`}>
  <a href="/" class={BRAND_CLASS}>teaching</a>
  <div class="ml-auto flex items-center gap-1">
    <LangPicker {lang} />
    <button type="button" onclick={() => setTheme(theme === "dark" ? "light" : "dark")} aria-label={A.theme[lang]} title={A.theme[lang]} class={ICON_BTN_CLASS}>
      <Icon name={theme === "dark" ? "sun" : "moon"} size={19} />
    </button>
  </div>
</header>
