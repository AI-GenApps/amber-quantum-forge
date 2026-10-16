import type { MissionType } from "@city-drive/core";

/** Inline SVG icons: no icon font and no emoji, so nothing falls back to a platform font. */

interface IconProps {
  class?: string;
}

const STAR_PATH = "M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3 6.1 20.6l1.3-6.6L2.5 9.4l6.6-.8z";

export function StarIcon({ earned, class: cls = "" }: IconProps & { earned: boolean }) {
  return (
    <svg
      class={`cd-star ${cls}`.trim()}
      viewBox="0 0 24 24"
      data-earned={earned ? "true" : "false"}
      aria-hidden="true"
    >
      <path d={STAR_PATH} />
    </svg>
  );
}

export function CoinIcon({ class: cls = "" }: IconProps) {
  return (
    <svg class={cls} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="10" fill="var(--color-accent)" />
      <circle
        cx="12"
        cy="12"
        r="6.5"
        fill="none"
        stroke="var(--color-on-accent)"
        stroke-width="2"
      />
    </svg>
  );
}

export function LockIcon({ class: cls = "" }: IconProps) {
  return (
    <svg class={cls} viewBox="0 0 24 24" aria-hidden="true">
      <rect x="5" y="10.5" width="14" height="10" rx="2.5" fill="currentColor" />
      <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" fill="none" stroke="currentColor" stroke-width="2.4" />
    </svg>
  );
}

export function PauseIcon({ class: cls = "" }: IconProps) {
  return (
    <svg class={cls} viewBox="0 0 24 24" aria-hidden="true">
      <rect x="6" y="5" width="4" height="14" rx="1.2" fill="currentColor" />
      <rect x="14" y="5" width="4" height="14" rx="1.2" fill="currentColor" />
    </svg>
  );
}

export function BackIcon({ class: cls = "" }: IconProps) {
  return (
    <svg class={cls} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M15 5l-7 7 7 7"
        fill="none"
        stroke="currentColor"
        stroke-width="3"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  );
}

export function ArrowIcon({ class: cls = "" }: IconProps) {
  return (
    <svg class={cls} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2l9 19-9-5-9 5z" fill="currentColor" />
    </svg>
  );
}

const TYPE_PATHS: Readonly<Record<MissionType, string>> = {
  // A parcel.
  delivery: "M3 8l9-5 9 5v9l-9 5-9-5zM3 8l9 5 9-5M12 13v9",
  // A person with a flag-like hail.
  taxi: "M4 15l2-6h12l2 6v4H4zM8 9V6h8v3M7 19v2M17 19v2",
  // A chequered flag.
  time_trial: "M5 21V4M5 5h14l-3 4 3 4H5",
  // A bay with a P.
  parking: "M4 3h16v18H4zM9 17V7h4a3 3 0 0 1 0 6H9",
};

export function TypeIcon({ type, class: cls = "" }: IconProps & { type: MissionType }) {
  return (
    <svg
      class={cls}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linejoin="round"
      stroke-linecap="round"
      aria-hidden="true"
    >
      <path d={TYPE_PATHS[type]} />
    </svg>
  );
}
