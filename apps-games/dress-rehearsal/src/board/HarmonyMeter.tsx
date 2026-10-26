import { type HarmonyResult, THREE_STAR_HARMONY } from "@web-games/dress-rehearsal-core";
import { ProgressBar } from "@web-games/kit";
import { useEffect, useRef } from "preact/hooks";
import { useMotion } from "../motion/useMotion";
import { t } from "../strings";

export function HarmonyParts({ harmony }: { harmony: HarmonyResult }) {
  return (
    <ul class="dr-parts" data-testid="harmony-parts">
      {harmony.parts.map((part) => (
        <li key={part.id} class="dr-part" data-part={part.id}>
          <span class="dr-part__name">{part.name}</span>
          <span class="dr-part__points">
            {t("harmonyPartPoints", { points: part.points, max: part.max })}
          </span>
          <span class="dr-part__reason">{part.reason}</span>
        </li>
      ))}
    </ul>
  );
}

export interface HarmonyMeterProps {
  harmony: HarmonyResult;
  empty: boolean;
  expandable?: boolean;
}

/** Live harmony score from 0 to 100 with the three-star bar marked and the five named parts. */
export function HarmonyMeter({ harmony, empty, expandable = true }: HarmonyMeterProps) {
  const total = empty ? 0 : harmony.total;
  const motion = useMotion();
  const root = useRef<HTMLElement>(null);
  const shown = useRef(total);

  // biome-ignore lint/correctness/useExhaustiveDependencies: the bar eases only when the score changes
  useEffect(() => {
    const from = shown.current;
    shown.current = total;
    const fill = root.current?.querySelector<HTMLElement>(".wg-progress__fill");
    if (fill && from !== total) void motion.meterEase(fill, from, total);
  }, [total]);

  return (
    <section ref={root} class="dr-meter" data-testid="harmony" aria-label={t("harmonyLabel")}>
      <div class="dr-meter__head">
        <span class="dr-meter__title">{t("harmonyLabel")}</span>
        <span class="dr-meter__value" data-testid="harmony-value">
          {t("harmonyValue", { value: total })}
        </span>
        {!empty && harmony.scheme ? <span class="dr-meter__scheme">{harmony.scheme}</span> : null}
      </div>
      <div class="dr-meter__bar">
        <ProgressBar value={total} max={100} label={t("harmonyBar")} />
        <span
          class="dr-meter__mark"
          style={{ left: `${THREE_STAR_HARMONY}%` }}
          aria-hidden="true"
          data-testid="harmony-mark"
        />
      </div>
      <p class="dr-meter__goal">{t("harmonyGoal", { bar: THREE_STAR_HARMONY })}</p>
      {expandable ? (
        <details class="dr-meter__details">
          <summary>{t("harmonyDetails")}</summary>
          <HarmonyParts harmony={harmony} />
        </details>
      ) : (
        <HarmonyParts harmony={harmony} />
      )}
    </section>
  );
}
