<!-- The four settings for what a timer does when a segment ends. Used for one
     timer in the editor, and for new-timer defaults in settings. -->
<script lang="ts">
  import { CHIMES, END_SOUNDS, sounds } from "#lib/sounds.svelte.ts";
  import type { TimerSettings } from "#lib/types.ts";
  import Segmented, { type Choice } from "./Segmented.svelte";

  let {
    prefix,
    value,
    onchange,
    rowClass,
  }: {
    /** Keeps ids unique when two of these are on one page. */
    prefix: string;
    value: TimerSettings;
    onchange: (patch: Partial<TimerSettings>) => void;
    rowClass: string;
  } = $props();

  const advance: Choice[] = $derived([
    {
      label: "Automatically",
      checked: value.advance === "auto",
      select: () => onchange({ advance: "auto" }),
    },
    {
      label: "When I tap",
      checked: value.advance === "tap",
      select: () => onchange({ advance: "tap" }),
    },
  ]);

  // Picking a sound plays it, so teachers hear what they chose.
  const chime: Choice[] = $derived(
    CHIMES.map((sound) => ({
      label: sound.label,
      checked: value.chime === sound.id,
      select: () => {
        onchange({ chime: sound.id });
        sounds.preview(sound.id);
      },
    })),
  );

  const endSound: Choice[] = $derived(
    END_SOUNDS.map((sound) => ({
      label: sound.label,
      checked: value.endSound === sound.id,
      select: () => {
        onchange({ endSound: sound.id });
        sounds.preview(sound.id);
      },
    })),
  );

  const overtime: Choice[] = $derived([
    {
      label: "Count up",
      checked: value.overtime,
      select: () => onchange({ overtime: true }),
    },
    {
      label: "Stop at zero",
      checked: !value.overtime,
      select: () => onchange({ overtime: false }),
    },
  ]);
</script>

<div class={rowClass}>
  <div>
    <h3 id="{prefix}-advance" class="font-semibold">Next segment starts</h3>
    <p class="text-sm text-slate-600">
      Or the timer waits at zero until you tap to start the next one.
    </p>
  </div>
  <Segmented
    name="{prefix}-advance"
    labelledby="{prefix}-advance"
    choices={advance}
  />
</div>
<div class={rowClass}>
  <div>
    <h3 id="{prefix}-chime" class="font-semibold">Chime</h3>
    <p class="text-sm text-slate-600">Plays when a segment ends.</p>
  </div>
  <Segmented
    name="{prefix}-chime"
    labelledby="{prefix}-chime"
    choices={chime}
  />
</div>
<div class={rowClass}>
  <div>
    <h3 id="{prefix}-end" class="font-semibold">End sound</h3>
    <p class="text-sm text-slate-600">Plays when the last segment ends.</p>
  </div>
  <Segmented name="{prefix}-end" labelledby="{prefix}-end" choices={endSound} />
</div>
<div class={rowClass}>
  <div>
    <h3 id="{prefix}-overtime" class="font-semibold">After zero</h3>
    <p class="text-sm text-slate-600">
      Count up shows how far over the time has gone.
    </p>
  </div>
  <Segmented
    name="{prefix}-overtime"
    labelledby="{prefix}-overtime"
    choices={overtime}
  />
</div>
