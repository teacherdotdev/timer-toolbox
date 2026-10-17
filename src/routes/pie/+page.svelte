<script lang="ts">
  import { resolve } from "$app/paths";
  import { Clock, seconds } from "#lib/clock.svelte.ts";
  import BrandMenu from "#lib/components/BrandMenu.svelte";
  import HelpButton from "#lib/components/HelpButton.svelte";
  import Icon from "#lib/components/Icon.svelte";
  import Pie from "#lib/components/Pie.svelte";
  import TimerPicker from "#lib/components/TimerPicker.svelte";
  import { editor } from "#lib/editor.svelte.ts";
  import { popout } from "#lib/popout.svelte.ts";
  import { formatOvertime, formatTime, view } from "#lib/run.ts";
  import { sounds } from "#lib/sounds.svelte.ts";
  import { app } from "#lib/state.svelte.ts";
  import { tabTitle } from "#lib/tabTitle.ts";

  /** How long the controls stay after the last mouse move or tap while running. */
  const CONTROLS_FADE_MS = 3000;

  const clock = new Clock();
  $effect(() => clock.start());

  let lastActivity = $state(Date.now());

  const timer = $derived(app.timer);
  const current = $derived(view(timer, app.run, clock.now));
  const segment = $derived(timer.segments[current.index]);
  const next = $derived(timer.segments[current.index + 1]);
  const labelOf = (index: number) =>
    timer.segments[index]?.label.trim() || `Part ${index + 1}`;

  const controlsHidden = $derived(
    current.status === "running" && clock.now - lastActivity > CONTROLS_FADE_MS,
  );
  const hasSound = $derived(
    timer.settings.chime !== "none" || timer.settings.endSound !== "none",
  );

  function primary() {
    if (current.status === "idle") app.start();
    else if (current.status === "running") app.pause();
    else if (current.status === "paused") app.resume();
    else if (current.status === "waiting") app.advance();
  }

  const nav =
    "inline-flex size-11 items-center justify-center rounded-full bg-white text-slate-600 shadow-sm ring-1 ring-slate-200 transition active:bg-slate-100 hc:bg-neutral-800 hc:text-neutral-200 hc:ring-neutral-600 hc:active:bg-neutral-700";
  const control =
    "inline-flex h-14 items-center justify-center gap-2 rounded-full bg-white px-5 text-lg font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 transition active:bg-slate-100 disabled:opacity-40 hc:bg-neutral-800 hc:text-neutral-200 hc:ring-neutral-600 hc:active:bg-neutral-700";
  const big =
    "inline-flex h-16 min-w-40 items-center justify-center gap-3 rounded-full bg-accent px-7 text-xl font-bold text-white shadow-md transition active:bg-accent-dark";
</script>

<svelte:head>
  <title>{tabTitle(timer, view(timer, app.run, seconds.now))}</title>
</svelte:head>

<svelte:window
  onpointermove={() => (lastActivity = Date.now())}
  onpointerdown={() => (lastActivity = Date.now())}
  onkeydown={(event) => {
    lastActivity = Date.now();
    const target = event.target as HTMLElement;
    if (
      event.key === " " &&
      !editor.editing &&
      !target.closest("button, select, input, a")
    ) {
      event.preventDefault();
      primary();
    }
  }}
/>

<main
  data-contrast={app.settings.highContrast ? "high" : undefined}
  class="flex h-screen-safe flex-col overflow-hidden bg-board-bg px-[max(clamp(0.5rem,2.5vmin,1.75rem),env(safe-area-inset-left))] pt-[max(clamp(0.25rem,1vmin,0.75rem),env(safe-area-inset-top))] pb-[max(clamp(0.5rem,2.5vmin,1.75rem),env(safe-area-inset-bottom))] text-slate-900 hc:bg-black hc:text-hc-bright {controlsHidden
    ? 'cursor-none'
    : ''}"
