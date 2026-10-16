import { starsLabel } from "../model/format";
import { StarIcon } from "./Icons";

/**
 * Three stars, `earned` of them filled. With `animate` the filled stars pop in one after the
 * other (CSS delay per star), which the results screen uses.
 */
export function Stars({ earned, animate = false }: { earned: number; animate?: boolean }) {
  return (
    <span class="cd-stars" role="img" aria-label={starsLabel(earned)} data-animate={animate}>
      {[0, 1, 2].map((i) => (
        <span key={i} class="cd-star-slot" style={{ "--i": i }} data-earned={i < earned}>
          <StarIcon earned={i < earned} />
        </span>
      ))}
    </span>
  );
}
