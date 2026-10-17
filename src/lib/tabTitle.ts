// The tab title, which carries the time left so it can be read from another tab.
import { formatOvertime, formatTime, type RunView } from "#lib/run.ts";
import type { Timer } from "#lib/types.ts";

/** E.g. "12:34 📖 Read · Small group · Timer Toolbox". */
export function tabTitle(timer: Timer, current: RunView, page = ""): string {
  const segment = timer.segments[current.index];
  const label =
    `${segment.emoji} ${segment.label.trim() || `Part ${current.index + 1}`}`.trim();
  const next = timer.segments[current.index + 1];
  const nextLabel = next
    ? `${next.emoji} ${next.label.trim() || `Part ${current.index + 2}`}`.trim()
    : "";
  const status = {
    idle: "",
    running: `${formatTime(current.segmentLeft)} ${label}`,
    paused: `⏸ ${formatTime(current.segmentLeft)} ${label}`,
    waiting: `Next: ${nextLabel}`,
    ended: timer.settings.overtime
      ? `Time's up +${formatOvertime(current.overtime)}`
      : "Time's up",
  }[current.status];
  return [status, page || timer.name, "Timer Toolbox"]
    .filter(Boolean)
    .join(" · ");
}
