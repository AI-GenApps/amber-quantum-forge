import { useEffect, useRef } from "preact/hooks";
import { useMotion } from "../motion/useMotion";
import { useReducedMotion } from "../state/app";
import { tiltFor } from "./seed";

export interface RubberStampProps {
  text: string;
  /** Falls onto the page with a thud unless motion is reduced. */
  fall?: boolean;
  tone?: "brick" | "teal";
  size?: "small" | "large";
  id?: string;
}

export function RubberStamp({
  text,
  fall = false,
  tone = "brick",
  size = "large",
  id = text,
}: RubberStampProps) {
  const reduced = useReducedMotion();
  const motion = useMotion();
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (fall && box.current) void motion.stampFall(box.current);
  }, [fall, motion]);
  const classes = [
    "lp-rstamp",
    `lp-rstamp--${tone}`,
    `lp-rstamp--${size}`,
    fall && !reduced ? "lp-rstamp--fall" : "",
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <div
      class={classes}
      ref={box}
      style={{ "--lp-tilt": `${tiltFor(id, 6) - 4}deg` }}
      data-stamp={tone}
    >
      <span class="lp-rstamp__text">{text}</span>
    </div>
  );
}
