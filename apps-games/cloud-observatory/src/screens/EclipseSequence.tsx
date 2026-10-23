import { useEffect, useRef } from "preact/hooks";
import { useApp } from "../app/context";
import { useBack } from "../app/hooks";
import { Btn } from "../components/Btn";
import { t } from "../strings";

export interface EclipseSequenceProps {
  shards: number;
  eclipses: number;
  onDone: () => void;
  durationMs?: number;
}

export const ECLIPSE_SEQUENCE_MS = 3600;

/**
 * Full-screen transition at the moment of the Eclipse. Slow, no flashing. With reduced motion it
 * is a still card the player dismisses; otherwise it also ends on its own.
 */
export function EclipseSequence({
  shards,
  eclipses,
  onDone,
  durationMs = ECLIPSE_SEQUENCE_MS,
}: EclipseSequenceProps) {
  const { reducedMotion } = useApp();
  const done = useRef(onDone);
  done.current = onDone;
  useBack(true, onDone);
  useEffect(() => {
    if (reducedMotion) return undefined;
    const timer = setTimeout(() => done.current(), durationMs);
    return () => clearTimeout(timer);
  }, [reducedMotion, durationMs]);

  return (
    <div
      class={reducedMotion ? "co-eclipse-seq co-eclipse-seq--still" : "co-eclipse-seq"}
      role="dialog"
      aria-modal="true"
      aria-labelledby="co-eclipse-seq-title"
      data-sheet="eclipse-sequence"
      data-still={reducedMotion ? "true" : "false"}
    >
      <div class="co-eclipse-seq__disc" aria-hidden="true" />
      <div class="co-eclipse-seq__text">
        <h2 id="co-eclipse-seq-title" class="co-eclipse-seq__title">
          {t("eclipseSeq.title", { count: eclipses })}
        </h2>
        <p>{t("eclipseSeq.banked", { count: shards })}</p>
        <Btn onClick={onDone}>{t("eclipseSeq.continue")}</Btn>
      </div>
    </div>
  );
}
