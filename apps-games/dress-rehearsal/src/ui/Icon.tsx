export type IconName =
  | "check"
  | "cross"
  | "lock"
  | "undo"
  | "redo"
  | "clear"
  | "hint"
  | "coin"
  | "pause"
  | "back"
  | "close"
  | "share"
  | "download"
  | "era"
  | "formality"
  | "warmth"
  | "price"
  | "waterproof"
  | "shade"
  | "sparkle"
  | "sturdy"
  | "brief"
  | "remove"
  | "streak"
  | "frame";

/** 24 x 24 outline icons; stroke only, so they follow `currentColor`. */
export const ICON_PATHS: Readonly<Record<IconName, string>> = {
  check: "M 5 12.5 L 10 17.5 L 19 7",
  cross: "M 6 6 L 18 18 M 18 6 L 6 18",
  lock: "M 7 11 L 17 11 L 17 20 L 7 20 Z M 9 11 L 9 8 Q 9 4.5 12 4.5 Q 15 4.5 15 8 L 15 11",
  undo: "M 9 7 L 5 11 L 9 15 M 5 11 L 14 11 Q 19 11 19 16 Q 19 19 15 19",
  redo: "M 15 7 L 19 11 L 15 15 M 19 11 L 10 11 Q 5 11 5 16 Q 5 19 9 19",
  clear: "M 5 7 L 19 7 M 9 7 L 9 4.5 L 15 4.5 L 15 7 M 7 7 L 8 20 L 16 20 L 17 7",
  hint: "M 12 3.5 Q 7 3.5 7 9 Q 7 12 9.5 14 L 9.5 17 L 14.5 17 L 14.5 14 Q 17 12 17 9 Q 17 3.5 12 3.5 Z M 10 20 L 14 20",
  coin: "M 12 4 Q 4 4 4 12 Q 4 20 12 20 Q 20 20 20 12 Q 20 4 12 4 Z M 12 8 L 12 16 M 9.5 10 L 14.5 10 M 9.5 14 L 14.5 14",
  pause: "M 8 5 L 8 19 M 16 5 L 16 19",
  back: "M 15 5 L 8 12 L 15 19",
  close: "M 6 6 L 18 18 M 18 6 L 6 18",
  share: "M 12 15 L 12 4 M 8 8 L 12 4 L 16 8 M 5 12 L 5 20 L 19 20 L 19 12",
  download: "M 12 4 L 12 15 M 8 11 L 12 15 L 16 11 M 5 19 L 19 19",
  era: "M 12 4 Q 4 4 4 12 Q 4 20 12 20 Q 20 20 20 12 Q 20 4 12 4 Z M 12 7.5 L 12 12 L 15.5 14",
  formality: "M 12 4 L 9 8 L 12 20 L 15 8 Z M 9 8 L 15 8",
  warmth:
    "M 10 14 L 10 5 Q 10 3.5 12 3.5 Q 14 3.5 14 5 L 14 14 Q 17 15 17 18 Q 17 21 12 21 Q 7 21 7 18 Q 7 15 10 14 Z",
  price: "M 4 12 L 12 4 L 20 4 L 20 12 L 12 20 Z M 16 8 L 16.01 8",
  waterproof: "M 12 3.5 Q 6 11 6 15 Q 6 20.5 12 20.5 Q 18 20.5 18 15 Q 18 11 12 3.5 Z",
  shade:
    "M 12 8 Q 8 8 8 12 Q 8 16 12 16 Q 16 16 16 12 Q 16 8 12 8 Z M 12 3 L 12 5 M 12 19 L 12 21 M 3 12 L 5 12 M 19 12 L 21 12 M 5.6 5.6 L 7 7 M 17 17 L 18.4 18.4 M 18.4 5.6 L 17 7 M 7 17 L 5.6 18.4",
  sparkle: "M 12 3 Q 12.8 10.2 21 12 Q 12.8 13.8 12 21 Q 11.2 13.8 3 12 Q 11.2 10.2 12 3 Z",
  sturdy: "M 12 3.5 L 19 6 L 19 12 Q 19 18 12 21 Q 5 18 5 12 L 5 6 Z",
  brief: "M 5 4 L 19 4 L 19 20 L 5 20 Z M 8 9 L 16 9 M 8 13 L 16 13 M 8 17 L 12 17",
  remove: "M 6 6 L 18 18 M 18 6 L 6 18",
  streak:
    "M 12 3 Q 14 9 18 12 Q 20 14 20 16 Q 20 21 12 21 Q 4 21 4 16 Q 4 13 8 10 Q 8 13 10 13 Q 11 8 12 3 Z",
  frame: "M 4 4 L 20 4 L 20 20 L 4 20 Z M 8 8 L 16 8 L 16 16 L 8 16 Z",
};

export interface IconProps {
  name: IconName;
  size?: number;
  class?: string;
}

export function Icon({ name, size = 20, class: className }: IconProps) {
  return (
    <svg
      class={className ? `dr-icon ${className}` : "dr-icon"}
      data-icon={name}
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d={ICON_PATHS[name]} />
    </svg>
  );
}
