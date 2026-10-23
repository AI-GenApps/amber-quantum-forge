import type { EconomyEvent, MapDef, PieceKind } from "@web-games/floodplain-dispatch-core";
import { useCallback, useEffect, useRef } from "preact/hooks";
import {
  economyFeedback,
  type FeedbackEvent,
  resultFeedback,
  STAR_STAGGER_MS,
} from "../audio/events";
import { flowLevel, playbackFeedback } from "../audio/playbackEvents";
import type { Badge } from "../board/model";
import { useFeedback } from "../state/app";
import type { PlanResult } from "./plan";
import type { PlaybackState } from "./playback";
import type { SheetState } from "./types";

/** Most one place or remove cue per this many milliseconds while dragging across cells. */
export const STROKE_GAP_MS = 60 as const;

export function usePlanCues() {
  const feedback = useFeedback();
  const strokeInvalid = useRef(false);
  const lastStroke = useRef(0);

  const planCue = useCallback(
    (result: PlanResult, piece?: PieceKind): void => {
      const stroking = result.state.stroke !== "none";
      if (result.error) {
        if (stroking && strokeInvalid.current) return;
        strokeInvalid.current = stroking;
        feedback.fire({ type: "invalid" });
        return;
      }
      const now = Date.now();
      const quick = stroking && now - lastStroke.current < STROKE_GAP_MS;
      if (result.change === "placed" && piece && !quick) {
        lastStroke.current = now;
        feedback.fire({ type: "place", piece });
      } else if (result.change === "removed" && !quick) {
        lastStroke.current = now;
        feedback.fire({ type: "remove" });
      } else if (result.change === "rotated") {
        feedback.fire({ type: "rotate" });
      }
    },
    [feedback],
  );

  const strokeStarted = useCallback((): void => {
    strokeInvalid.current = false;
    lastStroke.current = 0;
  }, []);

  const runStarted = useCallback((): void => feedback.fire({ type: "run" }), [feedback]);

  return { planCue, strokeStarted, runStarted };
}

export interface SessionFeedbackInput {
  def: MapDef;
  phase: "plan" | "playback";
  playback: PlaybackState;
  badges: readonly Badge[];
  depths: Uint8Array | undefined;
  sheet: SheetState | null;
  runId: number | null;
  stars: number | null;
  events: readonly EconomyEvent[] | null;
}

export function useSessionFeedback(input: SessionFeedbackInput): void {
  const feedback = useFeedback();
  const previous = useRef<{ pos: number; badges: readonly Badge[] }>({ pos: 0, badges: [] });
  const resultFor = useRef(0);
  const economyFor = useRef(0);
  const lastSheet = useRef<SheetState["kind"] | null>(null);
  const { def, phase, playback, badges, depths, sheet, runId, stars, events } = input;

  useEffect(() => {
    const kind = sheet?.kind ?? null;
    if (kind && kind !== lastSheet.current && kind !== "result") {
      feedback.fire({ type: "ui", ui: "sheet" });
    }
    lastSheet.current = kind;
  }, [sheet, feedback]);

  useEffect(() => {
    if (phase !== "playback") {
      previous.current = { pos: 0, badges: [] };
      return;
    }
    const to = { pos: playback.pos, badges };
    const events: FeedbackEvent[] = playbackFeedback(def, previous.current, to);
    previous.current = to;
    for (const event of events) feedback.fire(event);
  }, [phase, playback.pos, badges, def, feedback]);

  useEffect(() => {
    const level =
      phase === "playback" && playback.playing && depths ? flowLevel(depths, depths.length) : 0;
    feedback.setFlow(level);
  }, [phase, playback.playing, depths, feedback]);

  useEffect(() => () => feedback.setFlow(0), [feedback]);

  useEffect(() => {
    if (sheet?.kind !== "result" || runId === null || stars === null) return;
    if (resultFor.current === runId) return;
    resultFor.current = runId;
    for (const entry of resultFeedback(stars)) feedback.fireLater(entry.event, entry.delayMs);
  }, [sheet, runId, stars, feedback]);

  useEffect(() => {
    if (sheet?.kind !== "result" || runId === null || events === null) return;
    if (economyFor.current === runId) return;
    economyFor.current = runId;
    const delay = Math.max(1, stars ?? 0) * STAR_STAGGER_MS + 250;
    for (const event of economyFeedback(events)) feedback.fireLater(event, delay);
  }, [sheet, runId, events, stars, feedback]);
}
