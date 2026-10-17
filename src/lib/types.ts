// Shared types and defaults. Words follow GLOSSARY.md: a Timer is made of Segments.

export type ColorId =
  "red" | "orange" | "yellow" | "green" | "teal" | "blue" | "purple" | "pink";

export type ChimeId = "chime" | "bell" | "marimba" | "none";
export type EndSoundId = "harp" | "gong" | "bells" | "none";

export interface Segment {
  id: string;
  label: string;
  /** One emoji shown beside the label, or "" for none. */
  emoji: string;
  /** Whole minutes, MIN_MINUTES to MAX_MINUTES. */
  minutes: number;
  color: ColorId;
}

/** How a timer behaves when a segment ends. Saved on each timer. */
export interface TimerSettings {
  /** "auto" starts the next segment by itself; "tap" waits for the teacher. */
  advance: "auto" | "tap";
  chime: ChimeId;
  endSound: EndSoundId;
  /** Keep counting up after the last segment reaches zero. */
  overtime: boolean;
}

export interface Timer {
  id: string;
  name: string;
  segments: Segment[];
  settings: TimerSettings;
}

export interface Settings {
  highContrast: boolean;
  /** What a new timer starts with. */
  defaults: TimerSettings;
}

/**
 * Where the running timer is, saved so a reload picks up where real time says it
 * should be. Everything shown is worked out from this and the clock (see run.ts).
 */
export interface Run {
  timerId: string;
  /** False until Start is pressed, and again after Restart. */
  started: boolean;
  /** The segment the time below is counted from. */
  index: number;
  /** Milliseconds already gone in segment `index`, up to `since`. */
  elapsed: number;
  /** When the clock last started running (epoch ms); null while paused. */
  since: number | null;
  /** Milliseconds added to each segment with "+1 min", by segment index. */
  extra: number[];
}

export const MIN_MINUTES = 1;
export const MAX_MINUTES = 120;
export const MAX_SEGMENTS = 8;
export const MAX_LABEL_LENGTH = 40;
export const MAX_NAME_LENGTH = 40;

export const DEFAULT_TIMER_SETTINGS: TimerSettings = {
  advance: "auto",
  chime: "chime",
  endSound: "harp",
  overtime: true,
};

export const DEFAULT_SETTINGS: Settings = {
  highContrast: false,
  defaults: DEFAULT_TIMER_SETTINGS,
};

export const STORAGE_KEYS = {
  timers: "timer-toolbox:timers",
  current: "timer-toolbox:current",
  settings: "timer-toolbox:settings",
  run: "timer-toolbox:run",
} as const;
