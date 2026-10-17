<!-- The saved-timer dropdown at the top left of the pie screen: pick a timer, edit
     or delete one, or make a new one. -->
<script lang="ts">
  import { formatTime } from "#lib/run.ts";
  import { app } from "#lib/state.svelte.ts";
  import type { Timer } from "#lib/types.ts";
  import Icon from "./Icon.svelte";

  let {
    onedit,
    onnew,
  }: {
    onedit: (id: string) => void;
    onnew: () => void;
  } = $props();

  let open = $state(false);
  let root: HTMLDivElement;
  let list = $state<HTMLUListElement>();

  function summary(timer: Timer): string {
    const minutes = timer.segments.reduce((sum, s) => sum + s.minutes, 0);
    const parts = timer.segments.length;
    return `${parts} part${parts === 1 ? "" : "s"} · ${formatTime(minutes * 60_000)}`;
  }

  /** The buttons that pick a timer, for moving between them with the arrow keys. */
  function options(): HTMLButtonElement[] {
    return Array.from(
      list?.querySelectorAll<HTMLButtonElement>("[data-option]") ?? [],
    );
  }

  async function toggle() {
    open = !open;
    if (!open) return;
    // Start on the open timer, so Enter keeps it and the arrows move from it.
    await Promise.resolve();
    options()
      .find((el) => el.dataset.option === app.currentId)
      ?.focus();
  }

  function close({ refocus = false } = {}) {
    open = false;
    if (refocus) root.querySelector<HTMLButtonElement>("button")?.focus();
  }

  function onlistkeydown(event: KeyboardEvent) {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    event.preventDefault();
    const all = options();
    const at = all.indexOf(document.activeElement as HTMLButtonElement);
    const by = event.key === "ArrowDown" ? 1 : -1;
    all[(at + by + all.length) % all.length]?.focus();
  }

  const rowButton =
    "inline-flex size-11 shrink-0 items-center justify-center rounded-full text-slate-500 hover:bg-white hover:text-slate-800 disabled:opacity-30 disabled:hover:bg-transparent";
</script>

<svelte:window
  onkeydown={(event) => {
    if (open && event.key === "Escape") close({ refocus: true });
  }}
  onpointerdown={(event) => {
    if (open && !root.contains(event.target as Node)) close();
  }}
/>

<div bind:this={root} class="relative min-w-0">
  <button
    type="button"
    class="inline-flex h-11 max-w-[55vw] min-w-0 items-center gap-2 rounded-full bg-white pr-3 pl-4 text-base font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 transition active:bg-slate-100 aria-expanded:bg-slate-100 hc:bg-neutral-800 hc:text-neutral-200 hc:ring-neutral-600"
    aria-haspopup="true"
    aria-expanded={open}
    aria-controls="timer-picker-panel"
    onclick={toggle}
  >
    <span class="sr-only">Timer:</span>
    <span class="truncate">{app.timer.name || "Untitled timer"}</span>
    <Icon
      name="down"
      class="size-5 shrink-0 text-slate-500 transition {open
        ? 'rotate-180'
        : ''}"
    />
  </button>

  {#if open}
    <div
      id="timer-picker-panel"
      class="absolute top-full left-0 z-30 mt-2 w-[min(24rem,calc(100vw-1.5rem))] rounded-2xl bg-white p-1.5 text-slate-800 shadow-xl ring-1 ring-slate-200"
    >
      <!-- The arrow keys only move focus between the buttons inside. -->
      <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
      <ul
        bind:this={list}
        class="flex max-h-[60vh] flex-col gap-0.5 overflow-y-auto"
        aria-label="Saved timers"
        onkeydown={onlistkeydown}
      >
        {#each app.timers as timer (timer.id)}
          {@const isCurrent = timer.id === app.currentId}
          {@const name = timer.name || "Untitled timer"}
          <li
            class="flex items-center gap-1 rounded-xl pr-1 {isCurrent
              ? 'bg-pink-50'
              : 'hover:bg-slate-50'}"
          >
            <button
              type="button"
              data-option={timer.id}
              class="flex min-h-12 min-w-0 flex-1 items-center gap-3 rounded-xl px-3 py-1.5 text-left"
              aria-current={isCurrent ? "true" : undefined}
              onclick={() => {
                app.select(timer.id);
                close({ refocus: true });
              }}
            >
              <span class="flex min-w-0 flex-1 flex-col">
                <span class="truncate font-semibold">{name}</span>
                <span class="truncate text-sm text-slate-500">
                  {summary(timer)}
                </span>
              </span>
              {#if isCurrent}
                <Icon name="check" class="size-5 shrink-0 text-accent" />
              {/if}
            </button>
            <button
              type="button"
              class={rowButton}
              aria-label="Edit {name}"
              title="Edit"
              onclick={() => {
                close();
                onedit(timer.id);
              }}
            >
              <Icon name="pencil" class="size-5" />
            </button>
            <button
              type="button"
              class={rowButton}
              aria-label="Delete {name}"
              title={app.timers.length <= 1
                ? "Your only timer can't be deleted"
                : "Delete"}
              disabled={app.timers.length <= 1}
              onclick={() => app.remove(timer.id)}
            >
              <Icon name="trash" class="size-5" />
            </button>
          </li>
        {/each}
      </ul>
      <div class="mt-1 border-t border-slate-100 pt-1">
        <button
          type="button"
          class="flex min-h-12 w-full items-center gap-3 rounded-xl px-3 font-semibold text-accent-dark hover:bg-pink-50"
          onclick={() => {
            close();
            onnew();
          }}
        >
          <Icon name="plus" class="size-5" />
          New timer
        </button>
      </div>
    </div>
  {/if}
</div>
