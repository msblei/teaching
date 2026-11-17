<script lang="ts" module>
  // Hand-drawn line icons (24px grid, stroke = currentColor). No emojis.
  export type IconName =
    | "search" | "file" | "tag" | "tools" | "plus" | "send" | "chevron-down" | "chevron-right"
    | "sun" | "moon" | "new-chat" | "x" | "check" | "camera" | "copy" | "target" | "bag" | "instructions"
    | "flag" | "trophy" | "bulb" | "lock" | "chat" | "cart" | "star" | "eye" | "user" | "shield" | "bot"
    | "heart" | "truck" | "refresh" | "trash" | "pin" | "clock" | "mail" | "arrow-left" | "arrow-right" | "return" | "badge-check";

  const PATHS: Record<IconName, string> = {
    search: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>',
    file: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>',
    tag: '<path d="M3.5 12.5V4.5a1 1 0 0 1 1-1h8l8 8-9 9z"/><circle cx="8" cy="8" r="1.5"/>',
    tools: '<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    send: '<path d="M12 19V5M6 11l6-6 6 6"/>',
    "chevron-down": '<path d="M6 9l6 6 6-6"/>',
    "chevron-right": '<path d="M9 6l6 6-6 6"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    moon: '<path d="M20.5 13.2A8.5 8.5 0 1 1 10.8 3.5a6.6 6.6 0 0 0 9.7 9.7z"/>',
    "new-chat": '<path d="M12 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6"/><path d="M17.6 3.6a2 2 0 0 1 2.8 2.8L12 14.8l-3.6.8.8-3.6z"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    camera: '<path d="M4 8.5h3l1.8-2.5h6.4L17 8.5h3V19H4z"/><circle cx="12" cy="13.5" r="3.3"/>',
    copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h8"/>',
    target: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1" fill="currentColor"/>',
    bag: '<path d="M5 8.5h14l-1.2 11.5H6.2z"/><path d="M9 8.5V7a3 3 0 0 1 6 0v1.5"/>',
    instructions: '<rect x="5" y="3.5" width="14" height="17" rx="2"/><path d="M8.5 8h7M8.5 12h7M8.5 16h4"/>',
    flag: '<path d="M6 21V4M6 4.5h11l-2.5 4 2.5 4H6"/>',
    trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8.5 20h7M10 17h4"/>',
    bulb: '<path d="M9 17h6M10 20.5h4M8.5 14a6 6 0 1 1 7 0c-.6.5-1 1.200-1 2v1h-5v-1c0-.8-.4-1.500-1-2z"/>',
    lock: '<rect x="5.5" y="10.5" width="13" height="10" rx="2"/><path d="M8.500 10.500V8a3.500 3.500 0 0 1 7 0v2.500"/>',
    chat: '<path d="M4.500 6.500a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H11l-4.500 3.500V16.500h0a2 2 0 0 1-2-2z"/>',
    cart: '<path d="M3.500 4.500h2.500l2 10.500h9.500l2-7.500H7"/><circle cx="9.500" cy="19" r="1.300"/><circle cx="16.500" cy="19" r="1.300"/>',
    star: '<path d="M12 3.800l2.500 5.200 5.700.8-4.100 4 1 5.700-5.100-2.700-5.100 2.700 1-5.700-4.100-4 5.700-.8z"/>',
    eye: '<path d="M2.500 12s3.500-6.500 9.500-6.500 9.500 6.500 9.500 6.500-3.500 6.500-9.500 6.500S2.500 12 2.500 12z"/><circle cx="12" cy="12" r="2.800"/>',
    user: '<circle cx="12" cy="8.500" r="3.500"/><path d="M5 20a7 7 0 0 1 14 0"/>',
    shield: '<path d="M12 3.500l7 2.500v5.500c0 4.300-3 7.600-7 9-4-1.400-7-4.700-7-9V6z"/>',
    bot: '<rect x="5" y="8" width="14" height="11" rx="3"/><path d="M12 8V4.500M9.500 13v1.500M14.500 13v1.500"/><circle cx="12" cy="4" r="1"/>',
    heart: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
    truck: '<path d="M3 6.5h10.5v10H3zM13.5 10h4l3 3v3.5h-7"/><circle cx="7.5" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/>',
    refresh: '<path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3M19.5 4.5v4h-4"/>',
    trash: '<path d="M5 7h14M10 7V4.5h4V7M7 7l.8 12.5h8.4L17 7M10.5 11v5M13.5 11v5"/>',
    pin: '<path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    mail: '<rect x="3.5" y="5.5" width="17" height="13" rx="2"/><path d="M4 7l8 6 8-6"/>',
    "arrow-left": '<path d="M19 12H5M11 6l-6 6 6 6"/>',
    "arrow-right": '<path d="M5 12h14M13 6l6 6-6 6"/>',
    return: '<path d="M9 14l-4-4 4-4"/><path d="M5 10h9a5 5 0 0 1 0 10h-3"/>',
    "badge-check": '<circle cx="12" cy="12" r="8.5"/><path d="M8.5 12.2l2.5 2.5 4.5-5"/>',
  };
</script>

<script lang="ts">
  let { name, size = 18, class: cls = "" }: { name: IconName; size?: number; class?: string } = $props();
</script>

<svg
  width={size}
  height={size}
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="1.75"
  stroke-linecap="round"
  stroke-linejoin="round"
  class={cls}
  aria-hidden="true">{@html PATHS[name]}</svg>
