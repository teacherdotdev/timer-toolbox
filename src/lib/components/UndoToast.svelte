<!-- "Timer deleted · Undo", for a few seconds after a timer is deleted. Deleting
     asks no "are you sure?", since a browser dialog would freeze the page. -->
<script lang="ts">
  import { app } from "#lib/state.svelte.ts";
  import Icon from "./Icon.svelte";

  const SHOW_MS = 8000;

  $effect(() => {
    const removed = app.removed;
    if (!removed) return;
    const id = setTimeout(() => {
      if (app.removed === removed) app.removed = null;
    }, SHOW_MS);
    return () => clearTimeout(id);
  });
</script>

{#if app.removed}
  <div
    class="fixed inset-x-0 bottom-4 z-[60] flex justify-center px-4"
    role="status"
  >
    <div
      class="flex max-w-full items-center gap-3 rounded-full bg-slate-900 py-1.5 pr-1.5 pl-5 text-white shadow-xl"
    >
      <span class="truncate font-semibold">
        Deleted “{app.removed.timer.name || "Untitled timer"}”
      </span>
      <button
        type="button"
        class="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full bg-white px-4 font-semibold text-slate-900"
        onclick={() => app.undoRemove()}
      >
        <Icon name="undo" class="size-5" />
        Undo
      </button>
    </div>
  </div>
{/if}
