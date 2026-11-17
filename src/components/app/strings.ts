import type { Text } from "../../lib/i18n";

// Copy of the pieces shared by the workshop apps. Short, DE and EN, no em
// dashes, no emojis.
export const A = {
  theme: { de: "Hell oder dunkel", en: "Light or dark" },
  copy: { de: "Kopieren", en: "Copy" },
  copied: { de: "Kopiert", en: "Copied" },
  tourSkip: { de: "Überspringen", en: "Skip" },
  levelGo: { de: "Weiter", en: "Continue" },
} satisfies Record<string, Text>;
