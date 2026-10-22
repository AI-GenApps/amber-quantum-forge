import type { ComponentChildren } from "preact";
import { cx } from "./cx";

export interface ScreenProps {
  /** Exposed as `data-screen` so tests and analytics can identify the screen. */
  name?: string;
  class?: string;
  children?: ComponentChildren;
}

/** Full-height portrait screen that pads itself with the device safe-area insets. */
export function Screen({ name, class: className, children }: ScreenProps) {
  return (
    <section class={cx("wg-screen", className)} data-screen={name}>
      {children}
    </section>
  );
}

export interface CardProps {
  title?: string;
  tone?: "default" | "raised";
  class?: string;
  children?: ComponentChildren;
}

export function Card({ title, tone = "default", class: className, children }: CardProps) {
  return (
    <div class={cx("wg-card", tone === "raised" && "wg-card--raised", className)}>
      {title ? <h3 class="wg-card__title">{title}</h3> : null}
      {children}
    </div>
  );
}

export interface ProgressBarProps {
  value: number;
  max?: number;
  /** Accessible name, for example "Level progress". */
  label: string;
  class?: string;
}

export function ProgressBar({ value, max = 100, label, class: className }: ProgressBarProps) {
  const safeMax = max > 0 ? max : 1;
  const clamped = Math.min(Math.max(Number.isFinite(value) ? value : 0, 0), safeMax);
  return (
    <div
      class={cx("wg-progress", className)}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={safeMax}
      aria-valuenow={clamped}
    >
      <div class="wg-progress__fill" style={{ transform: `scaleX(${clamped / safeMax})` }} />
    </div>
  );
}

export interface StarRatingProps {
  value: number;
  max?: number;
  /** Overrides the default "2 of 3 stars" accessible name. */
  label?: string;
  class?: string;
}

const STAR_PATH = "M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.2 6.1 20.6l1.3-6.6L2.5 9.4l6.6-.8z";

export function StarRating({ value, max = 3, label, class: className }: StarRatingProps) {
  const count = Math.max(1, Math.floor(max));
  const filled = Math.min(Math.max(Math.round(Number.isFinite(value) ? value : 0), 0), count);
  return (
    <span
      class={cx("wg-stars", className)}
      role="img"
      aria-label={label ?? `${filled} of ${count} stars`}
    >
      {Array.from({ length: count }, (_, index) => (
        <svg
          key={index}
          class={cx("wg-star", index < filled ? "wg-star--on" : "wg-star--off")}
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d={STAR_PATH} />
        </svg>
      ))}
    </span>
  );
}
