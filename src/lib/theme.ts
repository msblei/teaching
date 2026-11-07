// Light / dark theme for the whole teaching site, mirrored on <html data-theme>.
// Static pages use ThemeToggle.astro; islands call setTheme() and listen
// for `themechange`.

export type Theme = "light" | "dark";
export const THEME_KEY = "teach.theme";

export function getTheme(): Theme {
  if (typeof document === "undefined") return "dark";
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

export function setTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {}
  window.dispatchEvent(new CustomEvent("themechange", { detail: theme }));
}

// Runs inline in <head> before paint: saved choice, else the system setting.
export const initThemeScript = `(() => {
  let t;
  try { t = localStorage.getItem("${THEME_KEY}"); } catch {}
  if (t !== "light" && t !== "dark") t = matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  document.documentElement.dataset.theme = t;
})();`;
