import type { ComponentChildren } from "preact";
import { useSettings } from "../state/app";
import { tiltFor } from "./seed";

export interface PaperCardProps {
  /** Seeds the slight rotation; the same id always tilts the same way. */
  id: string;
  tone?: "cream" | "cream2";
  tilt?: number;
  class?: string;
  label?: string;
  as?: "div" | "li" | "article" | "section";
  children?: ComponentChildren;
}

export function PaperCard({
  id,
  tone = "cream",
  tilt,
  class: className,
  label,
  as = "div",
  children,
}: PaperCardProps) {
  const { highContrast } = useSettings();
  const Tag = as;
  const classes = [
    "lp-paper",
    `lp-paper--${tone}`,
    highContrast ? "lp-paper--hc" : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <Tag
      class={classes}
      style={{ "--lp-tilt": `${tilt ?? tiltFor(id)}deg` }}
      {...(label ? { "aria-label": label } : {})}
    >
      {children}
    </Tag>
  );
}
