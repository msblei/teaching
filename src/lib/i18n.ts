// DE/EN for the whole teaching site.
// Static pages render both languages (<T de en />) and CSS hides one.
// Islands read the active language from <html data-lang> via `getLang()`
// and listen for `langchange`.

export type Lang = "de" | "en";
export type Text = { de: string; en: string };

export const LANG_KEY = "teach.lang";

export function getLang(): Lang {
  if (typeof document === "undefined") return "en";
  return document.documentElement.dataset.lang === "de" ? "de" : "en";
}

export function setLang(lang: Lang) {
  document.documentElement.dataset.lang = lang;
  document.documentElement.lang = lang;
  try {
    localStorage.setItem(LANG_KEY, lang);
  } catch {}
  window.dispatchEvent(new CustomEvent("langchange", { detail: lang }));
}

// Runs inline in <head> before paint (stringified into Base.astro):
// ?lang= wins, then the saved choice, then the browser language.
export const initLangScript = `(() => {
  let l = new URLSearchParams(location.search).get("lang");
  if (l !== "de" && l !== "en") {
    try { l = localStorage.getItem("${LANG_KEY}"); } catch {}
  }
  if (l !== "de" && l !== "en") {
    l = (navigator.language || "").toLowerCase().startsWith("de") ? "de" : "en";
  }
  document.documentElement.dataset.lang = l;
  document.documentElement.lang = l;
})();`;
