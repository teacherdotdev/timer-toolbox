// App state: the saved timers, the settings and the running timer, all kept in this
// browser's localStorage. There are no accounts and nothing is uploaded.
import { COLORS, isColor, nextColor } from "#lib/colors.ts";
import * as runs from "#lib/run.ts";
import {
  DEFAULT_SETTINGS,
  DEFAULT_TIMER_SETTINGS,
  MAX_LABEL_LENGTH,
  MAX_MINUTES,
  MAX_NAME_LENGTH,
  MAX_SEGMENTS,
  MIN_MINUTES,
  STORAGE_KEYS,
  type ChimeId,
  type EndSoundId,
  type Run,
  type Segment,
  type Settings,
  type Timer,
  type TimerSettings,
} from "#lib/types.ts";

const CHIME_IDS: ChimeId[] = ["chime", "bell", "marimba", "none"];
const END_SOUND_IDS: EndSoundId[] = ["harp", "gong", "bells", "none"];

export function newId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

/** The first visit's timer: a special-ed pull-out group of about half an hour. */
function exampleTimer(settings: TimerSettings): Timer {
  const parts: [string, string, number, Segment["color"]][] = [
    ["👋", "Warm-up", 5, "yellow"],
    ["📖", "Read", 15, "blue"],
    ["✏️", "Practice", 7, "green"],
    ["🧹", "Clean up", 3, "orange"],
  ];
  return {
    id: newId(),
    name: "Small group",
    segments: parts.map(([emoji, label, minutes, color]) => ({
      id: newId(),
      emoji,
      label,
      minutes,
      color,
    })),
    settings: { ...settings },
  };
}

// ---------------------------------------------------------------------------
// Checking what comes back from storage or a backup file: anything missing or
// malformed is replaced with a default, so a bad value never breaks the page.

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function text(value: unknown, max: number, fallback = ""): string {
  return typeof value === "string" ? value.slice(0, max) : fallback;
}

export function clampMinutes(value: number): number {
  if (!Number.isFinite(value)) return MIN_MINUTES;
  return Math.min(MAX_MINUTES, Math.max(MIN_MINUTES, Math.round(value)));
}

/** Keep only the first emoji (one grapheme) of what was typed. */
export function firstEmoji(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    const segmenter = new Intl.Segmenter(undefined, {
      granularity: "grapheme",
    });
    for (const { segment } of segmenter.segment(trimmed)) return segment;
  }
  return Array.from(trimmed).slice(0, 2).join("");
}

export function toTimerSettings(value: unknown): TimerSettings {
  const v = isRecord(value) ? value : {};
  const d = DEFAULT_TIMER_SETTINGS;
  return {
    advance:
      v.advance === "tap" ? "tap" : v.advance === "auto" ? "auto" : d.advance,
    chime: CHIME_IDS.includes(v.chime as ChimeId)
      ? (v.chime as ChimeId)
      : d.chime,
    endSound: END_SOUND_IDS.includes(v.endSound as EndSoundId)
      ? (v.endSound as EndSoundId)
      : d.endSound,
    overtime: typeof v.overtime === "boolean" ? v.overtime : d.overtime,
  };
}

function toSegment(value: unknown, index: number): Segment {
  const v = isRecord(value) ? value : {};
  return {
    id: text(v.id, 40) || newId(),
    label: text(v.label, MAX_LABEL_LENGTH),
    emoji: firstEmoji(text(v.emoji, 16)),
    minutes: clampMinutes(typeof v.minutes === "number" ? v.minutes : 5),
    color: isColor(v.color) ? v.color : COLORS[index % COLORS.length].id,
  };
}

export function toTimer(value: unknown): Timer | null {
  if (!isRecord(value) || !Array.isArray(value.segments)) return null;
  const segments = value.segments.slice(0, MAX_SEGMENTS).map(toSegment);
  if (segments.length === 0) return null;
  return {
    id: text(value.id, 40) || newId(),
    name: text(value.name, MAX_NAME_LENGTH, "Timer"),
    segments,
    settings: toTimerSettings(value.settings),
  };
}

export function toTimers(value: unknown): Timer[] {
  if (!Array.isArray(value)) return [];
  const timers = value.map(toTimer).filter((t): t is Timer => t !== null);
  // Ids must be unique for the timer list; a duplicate gets a new one.
  return timers.map((timer, i) =>
    timers.slice(0, i).some((t) => t.id === timer.id)
      ? { ...timer, id: newId() }
      : timer,
  );
}

export function toSettings(value: unknown): Settings {
  const v = isRecord(value) ? value : {};
  return {
    highContrast:
      typeof v.highContrast === "boolean"
        ? v.highContrast
        : DEFAULT_SETTINGS.highContrast,
    defaults: toTimerSettings(v.defaults),
  };
}

