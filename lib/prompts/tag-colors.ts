export type TagColor =
  | "gray"
  | "red"
  | "orange"
  | "amber"
  | "green"
  | "teal"
  | "blue"
  | "violet"
  | "pink";

export const DEFAULT_TAG_COLOR: TagColor = "gray";

export const TAG_COLORS: TagColor[] = [
  "gray",
  "red",
  "orange",
  "amber",
  "green",
  "teal",
  "blue",
  "violet",
  "pink",
];

export const TAG_COLOR_LABELS: Record<TagColor, string> = {
  gray: "회색",
  red: "빨강",
  orange: "주황",
  amber: "노랑",
  green: "초록",
  teal: "청록",
  blue: "파랑",
  violet: "보라",
  pink: "분홍",
};

/** Subtle background + readable text + border. Pairs well with both light & dark themes. */
export const TAG_COLOR_CLASS: Record<TagColor, string> = {
  gray: "bg-muted text-foreground border-border",
  red: "bg-red-500/15 text-red-700 border-red-500/30 dark:text-red-300",
  orange: "bg-orange-500/15 text-orange-700 border-orange-500/30 dark:text-orange-300",
  amber: "bg-amber-500/15 text-amber-700 border-amber-500/30 dark:text-amber-300",
  green: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30 dark:text-emerald-300",
  teal: "bg-teal-500/15 text-teal-700 border-teal-500/30 dark:text-teal-300",
  blue: "bg-blue-500/15 text-blue-700 border-blue-500/30 dark:text-blue-300",
  violet: "bg-violet-500/15 text-violet-700 border-violet-500/30 dark:text-violet-300",
  pink: "bg-pink-500/15 text-pink-700 border-pink-500/30 dark:text-pink-300",
};

/** Raw RGB triplet (`R G B`) for use inside `rgb(... / alpha)` — keeps inline
 * box-shadow declarations terse while avoiding Tailwind class allowlisting. */
export const TAG_COLOR_RGB: Record<TagColor, string> = {
  gray: "113 113 122",
  red: "239 68 68",
  orange: "249 115 22",
  amber: "245 158 11",
  green: "16 185 129",
  teal: "20 184 166",
  blue: "59 130 246",
  violet: "139 92 246",
  pink: "236 72 153",
};

/** Build a tight, soft halo by distributing each tag color across the four
 * card sides. Multiple colors blend additively where their shadows overlap. */
const HALO_SIDES: ReadonlyArray<readonly [number, number]> = [
  [0, -7], // top
  [7, 0], // right
  [0, 7], // bottom
  [-7, 0], // left
];

export function tagColorsHalo(colors: TagColor[]): string {
  if (colors.length === 0) return "none";
  const layers: string[] = [];
  for (let i = 0; i < HALO_SIDES.length; i++) {
    const [x, y] = HALO_SIDES[i];
    const rgb = TAG_COLOR_RGB[colors[i % colors.length]];
    layers.push(`${x}px ${y}px 11px -2px rgb(${rgb} / 0.10)`);
    layers.push(`${x}px ${y}px 20px 1px rgb(${rgb} / 0.05)`);
  }
  return layers.join(", ");
}

/** Single-color convenience kept for backwards compatibility. */
export function tagColorHalo(color: TagColor): string {
  return tagColorsHalo([color]);
}

/** Solid swatch used in the color picker dots. */
export const TAG_COLOR_SWATCH: Record<TagColor, string> = {
  gray: "bg-zinc-400",
  red: "bg-red-500",
  orange: "bg-orange-500",
  amber: "bg-amber-500",
  green: "bg-emerald-500",
  teal: "bg-teal-500",
  blue: "bg-blue-500",
  violet: "bg-violet-500",
  pink: "bg-pink-500",
};

export function isTagColor(s: unknown): s is TagColor {
  return typeof s === "string" && (TAG_COLORS as string[]).includes(s);
}
