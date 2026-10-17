<script lang="ts">
  import "./layout.css";
  import favicon from "#lib/assets/favicon.svg";
  import { seconds } from "#lib/clock.svelte.ts";
  import TimerEditor from "#lib/components/TimerEditor.svelte";
  import UndoToast from "#lib/components/UndoToast.svelte";
  import { editor } from "#lib/editor.svelte.ts";
  import { upcomingSounds } from "#lib/run.ts";
  import { sounds } from "#lib/sounds.svelte.ts";
  import { app } from "#lib/state.svelte.ts";
  import type { LayoutProps } from "./$types";

  let { children }: LayoutProps = $props();

  /** Bumped when the tab is shown again, to plan sounds and the wake lock afresh. */
  let shown = $state(0);

  const running = $derived(
    app.run.started &&
      app.run.since !== null &&
      app.run.timerId === app.currentId,
  );

  $effect(() => seconds.start());

  // Schedule every chime and end sound still to come, on any page of the app.
  $effect(() => {
    void shown;
    const timer = app.timer;
    sounds.plan(
      upcomingSounds(timer, app.run, Date.now()).map(({ at, kind }) => ({
        at,
        sound: kind === "end" ? timer.settings.endSound : timer.settings.chime,
      })),
    );
  });

  // Keep the screen from dimming while a timer runs. The browser lets go of the
  // lock whenever the tab is hidden, so it's asked for again when shown.
  $effect(() => {
    void shown;
    if (!running || !("wakeLock" in navigator)) return;
    let lock: WakeLockSentinel | null = null;
    let cancelled = false;
    navigator.wakeLock
      .request("screen")
      .then((sentinel) => {
        if (cancelled) void sentinel.release();
        else lock = sentinel;
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      void lock?.release();
    };
  });
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
</svelte:head>

<!-- Browsers only allow sound after a tap or key press, so any one turns it on. -->
<svelte:window
  onpointerdown={() => sounds.unlock()}
  onkeydown={() => sounds.unlock()}
/>
<svelte:document
  onvisibilitychange={() => {
    if (document.visibilityState === "visible") shown += 1;
  }}
/>

{@render children()}

{#if editor.editing}
  {@const editing = editor.editing}
  {#key editing.timerId}
    <TimerEditor
      timerId={editing.timerId}
      isNew={editing.isNew}
      onclose={() => editor.close()}
      oncancel={() => editor.cancel()}
    />
  {/key}
{/if}

<UndoToast />
