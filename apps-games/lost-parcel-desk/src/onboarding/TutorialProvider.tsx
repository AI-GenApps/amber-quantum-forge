import { type CaseState, isClosed } from "@web-games/lost-parcel-desk-core";
import { type ComponentChildren, createContext } from "preact";
import { useContext, useEffect, useRef, useState } from "preact/hooks";
import type { AppRouter } from "../nav";
import { useApp, useProfile } from "../state/app";
import { useGame } from "../state/useGame";
import { Coachmark } from "./Coachmark";
import {
  finishedTutorial,
  skipTutorial,
  startTutorial,
  stepTutorial,
  TUTORIAL_CASE_ID,
  TUTORIAL_FLAG,
} from "./tutorial";

const CoachContext = createContext<number | null>(null);

/** The tutorial step whose target should glow, or null when no tutorial step is showing. */
export function useCoachStep(): number | null {
  return useContext(CoachContext);
}

const TUTORIAL_SCREENS: ReadonlySet<string> = new Set(["intro", "table", "viewer", "board"]);

function onTutorialCase(router: AppRouter): boolean {
  const entry = router.current;
  if (!TUTORIAL_SCREENS.has(entry.name)) return false;
  const params = entry.params as { caseId?: string } | undefined;
  return params?.caseId === TUTORIAL_CASE_ID;
}

export interface TutorialProviderProps {
  children: ComponentChildren;
}

/**
 * Runs the six-step case 01 tutorial. Steps advance only through the real case state, the coachmark sits
 * under the screen, and finishing or skipping saves a flag so it never repeats.
 */
export function TutorialProvider({ children }: TutorialProviderProps) {
  const { router, game } = useApp();
  const profile = useProfile();
  const { active } = useGame();
  const [tutorial, setTutorial] = useState(startTutorial);
  const flagged = profile.flags[TUTORIAL_FLAG] === true;
  const wasFlagged = useRef(flagged);

  const state: CaseState | null = active?.kind === "campaign" ? active.state : null;
  useEffect(() => {
    setTutorial((current) => stepTutorial(current, { state }));
  }, [state]);

  useEffect(() => {
    if (wasFlagged.current && !flagged) setTutorial(startTutorial());
    wasFlagged.current = flagged;
  }, [flagged]);

  useEffect(() => {
    if (finishedTutorial(tutorial) && !flagged) void game.markFlag(TUTORIAL_FLAG);
  }, [tutorial, flagged, game]);

  const eligible = !flagged && !isClosed(profile, TUTORIAL_CASE_ID);
  const here = onTutorialCase(router);
  const step = eligible && here && tutorial.status === "active" ? tutorial.step : null;

  return (
    <CoachContext.Provider value={step}>
      <div class="lp-shell">
        {children}
        {step !== null ? (
          <Coachmark step={step} onSkip={() => setTutorial((current) => skipTutorial(current))} />
        ) : null}
      </div>
    </CoachContext.Provider>
  );
}
