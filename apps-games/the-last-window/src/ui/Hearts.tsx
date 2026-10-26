import { useEffect, useRef } from "preact/hooks";
import { useMotion } from "../motion/useMotion";
import { Glyph } from "./Glyph";

export interface HeartsProps {
  level: number;
  max?: number;
  name: string;
  /** A level just reached (1-based); its heart fills with a pop. */
  fresh?: number | undefined;
}

export function Hearts({ level, max = 5, name, fresh }: HeartsProps) {
  const motion = useMotion();
  const ref = useRef<HTMLSpanElement>(null);
  // biome-ignore lint/correctness/useExhaustiveDependencies: fill once when the level is new
  useEffect(() => {
    if (fresh === undefined || !ref.current) return;
    const heart = ref.current.querySelectorAll<SVGElement>(".tlw-heart--on")[fresh - 1];
    if (heart) void motion.heartFill(heart as unknown as HTMLElement);
  }, [fresh]);
  return (
    <span ref={ref} class="tlw-hearts" role="img" aria-label={`${name}: ${level} of ${max} hearts`}>
      {Array.from({ length: max }, (_, index) => (
        <Glyph
          key={index}
          name="heart"
          size={18}
          class={index < level ? "tlw-heart tlw-heart--on" : "tlw-heart"}
        />
      ))}
    </span>
  );
}
