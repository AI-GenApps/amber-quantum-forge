import { useCallback, useEffect, useRef } from "preact/hooks";
import type { GameSession } from "../session/game-session";
import type { SessionSnapshot } from "../session/types";
import {
  activeStep,
  advance,
  eventsBetween,
  impliedFlags,
  initialMachine,
  type Machine,
  type StepId,
} from "./steps";

export interface OnboardingApi {
  /** The hint to show now, or null. */
  readonly step: StepId | null;
  /** Hides the hints for good (kept in the save). */
  skip(): void;
  /** Starts the hints again from the first one. */
  replay(): void;
}

/**
 * Follows the session: marks the beats the player completes, catches a loaded save up, and
 * exposes the current hint. Never blocks input; it only reads snapshots and writes flags.
 */
export function useOnboarding(session: GameSession, snapshot: SessionSnapshot): OnboardingApi {
  const machine = useRef<Machine>(initialMachine);
  const previous = useRef<SessionSnapshot | null>(null);
  const caughtUp = useRef(false);

  useEffect(() => {
    if (!snapshot.loaded) return;
    const before = previous.current;
    previous.current = snapshot;
    if (!caughtUp.current) {
      caughtUp.current = true;
      for (const flag of impliedFlags(snapshot.profile)) session.setTutorial(flag);
      return;
    }
    if (before === null) return;
    for (const event of eventsBetween(before, snapshot)) {
      const outcome = advance(snapshot.profile, machine.current, event);
      machine.current = outcome.machine;
      for (const flag of outcome.set) session.setTutorial(flag);
    }
  }, [session, snapshot]);

  const skip = useCallback(() => session.setTutorial("skipped"), [session]);
  const replay = useCallback(() => {
    machine.current = initialMachine;
    session.resetTutorial();
  }, [session]);

  const step = snapshot.loaded
    ? activeStep(snapshot.profile, { chartOpen: snapshot.chart !== null })
    : null;
  return { step, skip, replay };
}
