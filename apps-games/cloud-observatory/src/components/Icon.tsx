import type { ComponentChildren } from "preact";
import { cx } from "../ui/cx";

const PATHS: Readonly<Record<string, ComponentChildren>> = {
  lock: (
    <>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </>
  ),
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  star: <path d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.5 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  back: <path d="M15 5l-7 7 7 7" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  comet: (
    <>
      <circle cx="17" cy="7" r="3" />
      <path d="M14.5 9.5L4 20M12 8.5L3 14M15.5 12L10 21" />
    </>
  ),
  shard: <path d="M12 3l6 7-6 11-6-11z" />,
  book: (
    <>
      <path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z" />
      <path d="M5 17a3 3 0 0 1 3-3h11" />
    </>
  ),
  eclipse: (
    <>
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="9.5" />
    </>
  ),
};

export type IconName = keyof typeof PATHS;

export function Icon({ name, class: className }: { name: IconName; class?: string }) {
  return (
    <svg class={cx("co-icon", className)} viewBox="0 0 24 24" aria-hidden="true" data-icon={name}>
      {PATHS[name]}
    </svg>
  );
}
