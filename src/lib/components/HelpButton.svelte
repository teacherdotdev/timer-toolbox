<!-- The "?" at the bottom left: a way to reach us from every page. -->
<script lang="ts">
  import Icon from "./Icon.svelte";
  import Modal from "./Modal.svelte";

  let { class: className = "" }: { class?: string } = $props();

  let open = $state(false);
</script>

<button
  type="button"
  class="inline-flex size-11 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm ring-1 ring-slate-200 transition hover:text-accent-dark active:bg-slate-100 hc:bg-neutral-800 hc:text-neutral-200 hc:ring-neutral-600 {className}"
  aria-label="Help"
  aria-haspopup="dialog"
  onclick={() => (open = true)}
>
  <Icon name="help" class="size-6" />
</button>

{#if open}
  <Modal
    title="Need a hand?"
    closeLabel="Close help"
    size="small"
    onclose={() => (open = false)}
  >
    <p class="px-5 py-5 leading-relaxed text-slate-700">
      If you’re running into trouble or have suggestions, email us at
      <a
        class="font-semibold text-accent-dark underline underline-offset-2"
        href="mailto:support@teacher.dev?subject=Timer%20Toolbox"
        >support@teacher.dev</a
      >.
    </p>
  </Modal>
{/if}
