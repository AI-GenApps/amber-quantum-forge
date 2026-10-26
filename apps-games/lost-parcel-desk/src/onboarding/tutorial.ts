import {
  type CaseState,
  TOTAL_TUTORIAL_STEPS,
  TUTORIAL,
  TUTORIAL_CASE_ID,
  type TutorialTrigger,
} from "@web-games/lost-parcel-desk-core";

/** Saved once the tutorial has been finished or skipped, so it never repeats. */
export const TUTORIAL_FLAG = "tutorial-done";

export { TUTORIAL_CASE_ID };

/** What the machine sees: the open case (null while the parcel is still closed) and nothing else. */
export interface TutorialSnapshot {
  state: CaseState | null;
}

export type TutorialStatus = "active" | "done" | "skipped";

export interface TutorialState {
  status: TutorialStatus;
  /** 1 to 6 while active; the number of steps plus one once done. */
  step: number;
}

export function startTutorial(): TutorialState {
  return { status: "active", step: 1 };
}

export function triggerMet(trigger: TutorialTrigger, snapshot: TutorialSnapshot): boolean {
  const state = snapshot.state;
  if (state === null || state.caseId !== TUTORIAL_CASE_ID) return false;
  switch (trigger.kind) {
    case "parcel-opened":
      return true;
    case "object-opened":
      return state.seenObjectIds.includes(trigger.objectId);
    case "clue-found":
      return state.foundClueIds.includes(trigger.clueId);
    case "clue-pinned":
      return state.pinnedClueIds.length > 0;
    case "clue-linked-fits":
      return state.links.some((link) => link.kind === "fits");
    case "accused":
      return state.closed || state.wrongAccusations > 0;
  }
}

/**
 * Advances while the current step's own action has happened. A later step's action does not advance an
 * earlier step, and nothing happens once the tutorial is done or skipped.
 */
export function stepTutorial(current: TutorialState, snapshot: TutorialSnapshot): TutorialState {
  if (current.status !== "active") return current;
  let step = current.step;
  while (step <= TOTAL_TUTORIAL_STEPS) {
    const entry = TUTORIAL[step - 1];
    if (!entry || !triggerMet(entry.trigger, snapshot)) break;
    step += 1;
  }
  if (step === current.step) return current;
  return step > TOTAL_TUTORIAL_STEPS
    ? { status: "done", step: TOTAL_TUTORIAL_STEPS + 1 }
    : { status: "active", step };
}

export function skipTutorial(current: TutorialState): TutorialState {
  return current.status === "active" ? { status: "skipped", step: current.step } : current;
}

export function finishedTutorial(current: TutorialState): boolean {
  return current.status !== "active";
}

export function promptFor(step: number): string {
  return TUTORIAL[step - 1]?.prompt ?? "";
}
