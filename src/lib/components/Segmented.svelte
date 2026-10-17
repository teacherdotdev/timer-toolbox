<!-- A row of pill-shaped choices, one selected (radio buttons underneath). -->
<script lang="ts" module>
  export interface Choice {
    label: string;
    checked: boolean;
    select: () => void;
  }
</script>

<script lang="ts">
  let {
    name,
    labelledby,
    choices,
  }: { name: string; labelledby: string; choices: Choice[] } = $props();
</script>

<div
  role="radiogroup"
  aria-labelledby={labelledby}
  class="inline-flex shrink-0 flex-wrap self-start rounded-3xl bg-slate-100 p-1 sm:self-auto"
>
  {#each choices as choice (choice.label)}
    <label
      class="relative inline-flex min-h-11 cursor-pointer items-center rounded-full px-4 font-semibold whitespace-nowrap has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-blue-700 {choice.checked
        ? 'bg-accent text-white shadow'
        : 'text-slate-700'}"
    >
      <input
        type="radio"
        {name}
        class="sr-only"
        checked={choice.checked}
        onchange={choice.select}
      />
      {choice.label}
    </label>
  {/each}
</div>
