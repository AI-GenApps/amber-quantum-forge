export const ICON_PATHS = {
  back: "M15 5 L8 12 L15 19",
  next: "M9 5 L16 12 L9 19",
  tick: "M5 12.5 L10 17.5 L19 7",
  cross: "M6 6 L18 18 M18 6 L6 18",
  pin: "M12 3 C8 3 6 6 6 9 C6 13 12 21 12 21 C12 21 18 13 18 9 C18 6 16 3 12 3 Z M12 7 A2 2 0 1 0 12 11 A2 2 0 1 0 12 7",
  magnifier: "M10 4 A6 6 0 1 0 10 16 A6 6 0 1 0 10 4 M14.5 14.5 L20 20",
  flip: "M5 8 H17 L14 5 M19 16 H7 L10 19",
  hint: "M12 3 A6 6 0 0 0 8 13.5 V16 H16 V13.5 A6 6 0 0 0 12 3 M9.5 19 H14.5 M10.5 21.5 H13.5",
  lock: "M7 11 V8 A5 5 0 0 1 17 8 V11 M5 11 H19 V21 H5 Z",
  pause: "M8 5 V19 M16 5 V19",
  share: "M12 4 V15 M7.5 8.5 L12 4 L16.5 8.5 M5 14 V20 H19 V14",
  stamp: "M8 4 H16 V10 L19 13 V16 H5 V13 L8 10 Z M4 20 H20",
  book: "M5 4 H17 A2 2 0 0 1 19 6 V20 H7 A2 2 0 0 1 5 18 Z M5 18 A2 2 0 0 1 7 16 H19",
  link: "M9 15 L15 9 M7 12 L5 14 A3.5 3.5 0 0 0 10 19 L12 17 M17 12 L19 10 A3.5 3.5 0 0 0 14 5 L12 7",
  question: "M9 9 A3 3 0 1 1 13 12 C12 12.8 12 13.5 12 15 M12 18 V19",
} as const;

export type IconName = keyof typeof ICON_PATHS;

export interface IconProps {
  name: IconName;
  size?: number;
  class?: string;
}

/** Decorative icon; the caller supplies the accessible name through the surrounding control. */
export function Icon({ name, size = 22, class: className }: IconProps) {
  return (
    <svg
      class={className ? `lp-icon ${className}` : "lp-icon"}
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
      data-icon={name}
    >
      <path d={ICON_PATHS[name]} />
    </svg>
  );
}
