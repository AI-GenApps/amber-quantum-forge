import { decodeTiles, getTutorial, TUTORIALS } from "@web-games/lantern-loops-core";
import { describe, expect, it } from "vitest";
import {
  completes,
  highlightCells,
  initialState,
  isGuided,
  needsOnboarding,
  type OnboardingAction,
  type OnboardingState,
  type OnboardingStep,
  reduce,
  routeFor,
  scriptedMoves,
  stateForPuzzle,
  stepTextKey,
} from "../../src/onboarding/machine";
import { createSession } from "../../src/state/session";
import { puzzleFrom } from "../helpers/board";

const at = (step: OnboardingStep): OnboardingState => ({ step });
const STEPS: OnboardingStep[] = ["welcome", "tutorial-1", "tutorial-2"];

function tutorial(id: string) {
  const record = getTutorial(id);
  if (!record) throw new Error(`missing ${id}`);
  const solution = decodeTiles(record.solution, record.size);
  if (!solution.ok) throw new Error("bad solution");
  return { record, puzzle: puzzleFrom(record.code, id), solution: solution.value };
}

describe("onboarding start", () => {
  it("starts for a fresh profile and never for a returning one", () => {
    expect(initialState({ onboardingDone: false })).toEqual(at("welcome"));
    expect(initialState({ onboardingDone: true })).toEqual(at("done"));
    expect(needsOnboarding({ onboardingDone: false })).toBe(true);
    expect(needsOnboarding({ onboardingDone: true })).toBe(false);
    expect(isGuided(at("welcome"))).toBe(true);
    expect(isGuided(at("done"))).toBe(false);
  });
});

describe("transitions", () => {
  it("walks welcome, board one, board two, done", () => {
    let state = at("welcome");
    state = reduce(state, "start");
    expect(state).toEqual(at("tutorial-1"));
    state = reduce(state, "solved");
    expect(state).toEqual(at("tutorial-2"));
    state = reduce(state, "solved");
    expect(state).toEqual(at("done"));
  });

  it("Skip ends the onboarding from every step and reports completion", () => {
    for (const step of STEPS) {
      const next = reduce(at(step), "skip");
      expect(next).toEqual(at("done"));
      expect(completes(at(step), next)).toBe(true);
    }
    expect(completes(at("done"), reduce(at("done"), "skip"))).toBe(false);
  });

  it("ignores actions that do not apply", () => {
    expect(reduce(at("welcome"), "solved")).toEqual(at("welcome"));
    expect(reduce(at("tutorial-1"), "start")).toEqual(at("tutorial-1"));
    expect(reduce(at("done"), "solved")).toEqual(at("done"));
    expect(reduce(at("done"), "start")).toEqual(at("done"));
  });

  it("replay restarts at board one from anywhere, including done", () => {
    for (const step of [...STEPS, "done" as const]) {
      expect(reduce(at(step), "replay")).toEqual(at("tutorial-1"));
    }
    expect(completes(at("done"), at("tutorial-1"))).toBe(false);
  });

  it("only the last solve completes the walk", () => {
    expect(completes(at("tutorial-1"), reduce(at("tutorial-1"), "solved"))).toBe(false);
    expect(completes(at("tutorial-2"), reduce(at("tutorial-2"), "solved"))).toBe(true);
  });

  it("never leaves done except by replay", () => {
    const actions: OnboardingAction[] = ["start", "solved", "skip"];
    for (const action of actions) expect(reduce(at("done"), action)).toEqual(at("done"));
  });
});

describe("routes and copy", () => {
  it("routes each state", () => {
    expect(routeFor(at("tutorial-1"))).toEqual({ name: "puzzle", id: "tutorial-1" });
    expect(routeFor(at("tutorial-2"))).toEqual({ name: "puzzle", id: "tutorial-2" });
    expect(routeFor(at("done"))).toEqual({ name: "home" });
    expect(routeFor(at("welcome"))).toEqual({ name: "home" });
  });

  it("maps tutorial puzzle ids to steps", () => {
    expect(stateForPuzzle("tutorial-1")).toEqual(at("tutorial-1"));
    expect(stateForPuzzle("tutorial-2")).toEqual(at("tutorial-2"));
    expect(stateForPuzzle("harbor-01")).toEqual(at("done"));
  });

  it("has one sentence per step", () => {
    expect(stepTextKey("tutorial-1")).toBe("onboarding.step1");
    expect(stepTextKey("tutorial-2")).toBe("onboarding.step2");
    expect(stepTextKey("welcome")).toBe("onboarding.body");
  });
});

describe("tutorial boards", () => {
  it("highlight the lantern, then the stone", () => {
    const one = tutorial("tutorial-1");
    const two = tutorial("tutorial-2");
    expect(highlightCells(one.puzzle)).toHaveLength(1);
    expect(one.puzzle.cells[highlightCells(one.puzzle)[0] ?? 0]?.clue?.kind).toBe("lantern");
    expect(highlightCells(two.puzzle).some((i) => two.puzzle.cells[i]?.kind === "stone")).toBe(
      true,
    );
  });

  it("can be solved by the scripted moves, in order, on a fresh session", () => {
    expect(TUTORIALS.map((record) => record.id)).toEqual(["tutorial-1", "tutorial-2"]);
    for (const { id } of TUTORIALS) {
      const { puzzle, solution } = tutorial(id);
      const session = createSession({ puzzle, solution, brush: "straight" });
      const moves = scriptedMoves(puzzle, solution);
      expect(moves.length).toBeGreaterThan(2);
      for (const move of moves) {
        session.setBrush(move.brush);
        for (let k = 0; k < move.taps; k++) session.tap(move.cell);
      }
      expect(session.state().solved, id).toBe(true);
      expect(Array.from(session.state().tiles), id).toEqual(Array.from(solution));
    }
  });
});
