// Chimes and end sounds, made in the browser with Web Audio (no sound files).
//
// Sounds are scheduled ahead on the audio clock rather than played from a timer:
// the audio clock runs on its own thread, so a chime lands on time even while the
// teacher is on another tab and Chrome is slowing that tab's timers down.
import type { ChimeId, EndSoundId } from "#lib/types.ts";

export const CHIMES: readonly { id: ChimeId; label: string }[] = [
  { id: "chime", label: "Chime" },
  { id: "bell", label: "Bell" },
  { id: "marimba", label: "Marimba" },
  { id: "none", label: "None" },
];

export const END_SOUNDS: readonly { id: EndSoundId; label: string }[] = [
  { id: "harp", label: "Harp" },
  { id: "gong", label: "Gong" },
  { id: "bells", label: "Bells" },
  { id: "none", label: "None" },
];

type SoundId = ChimeId | EndSoundId;

/** Notes scheduled to start later, so a new plan can call them off. */
const pending: { osc: OscillatorNode; at: number }[] = [];

/** One soft note with a quick attack and a long fade. */
function note(
  ctx: AudioContext,
  out: AudioNode,
  at: number,
  freq: number,
  seconds: number,
  volume: number,
  type: OscillatorType = "sine",
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(volume, at + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + seconds);
  osc.connect(gain).connect(out);
  osc.start(at);
  osc.stop(at + seconds + 0.05);
  if (at > ctx.currentTime + 0.1) pending.push({ osc, at });
}

/** Call off every note that hasn't started; one already ringing fades out as usual. */
function cancelPending(ctx: AudioContext) {
  for (const { osc, at } of pending.splice(0)) {
    if (at > ctx.currentTime) osc.stop();
  }
}

/** A struck bell: a few inharmonic partials that fade at different rates. */
function bell(
  ctx: AudioContext,
  out: AudioNode,
  at: number,
  freq: number,
  seconds: number,
  volume: number,
) {
  const partials: [number, number, number][] = [
    [1, 1, 1],
    [2, 0.5, 0.7],
    [2.76, 0.35, 0.5],
    [5.4, 0.15, 0.3],
  ];
  for (const [ratio, level, length] of partials) {
    note(ctx, out, at, freq * ratio, seconds * length, volume * level);
  }
}

function play(ctx: AudioContext, out: AudioNode, sound: SoundId, at: number) {
  switch (sound) {
    case "chime":
      note(ctx, out, at, 1318.5, 1.4, 0.22);
      note(ctx, out, at + 0.28, 987.8, 1.8, 0.22);
      break;
    case "bell":
      bell(ctx, out, at, 880, 2.6, 0.18);
      break;
    case "marimba":
      note(ctx, out, at, 523.3, 0.5, 0.35, "triangle");
      note(ctx, out, at + 0.16, 784, 0.7, 0.35, "triangle");
      break;
    case "harp":
      [523.3, 659.3, 784, 1046.5, 1318.5].forEach((freq, i) =>
        note(ctx, out, at + i * 0.13, freq, 2.2, 0.18, "triangle"),
      );
      break;
    case "gong":
      bell(ctx, out, at, 196, 5, 0.3);
      break;
    case "bells":
      [784, 659.3, 523.3].forEach((freq, i) =>
        bell(ctx, out, at + i * 0.55, freq, 2.4, 0.16),
      );
      break;
    case "none":
      break;
  }
}

export interface PlannedSound {
  /** Epoch milliseconds. */
  at: number;
  sound: SoundId;
}

class Sounds {
  /** True once the browser lets this page make sound (it needs a tap first). */
  ready = $state(false);

  #ctx: AudioContext | null = null;
  #plan: PlannedSound[] = [];

  /** Call from a tap or click: browsers only start audio after one. */
  unlock(): void {
    if (typeof AudioContext === "undefined") return;
    if (!this.#ctx) {
      this.#ctx = new AudioContext();
      this.#ctx.addEventListener("statechange", () => this.#update());
    }
    if (this.#ctx.state !== "running") void this.#ctx.resume().catch(() => {});
    this.#update();
  }

  /** Replace every scheduled sound with these. */
  plan(sounds: PlannedSound[]): void {
    this.#plan = sounds;
    this.#schedule();
  }

  /** Play a sound now, e.g. when a teacher picks it in settings. */
  preview(sound: SoundId): void {
    this.unlock();
    const ctx = this.#ctx;
    if (!ctx) return;
    play(ctx, ctx.destination, sound, ctx.currentTime + 0.05);
  }

  #update() {
    const wasReady = this.ready;
    this.ready = this.#ctx?.state === "running";
    // Sounds planned before audio was allowed are scheduled once it is.
    if (this.ready && !wasReady) this.#schedule();
  }

  #schedule() {
    const ctx = this.#ctx;
    if (!ctx || ctx.state !== "running") return;
    cancelPending(ctx);
    // Map wall-clock times onto the audio clock as of right now. Planning again
    // after a laptop sleeps fixes the mapping, since the audio clock stops meanwhile.
    const offset = ctx.currentTime - Date.now() / 1000;
    for (const { at, sound } of this.#plan) {
      const when = at / 1000 + offset;
      if (when > ctx.currentTime) play(ctx, ctx.destination, sound, when);
    }
  }
}

export const sounds = new Sounds();
