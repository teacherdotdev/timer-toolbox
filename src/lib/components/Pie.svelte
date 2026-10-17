<!--
  The pie: the whole timer as a circle, each segment a colored wedge sized by its
  length, starting at 12 o'clock. Like a Time Timer, the used-up part disappears
  clockwise, so what's left of the pie is the time left.
-->
<script lang="ts">
  import { colorHex } from "#lib/colors.ts";
  import type { Segment } from "#lib/types.ts";

  let {
    segments,
    lengths,
    used,
    total,
    class: className = "",
  }: {
    segments: Segment[];
    /** Length of each segment in ms. */
    lengths: number[];
    /** Ms of the whole timer used up. */
    used: number;
    total: number;
    class?: string;
  } = $props();

  const R = 92;
  /** Unique per pie, for the grayscale filter's id. */
  const uid = $props.id();
  const TURN = Math.PI * 2;

  function point(angle: number, radius = R): string {
    const x = radius * Math.sin(angle);
    const y = -radius * Math.cos(angle);
    return `${x.toFixed(3)},${y.toFixed(3)}`;
  }

  function wedge(from: number, to: number, r = R): string {
    if (to - from >= TURN - 1e-6) {
      return `M0,${-r} A${r},${r} 0 1 1 0,${r} A${r},${r} 0 1 1 0,${-r} Z`;
    }
    const large = to - from > Math.PI ? 1 : 0;
    return `M0,0 L${point(from, r)} A${r},${r} 0 ${large} 1 ${point(to, r)} Z`;
  }

  const usedAngle = $derived(total > 0 ? (used / total) * TURN : 0);
  const hand = $derived(point(usedAngle).split(",").map(Number));

  // The swept and unswept parts of the pie, drawn a little wider than it so they
  // cover every emoji whole. An emoji's swept part shows gray, the rest in color.
  const CLIP_R = 100;
  const sweptPath = $derived(
    usedAngle > 1e-6 ? wedge(0, usedAngle, CLIP_R) : "",
  );
  const unsweptPath = $derived(
    usedAngle < TURN - 1e-6 ? wedge(usedAngle, TURN, CLIP_R) : "",
  );

  const wedges = $derived.by(() => {
    let start = 0;
    return segments.map((segment, i) => {
      const from = start;
      const to = total > 0 ? from + (lengths[i] / total) * TURN : from;
      start = to;
      const visibleFrom = Math.max(from, usedAngle);
      const middle = (from + to) / 2;
      return {
        id: segment.id,
        emoji: segment.emoji,
        color: colorHex(segment.color),
        path: visibleFrom < to - 1e-6 ? wedge(visibleFrom, to) : null,
        size: to - from,
        // Emoji sit in the middle of their wedge, a bit out from the center.
        emojiAt: point(middle, R * 0.64)
          .split(",")
          .map(Number),
      };
    });
  });
</script>

<svg
  class={className}
  viewBox="-100 -100 200 200"
  role="img"
  aria-hidden="true"
  focusable="false"
>
  <!-- Emoji go gray where the arm has swept past them. An SVG filter rather
       than CSS, which older Safari doesn't apply to SVG text. -->
  <defs>
    <filter id="{uid}-gray">
      <feColorMatrix type="saturate" values="0" />
    </filter>
    <clipPath id="{uid}-swept"><path d={sweptPath} /></clipPath>
    <clipPath id="{uid}-unswept"><path d={unsweptPath} /></clipPath>
  </defs>
  <circle r={R} class="fill-slate-200 hc:fill-neutral-800" />
  {#each wedges as w (w.id)}
    {#if w.path}
      <path
        d={w.path}
        fill={w.color}
        class="stroke-white hc:stroke-black"
        stroke-width="1.5"
        stroke-linejoin="round"
      />
    {/if}
  {/each}
  {#snippet emoji(w: (typeof wedges)[number], gray: boolean)}
    <text
      x={w.emojiAt[0]}
      y={w.emojiAt[1]}
      text-anchor="middle"
      dominant-baseline="central"
      font-size={Math.min(22, 9 + w.size * 6)}
      filter={gray ? `url(#${uid}-gray)` : undefined}
      opacity={gray ? 0.5 : 1}>{w.emoji}</text
    >
  {/snippet}
  {#each wedges as w (w.id)}
    {#if w.emoji && w.size > 0.45}
      {#if sweptPath}
        <g clip-path="url(#{uid}-swept)">{@render emoji(w, true)}</g>
      {/if}
      {#if unsweptPath}
        <g clip-path="url(#{uid}-unswept)">{@render emoji(w, false)}</g>
      {/if}
    {/if}
  {/each}
  {#if usedAngle > 0 && usedAngle < TURN - 1e-6}
    <line
      x1="0"
      y1="0"
      x2={hand[0]}
      y2={hand[1]}
      class="stroke-slate-700 hc:stroke-hc-bright"
      stroke-width="2.5"
      stroke-linecap="round"
    />
  {/if}
  <circle r="5" class="fill-slate-700 hc:fill-hc-bright" />
</svg>
