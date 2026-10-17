<!-- What the pop-out window shows: the pie, the current segment, its time left and
     one pause button. It ticks on the pop-out window's own frames, which keep
     coming while the main tab is hidden. -->
<script lang="ts">
  import { Clock } from "#lib/clock.svelte.ts";
  import { formatOvertime, formatTime, view } from "#lib/run.ts";
  import { sounds } from "#lib/sounds.svelte.ts";
  import { app } from "#lib/state.svelte.ts";
  import Icon from "./Icon.svelte";
  import Pie from "./Pie.svelte";

  let { win }: { win: Window } = $props();

  const clock = new Clock();
  $effect(() => clock.start(win));

  const timer = $derived(app.timer);
  const current = $derived(view(timer, app.run, clock.now));
  const segment = $derived(timer.segments[current.index]);
  const label = $derived(segment.label.trim() || `Part ${current.index + 1}`);
</script>

<div
  data-contrast={app.settings.highContrast ? "high" : undefined}
  class="flex h-screen-safe flex-col items-center justify-center gap-2 bg-board-bg p-3 font-board text-slate-900 hc:bg-black hc:text-hc-bright"
>
  <Pie
    class="min-h-0 w-full flex-1"
    segments={timer.segments}
    lengths={current.lengths}
    used={current.used}
    total={current.total}
  />
  <p class="max-w-full truncate text-center text-[9vw] leading-tight font-bold">
    {#if current.status === "ended"}
      Time's up
    {:else}
      {#if segment.emoji}<span aria-hidden="true" class="mr-[0.3em]"
          >{segment.emoji}</span
        >{/if}{label}
    {/if}
  </p>
  <div class="flex items-center gap-3">
    <p class="text-[11vw] leading-none font-bold tabular-nums">
      {#if current.status === "ended" && timer.settings.overtime}
        +{formatOvertime(current.overtime)}
      {:else}
        {formatTime(current.segmentLeft)}
      {/if}
    </p>
    {#if current.status === "running"}
      <button
        type="button"
        class="inline-flex size-11 items-center justify-center rounded-full bg-white text-slate-700 shadow-sm ring-1 ring-slate-200 hc:bg-neutral-800 hc:text-neutral-200 hc:ring-neutral-600"
        aria-label="Pause"
        onclick={() => app.pause()}
      >
        <Icon name="pause" class="size-5" />
      </button>
    {:else if current.status !== "ended"}
      <!-- Start, resume, or start the next segment of a timer waiting for a tap. -->
      <button
        type="button"
        class="inline-flex size-11 items-center justify-center rounded-full bg-accent text-white shadow-sm"
        aria-label={current.status === "idle"
          ? "Start"
          : current.status === "waiting"
            ? "Start next segment"
            : "Resume"}
        onclick={() => {
          sounds.unlock();
          if (current.status === "idle") app.start();
          else if (current.status === "waiting") app.advance();
          else app.resume();
        }}
      >
        <Icon name="play" class="size-5" />
      </button>
    {/if}
  </div>
</div>
