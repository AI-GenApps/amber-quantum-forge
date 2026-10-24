import { TUTORIAL_STEPS, type TutorialStep } from "@web-games/the-last-window-core";
import { useCallback, useEffect, useReducer } from "preact/hooks";
import type { Runner } from "../shift/Runner";
import { useGameStore } from "../state/useGame";
import { FLAG_TUTORIAL } from "./flags";
import {
  createTutorial,
  currentStep,
  isBlocking,
  isFinished,
  type TutorialInput,
  tutorialReduce,
} from "./tutorial";

export interface TutorialView {
  step: TutorialStep | null;
  index: number;
  total: number;
  ack(): void;
  skip(): void;
}

/** Runs the Day 1 coach beside a shift: fed by engine events, saves the flag when it ends. */
export function useTutorial(runner: Runner, enabled: boolean): TutorialView {
  const store = useGameStore();
  const [state, send] = useReducer(
    (current: ReturnType<typeof createTutorial>, input: TutorialInput) =>
      tutorialReduce(current, input),
    undefined,
    createTutorial,
  );

  useEffect(() => {
    if (!enabled) return undefined;
    return runner.onEvents((events) => {
      for (const event of events) {
        send({ type: "event", event });
        if (event.type === "shift-closed") void store.markFlag(FLAG_TUTORIAL);
      }
    });
  }, [runner, enabled, store]);

  const blocking = enabled && isBlocking(state);
  useEffect(() => {
    if (blocking) runner.pause("coach");
    else runner.resume("coach");
    return () => runner.resume("coach");
  }, [runner, blocking]);

  const finished = enabled && isFinished(state);
  useEffect(() => {
    if (finished) void store.markFlag(FLAG_TUTORIAL);
  }, [finished, store]);

  const ack = useCallback(() => send({ type: "ack" }), []);
  const skip = useCallback(() => send({ type: "skip" }), []);
  return {
    step: enabled ? currentStep(state) : null,
    index: state.index,
    total: TUTORIAL_STEPS.length,
    ack,
    skip,
  };
}
