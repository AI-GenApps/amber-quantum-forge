import {
  type Category,
  type Flags,
  TUTORIAL_CHALLENGE_ID,
  TUTORIAL_STEPS,
  type TutorialTarget,
} from "@web-games/dress-rehearsal-core";

export const TUTORIAL_FLAG = "tutorial" as const;
export const TUTORIAL_LAST = TUTORIAL_STEPS.length;
export const TUTORIAL_TAB: Category = "top";

export type TutorialStatus = "active" | "done" | "skipped";

export interface TutorialState {
  readonly status: TutorialStatus;
  /** 1 to 5, the step being shown. */
  readonly step: number;
}

export type TutorialAction =
  | { readonly type: "client-seen" }
  | { readonly type: "tab-opened"; readonly tab: Category }
  | { readonly type: "placed" }
  | { readonly type: "complete"; readonly complete: boolean }
  | { readonly type: "finish" }
  | { readonly type: "skip" };

export function startTutorial(): TutorialState {
  return { status: "active", step: 1 };
}

export const finishedTutorial = (state: TutorialState): boolean => state.status !== "active";

/** True for a first campaign visit to the tutorial challenge: the flag is unset and it is riv-01. */
export function shouldRunTutorial(
  flags: Pick<Flags, "tutorial">,
  challengeId: string | null,
): boolean {
  return challengeId === TUTORIAL_CHALLENGE_ID && !flags.tutorial;
}

function matches(step: number, action: TutorialAction): boolean {
  const advance = TUTORIAL_STEPS[step - 1]?.advance;
  switch (action.type) {
    case "client-seen":
      return advance === "tap";
    case "tab-opened":
      return advance === "tab-opened" && action.tab === TUTORIAL_TAB;
    case "placed":
      return advance === "first-placement";
    case "complete":
      return advance === "look-complete" && action.complete;
    case "finish":
      return advance === "finish";
    case "skip":
      return true;
  }
}

/** Only the matching real action advances a step; anything else returns the same state object. */
export function stepTutorial(state: TutorialState, action: TutorialAction): TutorialState {
  if (state.status !== "active") return state;
  if (action.type === "skip") return { ...state, status: "skipped" };
  if (!matches(state.step, action)) return state;
  if (state.step >= TUTORIAL_LAST) return { ...state, status: "done" };
  return { ...state, step: state.step + 1 };
}

/** The board parts that stand out on the current step; empty once the tutorial is over. */
export function targetsFor(state: TutorialState): readonly TutorialTarget[] {
  if (state.status !== "active") return [];
  return TUTORIAL_STEPS[state.step - 1]?.targets ?? [];
}