>
  <h1 class="sr-only">{timer.name}: pie timer</h1>

  <nav
    class="flex shrink-0 items-center gap-2 transition-opacity duration-500 {controlsHidden
      ? 'pointer-events-none opacity-0'
      : ''}"
    aria-label="Timer"
  >
    <BrandMenu />
    <TimerPicker
      onedit={(id) => editor.edit(id)}
      onnew={() => editor.create()}
    />
    <button
      type="button"
      class={nav}
      aria-label="Edit {timer.name || 'timer'}"
      title="Edit timer"
      onclick={() => editor.edit(timer.id)}
    >
      <Icon name="pencil" class="size-5" />
    </button>
    <div class="ml-auto flex items-center gap-2">
      {#if popout.supported}
        <button
          type="button"
          class={nav}
          aria-label={popout.open ? "Close pop-out" : "Pop out timer"}
          aria-pressed={popout.open}
          title="Pop out: keep the timer on top of other windows"
          onclick={() => popout.toggle()}
        >
          <Icon name="popout" class="size-6" />
        </button>
      {/if}
      <a href={resolve("/settings")} class={nav} aria-label="Settings">
        <Icon name="gear" class="size-6" />
      </a>
    </div>
  </nav>

  <div
    class="flex min-h-0 flex-1 flex-col items-center justify-center gap-[clamp(0.75rem,3vmin,3rem)] landscape:flex-row"
  >
    <Pie
      class="aspect-square max-h-full w-[min(88vw,52vh)] shrink landscape:w-[min(50vw,72vh)]"
      segments={timer.segments}
      lengths={current.lengths}
      used={current.used}
      total={current.total}
    />

    <section
      class="flex max-w-full min-w-0 flex-col items-center gap-1 text-center landscape:max-w-[42vw] landscape:items-start landscape:text-left"
      aria-live="polite"
      aria-atomic="true"
    >
      {#if current.status === "ended"}
        <p
          class="text-[clamp(2rem,8vmin,5.5rem)] leading-tight font-bold break-words"
        >
          Time's up!
        </p>
        {#if timer.settings.overtime}
          <p
            class="text-[clamp(2.5rem,11vmin,8rem)] leading-none font-bold text-slate-500 tabular-nums hc:text-neutral-300"
            aria-label="{formatOvertime(current.overtime)} over"
          >
            +{formatOvertime(current.overtime)}
          </p>
        {/if}
      {:else}
        <p
          class="max-w-full text-[clamp(2rem,8vmin,5.5rem)] leading-tight font-bold break-words"
        >
          {#if segment.emoji}<span aria-hidden="true" class="mr-[0.3em]"
              >{segment.emoji}</span
            >
          {/if}{labelOf(current.index)}
        </p>
        <p
          class="text-[clamp(3rem,13vmin,9rem)] leading-none font-bold tabular-nums"
          aria-label="{formatTime(current.segmentLeft)} left"
        >
          {formatTime(current.segmentLeft)}
        </p>
        {#if next}
          <p
            class="mt-2 text-[clamp(1rem,3vmin,1.75rem)] font-semibold text-slate-600 hc:text-neutral-300"
          >
            Next: {#if next.emoji}<span aria-hidden="true" class="mr-[0.3em]"
                >{next.emoji}</span
              >
            {/if}{labelOf(current.index + 1)} · {formatTime(
              current.lengths[current.index + 1],
            )}
          </p>
        {/if}
        <p
          class="text-[clamp(0.9rem,2.5vmin,1.4rem)] text-slate-500 hc:text-neutral-400"
        >
          {formatTime(current.totalLeft)} left of {formatTime(current.total)}
        </p>
      {/if}
    </section>
  </div>

  <!-- Help at the bottom left, the controls centred; the empty column on the
       right keeps them centred on the screen. -->
  <div
    class="grid shrink-0 grid-cols-[2.75rem_1fr_2.75rem] items-end gap-2 pt-2 transition-opacity duration-500 {controlsHidden
      ? 'pointer-events-none opacity-0'
      : ''}"
  >
    <HelpButton />
    <div class="flex flex-wrap items-center justify-center gap-3">
      {#if current.status !== "idle"}
        <button type="button" class={control} onclick={() => app.restart()}>
          <Icon name="restart" class="size-5" />
          Restart
        </button>
      {/if}

      {#if current.status === "idle"}
        <button type="button" class={big} onclick={primary}>
          <Icon name="play" class="size-6" />
          Start
        </button>
      {:else if current.status === "running"}
        <button type="button" class={big} onclick={primary}>
          <Icon name="pause" class="size-6" />
          Pause
        </button>
      {:else if current.status === "paused"}
        <button type="button" class={big} onclick={primary}>
          <Icon name="play" class="size-6" />
          Resume
        </button>
      {:else if current.status === "waiting" && next}
        <button type="button" class={big} onclick={primary}>
          <Icon name="play" class="size-6" />
          Start
          {#if next.emoji}<span aria-hidden="true">{next.emoji}</span>{/if}
          {labelOf(current.index + 1)}
        </button>
      {/if}

      {#if current.status === "running" || current.status === "paused"}
        <button type="button" class={control} onclick={() => app.advance()}>
          <Icon name="skip" class="size-5" />
          {next ? "Skip" : "Finish"}
        </button>
      {/if}
      {#if current.status !== "idle"}
        <button type="button" class={control} onclick={() => app.addMinute()}>
          +1 min
        </button>
      {/if}
    </div>
    <span aria-hidden="true"></span>
  </div>
</main>

{#if current.status === "running" && hasSound && !sounds.ready}
  <div
    class="fixed inset-x-0 bottom-24 z-40 flex justify-center px-4"
    role="status"
  >
    <button
      type="button"
      class="inline-flex min-h-11 items-center gap-2 rounded-full bg-slate-900 px-5 font-semibold text-white shadow-xl"
      onclick={() => sounds.unlock()}
    >
      <Icon name="sound" class="size-5" />
      Tap to turn sounds back on
    </button>
  </div>
{/if}
