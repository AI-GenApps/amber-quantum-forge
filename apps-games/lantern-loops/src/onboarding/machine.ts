import {
  type Brush,
  cellAt,
  type Puzzle,
  type Tiles,
  TUTORIALS,
} from "@web-games/lantern-loops-core";

export const WELCOME = "welcome";
export const TUTORIAL_IDS = TUTORIALS.map((record) => record.id);

export type OnboardingStep = "welcome" | "tutorial-1" | "tutorial-2" | "done";
export type OnboardingAction = "start" | "solved" | "skip" | "replay";

export interface OnboardingState {
  step: OnboardingStep;
}

export type OnboardingRoute = { name: "puzzle"; id: string } | { name: "home" };

/** A fresh profile starts the onboarding; a returning one never sees it. */
export function needsOnboarding(profile: { onboardingDone: boolean }): boolean {
  return !profile.onboardingDone;
}

export function initialState(profile: { onboardingDone: boolean }): OnboardingState {
  return { step: needsOnboarding(profile) ? "welcome" : "done" };
}

/** The state while a tutorial board is on screen. */
export function stateForPuzzle(id: string): OnboardingState {
  return { step: id === "tutorial-1" || id === "tutorial-2" ? id : "done" };
}

export function isGuided(state: OnboardingState): boolean {
  return state.step !== "done";
}

/** Skip works at every step; solving walks the two boards; replay always restarts at board one. */
export function reduce(state: OnboardingState, action: OnboardingAction): OnboardingState {
  if (action === "replay") return { step: "tutorial-1" };
  switch (state.step) {
    case "welcome":
      if (action === "start") return { step: "tutorial-1" };
      return action === "skip" ? { step: "done" } : state;
    case "tutorial-1":
      if (action === "solved") return { step: "tutorial-2" };
      return action === "skip" ? { step: "done" } : state;
    case "tutorial-2":
      return action === "solved" || action === "skip" ? { step: "done" } : state;
    default:
      return state;
  }
}

/** True when the transition ends the onboarding, so `onboardingDone` must be saved. */
export function completes(before: OnboardingState, after: OnboardingState): boolean {
  return before.step !== "done" && after.step === "done";
}

export function routeFor(state: OnboardingState): OnboardingRoute {
  return state.step === "tutorial-1" || state.step === "tutorial-2"
    ? { name: "puzzle", id: state.step }
    : { name: "home" };
}

export function stepTextKey(
  step: OnboardingStep,
): "onboarding.body" | "onboarding.step1" | "onboarding.step2" {
  switch (step) {
    case "tutorial-1":
      return "onboarding.step1";
    case "tutorial-2":
      return "onboarding.step2";
    default:
      return "onboarding.body";
  }
}

/** The cells a tutorial step points at: its lantern or its stone. */
export function highlightCells(puzzle: Puzzle): number[] {
  const out: number[] = [];
  for (let i = 0; i < puzzle.size * puzzle.size; i++) {
    const cell = cellAt(puzzle, i);
    if (cell.kind === "stone" || cell.clue?.kind === "lantern") out.push(i);
  }
  return out;
}

export interface ScriptedMove {
  cell: number;
  brush: Brush;
  /** Taps with that brush: a straight needs one or two, a corner one to four. */
  taps: number;
}

const CORNER_ORDER = [3, 6, 12, 9];

/** The taps that build the stored solution on an empty board, in reading order. */
export function scriptedMoves(puzzle: Puzzle, solution: Tiles): ScriptedMove[] {
  const moves: ScriptedMove[] = [];
  for (let i = 0; i < solution.length; i++) {
    const mask = solution[i] ?? 0;
    if (mask === 0 || puzzle.cells[i]?.fixed !== undefined) continue;
    if (mask === 10) moves.push({ cell: i, brush: "straight", taps: 1 });
    else if (mask === 5) moves.push({ cell: i, brush: "straight", taps: 2 });
    else moves.push({ cell: i, brush: "corner", taps: CORNER_ORDER.indexOf(mask) + 1 });
  }
  return moves;
}
