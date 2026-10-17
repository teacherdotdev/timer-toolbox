<script lang="ts">
  import { resolve } from "$app/paths";
  import { seconds } from "#lib/clock.svelte.ts";
  import Icon from "#lib/components/Icon.svelte";
  import Segmented, { type Choice } from "#lib/components/Segmented.svelte";
  import TimerBehaviour from "#lib/components/TimerBehaviour.svelte";
  import { editor } from "#lib/editor.svelte.ts";
  import { formatTime, view } from "#lib/run.ts";
  import { app } from "#lib/state.svelte.ts";
  import { tabTitle } from "#lib/tabTitle.ts";

  let backupMessage = $state("");

  function downloadBackup() {
    const blob = new Blob([JSON.stringify(app.backup(), null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `timer-toolbox-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function restoreBackup(file: File | undefined) {
    if (!file) return;
    try {
      const restored = app.restore(JSON.parse(await file.text()));
      backupMessage = restored
        ? `Restored ${app.timers.length} timer${app.timers.length === 1 ? "" : "s"}.`
        : "That file isn't a Timer Toolbox backup.";
    } catch {
      backupMessage = "That file couldn't be read.";
    }
  }

  const contrastChoices: Choice[] = $derived(
    [false, true].map((high) => ({
      label: high ? "High contrast" : "Standard",
      checked: app.settings.highContrast === high,
      select: () => app.updateSettings({ highContrast: high }),
    })),
  );

  const card =
    "divide-y divide-slate-100 rounded-2xl bg-white px-4 shadow-sm sm:px-5";
  const row =
    "flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6";
  const sectionTitle =
    "px-1 pb-2 text-sm font-bold tracking-wide text-slate-500 uppercase";
  const iconButton =
    "inline-flex size-11 shrink-0 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent";
  const pillButton =
    "min-h-11 shrink-0 rounded-full border-2 border-slate-300 px-4 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50";
</script>

<svelte:head>
  <title
    >{tabTitle(
      app.timer,
      view(app.timer, app.run, seconds.now),
      "Settings",
    )}</title
  >
</svelte:head>

<div class="min-h-screen-safe bg-board-bg">
  <header
    class="sticky top-0 z-10 border-b border-slate-200 bg-white text-slate-800"
  >
    <div class="mx-auto flex max-w-3xl items-center gap-2 px-2 py-2">
      <a
        href={resolve("/pie")}
        class="inline-flex min-h-11 items-center gap-1 rounded-full pr-4 pl-2 font-semibold text-slate-600 active:bg-slate-100"
      >
        <Icon name="back" class="size-6" />
        Back to timer
      </a>
      <h1 class="sr-only">Settings</h1>
    </div>
  </header>

  <main class="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-5">
    <section aria-labelledby="saved-title">
      <h2 id="saved-title" class={sectionTitle}>Saved timers</h2>
      <div class={card}>
        {#each app.timers as saved (saved.id)}
          {@const isCurrent = saved.id === app.currentId}
          {@const name = saved.name || "Untitled timer"}
          {@const minutes = saved.segments.reduce(
            (sum, s) => sum + s.minutes,
            0,
          )}
          <div class="flex flex-wrap items-center gap-2 py-3">
            <div class="min-w-0 flex-1 basis-48">
              <p class="truncate font-semibold">
                {name}
                {#if isCurrent}
                  <span
                    class="ml-1 rounded-full bg-pink-50 px-2 py-0.5 text-xs font-bold text-accent-dark uppercase"
                    >Open</span
                  >
                {/if}
              </p>
              <p class="truncate text-sm text-slate-600">
                {formatTime(minutes * 60_000)} ·
                {saved.segments
                  .map((s, i) =>
                    `${s.emoji} ${s.label || `Part ${i + 1}`}`.trim(),
                  )
                  .join(" · ")}
              </p>
            </div>
            <div class="flex items-center gap-1">
              {#if !isCurrent}
                <button
                  type="button"
                  class={pillButton}
                  onclick={() => app.select(saved.id)}
                >
                  Open
                </button>
              {/if}
              <button
                type="button"
                class={iconButton}
                aria-label="Edit {name}"
                title="Edit"
                onclick={() => editor.edit(saved.id)}
              >
                <Icon name="pencil" class="size-5" />
              </button>
              <button
                type="button"
                class={iconButton}
                aria-label="Duplicate {name}"
                title="Duplicate"
                onclick={() => app.duplicate(saved.id)}
              >
                <Icon name="copy" class="size-5" />
              </button>
              <button
                type="button"
                class={iconButton}
                aria-label="Delete {name}"
                title={app.timers.length <= 1
                  ? "Your only timer can't be deleted"
                  : "Delete"}
                disabled={app.timers.length <= 1}
                onclick={() => app.remove(saved.id)}
              >
                <Icon name="trash" class="size-5" />
              </button>
            </div>
          </div>
        {/each}
        <div class="py-3">
          <button
            type="button"
            class="inline-flex min-h-11 items-center gap-2 rounded-full bg-accent px-4 font-semibold text-white active:bg-accent-dark"
            onclick={() => editor.create()}
          >
            <Icon name="plus" class="size-5" />
            New timer
          </button>
        </div>
      </div>
    </section>

    <section aria-labelledby="defaults-title">
      <h2 id="defaults-title" class={sectionTitle}>New timer defaults</h2>
      <div class={card}>
        <TimerBehaviour
          prefix="defaults"
          rowClass={row}
          value={app.settings.defaults}
          onchange={(patch) => app.updateDefaults(patch)}
        />
      </div>
    </section>

    <section aria-labelledby="display-title">
      <h2 id="display-title" class={sectionTitle}>Display</h2>
      <div class={card}>
        <div class={row}>
          <div>
            <h3 id="colors-title" class="font-semibold">Colors</h3>
            <p class="text-sm text-slate-600">
              High contrast: bright yellow on black.
            </p>
          </div>
          <Segmented
            name="contrast"
            labelledby="colors-title"
            choices={contrastChoices}
          />
        </div>
      </div>
    </section>

    <section aria-labelledby="tips-title">
      <h2 id="tips-title" class={sectionTitle}>Tips</h2>
      <div class={card}>
        <p class="py-4 text-slate-700">
          <strong>On a Chromebook or in Chrome,</strong> pin this tab (right-click
          the tab, then Pin) so Chrome doesn't put it to sleep while you're in another
          tab.
        </p>
        <p class="py-4 text-slate-700">
          <strong>On an iPad,</strong> keep Timer Toolbox on screen. iPads don't let
          a website play sounds from the background or with the screen locked.
        </p>
      </div>
    </section>

    <section aria-labelledby="backup-title">
      <h2 id="backup-title" class={sectionTitle}>Backup</h2>
      <div class={card}>
        <div class={row}>
          <div>
            <h3 class="font-semibold">Move your timers</h3>
            <p class="text-sm text-slate-600">
              Timers are saved in this browser only. Download a backup to move
              them to another device.
            </p>
          </div>
          <div class="flex flex-wrap gap-2">
            <button type="button" class={pillButton} onclick={downloadBackup}>
              Download backup
            </button>
            <label class="{pillButton} inline-flex cursor-pointer items-center">
              Restore
              <input
                type="file"
                accept="application/json,.json"
                class="sr-only"
                onchange={(e) => {
                  void restoreBackup(e.currentTarget.files?.[0]);
                  e.currentTarget.value = "";
                }}
              />
            </label>
          </div>
        </div>
        {#if backupMessage}
          <p class="py-3 text-sm font-semibold text-slate-700" role="status">
            {backupMessage}
          </p>
        {/if}
      </div>
    </section>

    <footer
      class="flex flex-col items-center gap-3 px-1 pb-6 text-center text-sm text-slate-600"
    >
      <p
        class="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 font-semibold"
      >
        <a
          href="https://teacher.dev"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-2 hover:underline"
        >
          <img src="/teacher-dev-logo.svg" alt="" width="20" height="20" />
          Built by teacher.dev
        </a>
        <a href={resolve("/about")} class="hover:underline">About</a>
        <a href={resolve("/privacy")} class="hover:underline">Privacy</a>
      </p>
    </footer>
  </main>
</div>