function toRun(value: unknown): Run | null {
  if (!isRecord(value) || typeof value.timerId !== "string") return null;
  const number = (n: unknown) =>
    typeof n === "number" && Number.isFinite(n) && n >= 0 ? n : 0;
  return {
    timerId: value.timerId,
    started: value.started === true,
    index: Math.floor(number(value.index)),
    elapsed: number(value.elapsed),
    since:
      typeof value.since === "number" && Number.isFinite(value.since)
        ? value.since
        : null,
    extra: Array.isArray(value.extra) ? value.extra.map(number) : [],
  };
}

// ---------------------------------------------------------------------------
// localStorage helpers (storage can throw in private mode / when full / when
// blocked, and its contents can be corrupt).

function load<T>(key: string, parse: (value: unknown) => T): T {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(key);
  } catch {
    // Storage unavailable: fall through to defaults.
  }
  if (raw === null) return parse(undefined);
  try {
    return parse(JSON.parse(raw));
  } catch {
    return parse(undefined);
  }
}

function save(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or unavailable: the app keeps working for this session.
  }
}

// ---------------------------------------------------------------------------

/** What a backup file holds. */
export interface Backup {
  app: "timer-toolbox";
  version: 1;
  timers: Timer[];
  settings: Settings;
}

class AppState {
  settings = $state<Settings>(load(STORAGE_KEYS.settings, toSettings));
  timers = $state<Timer[]>([]);
  currentId = $state("");
  run = $state<Run>(runs.idleRun(""));

  constructor() {
    let timers = load(STORAGE_KEYS.timers, toTimers);
    if (timers.length === 0) timers = [exampleTimer(this.settings.defaults)];
    this.timers = timers;
    const saved = load(STORAGE_KEYS.current, (v) =>
      typeof v === "string" ? v : "",
    );
    this.currentId = timers.some((t) => t.id === saved) ? saved : timers[0].id;
    const run = load(STORAGE_KEYS.run, toRun);
    this.run =
      run && run.timerId === this.currentId
        ? run
        : runs.idleRun(this.currentId);
  }

  get timer(): Timer {
    return (
      this.timers.find((timer) => timer.id === this.currentId) ?? this.timers[0]
    );
  }

  // --- the running timer ---------------------------------------------------

