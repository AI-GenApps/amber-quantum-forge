import type { MoodId } from "@web-games/the-last-window-core";

export type GlyphName =
  | "back"
  | "pause"
  | "heart"
  | "coin"
  | "lock"
  | "check"
  | "clock"
  | "trash"
  | MoodId;

const PATHS: Readonly<Record<GlyphName, string>> = {
  back: "M15 5 L8 12 L15 19",
  pause: "M8 5 V19 M16 5 V19",
  heart: "M12 20 C4 14 3 9 6 6.5 C8.5 4.5 11 6 12 8 C13 6 15.5 4.5 18 6.5 C21 9 20 14 12 20Z",
  coin: "M12 4 A8 8 0 1 0 12.01 4 M12 8 V16 M9.5 10 H14.5",
  lock: "M7 11 V8 A5 5 0 0 1 17 8 V11 M5 11 H19 V20 H5Z",
  check: "M5 12 L10 17 L19 7",
  clock: "M12 4 A8 8 0 1 0 12.01 4 M12 8 V12 L15 14",
  trash: "M6 7 H18 M9 7 V5 H15 V7 M7 7 L8 20 H16 L17 7",
  comforting:
    "M5 11 H17 V15 A4 4 0 0 1 13 19 H9 A4 4 0 0 1 5 15Z M17 12 H19 A2 2 0 0 1 19 16 H17 M9 3 C8 5 10 6 9 8",
  adventurous: "M12 3 A9 9 0 1 0 12.01 3 M15.5 8.5 L13.5 13.5 L8.5 15.5 L10.5 10.5Z",
  wistful: "M16 5 A8 8 0 1 0 19 16 A7 7 0 0 1 16 5Z",
  funny: "M12 3 A9 9 0 1 0 12.01 3 M8 10 H8.5 M15.5 10 H16 M7.5 14 C9 18 15 18 16.5 14Z",
  curious: "M10.5 3 A6.5 6.5 0 1 0 10.51 3 M15.5 15.5 L20 20 M10.5 6.5 C8.5 6.5 8 9 10 9.5",
};

export interface GlyphProps {
  name: GlyphName;
  size?: number;
  class?: string;
}

/** Decorative stroke icon; the surrounding control carries the accessible name. */
export function Glyph({ name, size = 22, class: className }: GlyphProps) {
  return (
    <svg
      class={className ? `tlw-glyph ${className}` : "tlw-glyph"}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
      focusable="false"
      data-glyph={name}
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
