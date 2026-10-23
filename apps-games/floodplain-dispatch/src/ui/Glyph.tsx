export type GlyphKind =
  | "check"
  | "wave"
  | "drop"
  | "cross"
  | "dot"
  | "arrow-left"
  | "lock"
  | "menu";

const PATHS: Readonly<Record<GlyphKind, string>> = {
  check: "M4 12.5 L9.5 18 L20 6.5",
  wave: "M3 9 L7 5 L11 9 L15 5 L19 9 M3 17 L7 13 L11 17 L15 13 L19 17",
  drop: "M12 3 C12 3 5 11 5 15 A7 7 0 0 0 19 15 C19 11 12 3 12 3 Z",
  cross: "M5 5 L19 19 M19 5 L5 19",
  dot: "M12 9 A3 3 0 1 1 11.99 9 Z",
  "arrow-left": "M19 12 H5 M11 6 L5 12 L11 18",
  lock: "M7 11 V8 A5 5 0 0 1 17 8 V11 M5 11 H19 V21 H5 Z",
  menu: "M4 7 H20 M4 12 H20 M4 17 H20",
};

export interface GlyphProps {
  kind: GlyphKind;
  size?: number;
}

/** Icon drawn from paths, so no text glyph can fall back to a platform font. */
export function Glyph({ kind, size = 20 }: GlyphProps) {
  const filled = kind === "drop" || kind === "dot";
  return (
    <svg
      class="fd-glyph"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      aria-hidden="true"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      stroke-width="2.4"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d={PATHS[kind]} />
    </svg>
  );
}