  #setRun(run: Run) {
    this.run = run;
    save(STORAGE_KEYS.run, $state.snapshot(this.run));
  }

  start(): void {
    this.#setRun(runs.start(this.timer, Date.now()));
  }

  pause(): void {
    this.#setRun(runs.pause(this.timer, this.run, Date.now()));
  }

  resume(): void {
    this.#setRun(runs.resume(this.run, Date.now()));
  }

  advance(): void {
    this.#setRun(runs.advance(this.timer, this.run, Date.now()));
  }

  addMinute(): void {
    this.#setRun(runs.addMinute(this.timer, this.run, Date.now()));
  }

  restart(): void {
    this.#setRun(runs.idleRun(this.currentId));
  }

  // --- saved timers ----------------------------------------------------------

  #saveTimers() {
    save(STORAGE_KEYS.timers, $state.snapshot(this.timers));
  }

  select(id: string): void {
    if (id === this.currentId || !this.timers.some((t) => t.id === id)) return;
    this.currentId = id;
    save(STORAGE_KEYS.current, id);
    this.#setRun(runs.idleRun(id));
  }

  /** Make a new, one-segment timer with the default settings and open it. */
  addTimer(): string {
    const timer: Timer = {
      id: newId(),
      name: `Timer ${this.timers.length + 1}`,
      segments: [
        { id: newId(), emoji: "", label: "", minutes: 5, color: nextColor([]) },
      ],
      settings: { ...this.settings.defaults },
    };
    this.timers = [...this.timers, timer];
    this.#saveTimers();
    this.select(timer.id);
    return timer.id;
  }

  duplicate(id: string): void {
    const source = this.timers.find((t) => t.id === id);
    if (!source) return;
    const copy: Timer = {
      ...$state.snapshot(source),
      id: newId(),
      name: `${source.name} copy`.slice(0, MAX_NAME_LENGTH),
    };
    copy.segments = copy.segments.map((segment) => ({
      ...segment,
      id: newId(),
    }));
    const at = this.timers.findIndex((t) => t.id === id) + 1;
    this.timers = [...this.timers.slice(0, at), copy, ...this.timers.slice(at)];
    this.#saveTimers();
  }

  /** The timer deleted last, offered back for a few seconds. */
  removed = $state<{ timer: Timer; index: number; wasOpen: boolean } | null>(
    null,
  );

  /** Delete a timer. The last one left can't be deleted. */
  remove(id: string, { undoable = true } = {}): void {
    if (this.timers.length <= 1) return;
    const index = this.timers.findIndex((t) => t.id === id);
    if (index < 0) return;
    const wasOpen = id === this.currentId;
    this.removed = undoable
      ? { timer: $state.snapshot(this.timers[index]), index, wasOpen }
      : null;
    this.timers = this.timers.filter((t) => t.id !== id);
    this.#saveTimers();
    if (wasOpen) this.select(this.timers[Math.max(0, index - 1)].id);
  }

  undoRemove(): void {
    const removed = this.removed;
    if (!removed) return;
    this.removed = null;
    const timers = [...this.timers];
    timers.splice(Math.min(removed.index, timers.length), 0, removed.timer);
    this.timers = timers;
    this.#saveTimers();
    if (removed.wasOpen) this.select(removed.timer.id);
  }

  // --- editing a timer --------------------------------------------------------

  /**
   * Replace a timer. Changing its segments resets it if it's the running one.
   * Returns true when that happened.
   */
  #edit(
    id: string,
    change: (timer: Timer) => Timer,
    segmentsChanged: boolean,
  ): boolean {
    this.timers = this.timers.map((timer) =>
      timer.id === id ? change($state.snapshot(timer)) : timer,
    );
    this.#saveTimers();
    if (segmentsChanged && this.run.started && this.run.timerId === id) {
      this.#setRun(runs.idleRun(id));
      return true;
    }
    return false;
  }

  #segments(id: string): Segment[] {
    return this.timers.find((t) => t.id === id)?.segments ?? [];
  }

  rename(id: string, name: string): void {
    this.#edit(
      id,
      (t) => ({ ...t, name: name.slice(0, MAX_NAME_LENGTH) }),
      false,
    );
  }

  updateSegment(
    id: string,
    index: number,
    patch: Partial<Omit<Segment, "id">>,
  ): boolean {
    // A label, emoji or color doesn't change any time, so it leaves a running timer alone.
    const changesTime = "minutes" in patch;
    return this.#edit(
      id,
      (t) => {
        const segments = [...t.segments];
        const next = { ...segments[index], ...patch };
        next.label = next.label.slice(0, MAX_LABEL_LENGTH);
        next.minutes = clampMinutes(next.minutes);
        segments[index] = next;
        return { ...t, segments };
      },
      changesTime,
    );
  }

  addSegment(id: string): boolean {
    if (this.#segments(id).length >= MAX_SEGMENTS) return false;
    return this.#edit(
      id,
      (t) => {
        const segment: Segment = {
          id: newId(),
          emoji: "",
          label: "",
          minutes: 5,
          color: nextColor(t.segments.map((s) => s.color)),
        };
        return { ...t, segments: [...t.segments, segment] };
      },
      true,
    );
  }

  removeSegment(id: string, index: number): boolean {
    if (this.#segments(id).length <= 1) return false;
    return this.#edit(
      id,
      (t) => ({ ...t, segments: t.segments.filter((_, i) => i !== index) }),
      true,
    );
  }

  moveSegment(id: string, index: number, by: -1 | 1): boolean {
    const to = index + by;
    if (to < 0 || to >= this.#segments(id).length) return false;
    return this.#edit(
      id,
      (t) => {
        const segments = [...t.segments];
        [segments[index], segments[to]] = [segments[to], segments[index]];
        return { ...t, segments };
      },
      true,
    );
  }

  updateTimerSettings(id: string, patch: Partial<TimerSettings>): void {
    // Re-anchor first: switching how it advances must not jump back in time.
    if (this.run.timerId === id && this.run.since !== null) {
      const timer = this.timers.find((t) => t.id === id)!;
      this.#setRun(
        runs.resume(runs.pause(timer, this.run, Date.now()), Date.now()),
      );
    }
    this.#edit(
      id,
      (t) => ({ ...t, settings: toTimerSettings({ ...t.settings, ...patch }) }),
      false,
    );
  }

  // --- app settings -----------------------------------------------------------

  updateSettings(patch: Partial<Settings>): void {
    this.settings = toSettings({ ...$state.snapshot(this.settings), ...patch });
    save(STORAGE_KEYS.settings, $state.snapshot(this.settings));
  }

  updateDefaults(patch: Partial<TimerSettings>): void {
    this.updateSettings({
      defaults: { ...$state.snapshot(this.settings.defaults), ...patch },
    });
  }

  // --- backup ---------------------------------------------------------------

  backup(): Backup {
    return {
      app: "timer-toolbox",
      version: 1,
      timers: $state.snapshot(this.timers),
      settings: $state.snapshot(this.settings),
    };
  }

  /** Replace everything with a backup's contents. False if it isn't one. */
  restore(value: unknown): boolean {
    if (!isRecord(value) || value.app !== "timer-toolbox") return false;
    const timers = toTimers(value.timers);
    if (timers.length === 0) return false;
    this.timers = timers;
    this.#saveTimers();
    this.updateSettings(toSettings(value.settings));
    this.currentId = "";
    this.select(timers[0].id);
    return true;
  }
}

export const app = new AppState();
