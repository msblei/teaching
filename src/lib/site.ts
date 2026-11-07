// The subtle header and footer every page shares. Static pages render them
// with SiteHeader.astro / SiteFooter.astro, apps with their own components;
// both use these classes so they look identical everywhere.

export const HEADER_CLASS = "flex h-14 shrink-0 items-center gap-2 px-3";
export const BRAND_CLASS = "rounded-lg px-2 py-1.5 text-sm opacity-60 transition hover:opacity-100";
export const ICON_BTN_CLASS = "rounded-lg p-2 opacity-70 transition hover:bg-surface-2 hover:opacity-100";
export const FOOTER_CLASS = "shrink-0 py-2.5 text-center text-xs opacity-60";
export const FOOTER_LINK_CLASS = "hover:opacity-100 hover:underline";

export const SITE_URL = "https://mariusbleif.com";
export const copyright = () => `© ${new Date().getFullYear()} Marius Bleif`;
