// The running timer, worked out from a saved Run and the clock. Nothing here counts
// ticks: every view is computed from timestamps, so a hidden tab, a slow timer or a
// reload never makes the time wrong.
import type { Run, Timer } from "#lib/types.ts";

export type RunStatus =
  /** Not started yet. */
  | "idle"
  | "running"
  | "paused"
  /** A segment reached zero and the timer waits for the teacher to advance. */
  | "waiting"
  /** The last segment reached zero. */
  | "ended";

export interface RunView {
  status: RunStatus;
  /** The segment the class is in (the last one once ended). */
  index: number;
  /** Milliseconds left in that segment. */
  segmentLeft: number;
  /** Milliseconds left in the whole timer. */
  totalLeft: number;
  /** Milliseconds in the whole timer, including any "+1 min". */
  total: number;
  /** Milliseconds of the whole timer used up, for drawing the pie. */
  used: number;
  /** Time since the last segment reached zero, while ended. */
  overtime: number;
  /** Length of each segment in milliseconds, including any "+1 min". */
  lengths: number[];
}

export function idleRun(timerId: string): Run {
  return {
    timerId,
    started: false,
    index: 0,
    elapsed: 0,
    since: null,
    extra: [],
  };
}

export function segmentLengths(timer: Timer, run: Run): number[] {
  return timer.segments.map(
    (segment, i) => segment.minutes * 60_000 + (run.extra[i] ?? 0),
  );
}

export function view(timer: Timer, run: Run, now: number): RunView {
  const lengths = segmentLengths(timer, run);
  const total = lengths.reduce((sum, length) => sum + length, 0);
  const last = lengths.length - 1;
  const usedBefore = (i: number) =>
    lengths.slice(0, i).reduce((sum, length) => sum + length, 0);

  if (!run.started || run.timerId !== timer.id) {
    return {
      status: "idle",
      index: 0,
      segmentLeft: lengths[0] ?? 0,
      totalLeft: total,
      total,
      used: 0,
      overtime: 0,
      lengths,
    };
  }

  const running = run.since !== null;
  let index = Math.min(run.index, last);
  let time = run.elapsed + (running ? Math.max(0, now - run.since!) : 0);

  // An automatic timer moves through as many segments as the time covers.
  while (
    time >= lengths[index] &&
    index < last &&
    timer.settings.advance === "auto"
  ) {
    time -= lengths[index];
    index += 1;
  }

  const inSegment = Math.min(time, lengths[index]);
  const used = usedBefore(index) + inSegment;
  const reachedZero = time >= lengths[index];
  let status: RunStatus = running ? "running" : "paused";
  if (reachedZero) status = index < last ? "waiting" : "ended";

  return {
    status,
    index,
    segmentLeft: lengths[index] - inSegment,
    totalLeft: total - used,
    total,
    used,
    overtime: status === "ended" ? time - lengths[index] : 0,
    lengths,
  };
}

/** The run re-anchored at `now`, so a change made now starts from where it is. */
function settle(timer: Timer, run: Run, now: number): Run {
  const current = view(timer, run, now);
  return {
    ...run,
    index: current.index,
    // Overtime is kept, so pausing or changing a setting after zero doesn't reset it.
    elapsed:
      current.lengths[current.index] - current.segmentLeft + current.overtime,
    since: run.since === null ? null : now,
  };
}

export function start(timer: Timer, now: number): Run {
  return { ...idleRun(timer.id), started: true, since: now };
}

export function pause(timer: Timer, run: Run, now: number): Run {
  return { ...settle(timer, run, now), since: null };
}

export function resume(run: Run, now: number): Run {
  return run.since === null ? { ...run, since: now } : run;
}

/** Move on to the next segment now, or end the timer from the last one. */
export function advance(timer: Timer, run: Run, now: number): Run {
  const settled = settle(timer, run, now);
  const last = timer.segments.length - 1;
  if (settled.index >= last) {
    return { ...settled, elapsed: segmentLengths(timer, settled)[last] };
  }
  return { ...settled, index: settled.index + 1, elapsed: 0 };
}

/** Add a minute to the current segment. After zero, it gives that minute back. */
export function addMinute(timer: Timer, run: Run, now: number): Run {
  const settled = settle(timer, run, now);
  const i = settled.index;
  const extra = timer.segments.map((_, j) => settled.extra[j] ?? 0);
  extra[i] += 60_000;
  // Past zero the segment comes back with one minute left, not "still over".
  const length = segmentLengths(timer, settled)[i];
  return { ...settled, elapsed: Math.min(settled.elapsed, length), extra };
}

/** Sounds still to come while the timer runs, each at an epoch time. */
export interface ScheduledSound {
  at: number;
  kind: "chime" | "end";
}

export function upcomingSounds(
  timer: Timer,
  run: Run,
  now: number,
): ScheduledSound[] {
  const current = view(timer, run, now);
  if (current.status !== "running") return [];
  const last = current.lengths.length - 1;
  const sounds: ScheduledSound[] = [];
  let at = now + current.segmentLeft;
  for (let i = current.index; i <= last; i += 1) {
    if (i > current.index) at += current.lengths[i];
    sounds.push({ at, kind: i === last ? "end" : "chime" });
    // A timer that waits for a tap schedules nothing past the next zero.
    if (timer.settings.advance === "tap") break;
  }
  return sounds;
}

/** "4:05", or "1:02:05" from an hour up. Rounds up, so it reads 0:00 only at zero. */
export function formatTime(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const ss = String(seconds).padStart(2, "0");
  if (hours > 0) return `${hours}:${String(minutes).padStart(2, "0")}:${ss}`;
  return `${minutes}:${ss}`;
}

/** Overtime counts up, so it rounds down: "0:00" for its first second. */
export function formatOvertime(ms: number): string {
  return formatTime(Math.floor(ms / 1000) * 1000);
}
