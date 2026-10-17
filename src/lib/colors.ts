// Segment colors teachers pick from. Each is bright enough to read as its own wedge
// on the light board and on the black high-contrast board.
import type { ColorId } from "#lib/types.ts";

export interface ColorSwatch {
  id: ColorId;
  label: string;
  hex: string;
}

export const COLORS: readonly ColorSwatch[] = [
  { id: "blue", label: "Blue", hex: "#60a5fa" },
  { id: "green", label: "Green", hex: "#4ade80" },
  { id: "orange", label: "Orange", hex: "#fb923c" },
  { id: "purple", label: "Purple", hex: "#c084fc" },
  { id: "yellow", label: "Yellow", hex: "#facc15" },
  { id: "teal", label: "Teal", hex: "#2dd4bf" },
  { id: "pink", label: "Pink", hex: "#f472b6" },
  { id: "red", label: "Red", hex: "#f87171" },
];

export function isColor(value: unknown): value is ColorId {
  return COLORS.some((swatch) => swatch.id === value);
}

export function colorHex(color: ColorId): string {
  return COLORS.find((swatch) => swatch.id === color)?.hex ?? COLORS[0].hex;
}

/** The color a new segment gets: the first one the timer doesn't use yet. */
export function nextColor(used: ColorId[]): ColorId {
  return (
    COLORS.find((swatch) => !used.includes(swatch.id))?.id ??
    COLORS[used.length % COLORS.length].id
  );
}
