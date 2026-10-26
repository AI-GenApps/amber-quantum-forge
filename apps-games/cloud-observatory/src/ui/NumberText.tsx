import { formatNumber, formatNumberWords } from "@web-games/cloud-observatory-core";
import { cx } from "./cx";

export interface NumberTextProps {
  value: number;
  class?: string;
  /** Spoken after the number, for example "starlight". */
  unit?: string;
}

/** Compact number for the eye, the same number in words for a screen reader. */
export function NumberText({ value, class: className, unit }: NumberTextProps) {
  const words = formatNumberWords(value);
  return (
    <span
      class={cx("co-num", className)}
      role="img"
      aria-label={unit ? `${words} ${unit}` : words}
      data-value={formatNumber(value)}
    >
      {formatNumber(value)}
    </span>
  );
}
