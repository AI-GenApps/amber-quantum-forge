import { useEffect, useLayoutEffect, useRef } from "preact/hooks";
import { useApp } from "../app/context";
import { useBack } from "../app/hooks";
import { Btn } from "../components/Btn";
import { ECLIPSE_PHASES, playEclipse } from "../motion/effects";
import { t } from "../strings";

export interface EclipseSequenceProps {
  shards: number;
  eclipses: number;
  onDone: () => void;
  durationMs?: number;
}

export const ECLIPSE_SEQUENCE_MS =
  ECLIPSE_PHASES.dimMs + ECLIPSE_PHASES.ringMs + ECLIPSE_PHASES.returnMs;

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
  const { reducedMotion, motion } = useApp();
  const root = useRef<HTMLDivElement>(null);
  const disc = useRef<HTMLDivElement>(null);
  const text = useRef<HTMLDivElement>(null);
  const done = useRef(onDone);
  done.current = onDone;
  useBack(true, onDone);
  useLayoutEffect(() => {
    if (reducedMotion) return;
    void playEclipse(motion, {
      root: root.current,
      disc: disc.current,
      text: text.current,
    });
  }, [reducedMotion, motion]);
  useEffect(() => {
    if (reducedMotion) return undefined;
    const timer = setTimeout(() => done.current(), durationMs);
    return () => clearTimeout(timer);
  }, [reducedMotion, durationMs]);

  return (
    <div
      ref={root}
      class={reducedMotion ? "co-eclipse-seq co-eclipse-seq--still" : "co-eclipse-seq"}
      role="dialog"
      aria-modal="true"
      aria-labelledby="co-eclipse-seq-title"
      data-sheet="eclipse-sequence"
      data-still={reducedMotion ? "true" : "false"}
    >
      <div ref={disc} class="co-eclipse-seq__disc" aria-hidden="true" />
      <div ref={text} class="co-eclipse-seq__text">
        <h2 id="co-eclipse-seq-title" class="co-eclipse-seq__title">
          {t("eclipseSeq.title", { count: eclipses })}
        </h2>
        <p>{t("eclipseSeq.banked", { count: shards })}</p>
        <Btn onClick={onDone}>{t("eclipseSeq.continue")}</Btn>
      </div>
    </div>
  );
}
