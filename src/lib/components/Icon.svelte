<!-- Small inline stroke icons (decorative; the surrounding button carries the label). -->
<script lang="ts" module>
  export type IconName =
    | "gear"
    | "star"
    | "pencil"
    | "close"
    | "check"
    | "plus"
    | "photo"
    | "search"
    | "clock"
    | "swap"
    | "trash"
    | "back"
    | "undo"
    | "play"
    | "pause"
    | "skip"
    | "restart"
    | "popout"
    | "up"
    | "down"
    | "sound"
    | "copy"
    | "help";
</script>

<script lang="ts">
  let {
    name,
    filled = false,
    class: className = "size-6",
  }: { name: IconName; filled?: boolean; class?: string } = $props();
</script>

<svg
  class={className}
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="2.25"
  stroke-linecap="round"
  stroke-linejoin="round"
  aria-hidden="true"
  focusable="false"
>
  {#if name === "gear"}
    <circle cx="12" cy="12" r="3" />
    <path
      d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
    />
  {:else if name === "star"}
    <path
      fill={filled ? "currentColor" : "none"}
      d="M12 2.5l2.94 5.96 6.56.95-4.75 4.63 1.12 6.54L12 17.5l-5.87 3.08 1.12-6.54L2.5 9.41l6.56-.95z"
    />
  {:else if name === "pencil"}
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z" />
  {:else if name === "close"}
    <path d="M18 6 6 18M6 6l12 12" />
  {:else if name === "check"}
    <path d="M4.5 12.5l5 5 10-11" />
  {:else if name === "plus"}
    <path d="M12 5v14M5 12h14" />
  {:else if name === "photo"}
    <rect x="3" y="4" width="18" height="16" rx="2.5" />
    <circle cx="8.5" cy="9.5" r="1.75" />
    <path d="m21 16-5-5L5 20" />
  {:else if name === "search"}
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  {:else if name === "clock"}
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  {:else if name === "swap"}
    <path d="M4 7h13l-3-3M20 17H7l3 3" />
  {:else if name === "trash"}
    <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
  {:else if name === "back"}
    <path d="M15 18l-6-6 6-6" />
  {:else if name === "undo"}
    <path d="M9 14 4 9l5-5" />
    <path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" />
  {:else if name === "play"}
    <path fill="currentColor" d="M7 4.5v15l12.5-7.5z" />
  {:else if name === "pause"}
    <path fill="currentColor" d="M6.5 4.5h4v15h-4zM13.5 4.5h4v15h-4z" />
  {:else if name === "skip"}
    <path fill="currentColor" d="M5 5v14l10-7z" />
    <path d="M18.5 5v14" />
  {:else if name === "restart"}
    <path d="M3.5 12a8.5 8.5 0 1 0 2.5-6" />
    <path d="M3.5 3.5V8H8" />
  {:else if name === "popout"}
    <rect x="3" y="4" width="18" height="16" rx="2.5" />
    <rect x="11.5" y="11.5" width="7" height="6" rx="1" fill="currentColor" />
  {:else if name === "up"}
    <path d="M6 15l6-6 6 6" />
  {:else if name === "down"}
    <path d="M6 9l6 6 6-6" />
  {:else if name === "sound"}
    <path fill="currentColor" d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" />
    <path d="M15.5 9a4.5 4.5 0 0 1 0 6M18 6.5a8 8 0 0 1 0 11" />
  {:else if name === "copy"}
    <rect x="8.5" y="8.5" width="12" height="12" rx="2" />
    <path d="M15.5 8.5V5.5a2 2 0 0 0-2-2h-8a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h3" />
  {:else if name === "help"}
    <circle cx="12" cy="12" r="9.5" />
    <path d="M9.4 9.3a2.7 2.7 0 0 1 5.2.9c0 1.8-2.6 2.4-2.6 4" />
    <path d="M12 17.4h.01" stroke-width="3" />
  {/if}
</svg>
