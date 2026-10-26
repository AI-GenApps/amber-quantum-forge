import type { ShiftEvent } from "@web-games/the-last-window-core";
import { TUTORIAL_STEPS } from "@web-games/the-last-window-core";
import { describe, expect, it } from "vitest";
import {
  createTutorial,
  currentStep,
  isBlocking,
  isFinished,
  STEP_RULES,
  type TutorialInput,
  type TutorialState,
  tutorialReduce,
} from "../src/onboarding/tutorial";

const tick = { tick: 1 };
const seated = (customerId: string): TutorialInput => ({
  type: "event",
  event: { ...tick, type: "customer-seated", seat: 0, customerId, order: {} as never },
});
const event = (e: ShiftEvent): TutorialInput => ({ type: "event", event: e });
const selected = event({ ...tick, type: "seat-selected", seat: 0 });
const drinkReady = event({ ...tick, type: "item-ready", seat: 0, component: "drink" });
const bookReady = event({ ...tick, type: "item-ready", seat: 0, component: "book" });
const servedBy = (customerId: string): TutorialInput =>
  event({
    ...tick,
    type: "served",
    seat: 0,
    customerId,
    regularId: null,
    outcome: "delighted",
    payment: 4,
    tip: 1,
    fp: 1,
    face: "happy",
    scores: { drink: 10, pastry: null, book: null },
  });

const run = (state: TutorialState, ...inputs: TutorialInput[]): TutorialState =>
  inputs.reduce(tutorialReduce, state);
const stepId = (state: TutorialState): string | null => currentStep(state)?.id ?? null;

describe("tutorial rules", () => {
  it("has one rule per content step, in order", () => {
    expect(STEP_RULES.map((rule) => rule.id)).toEqual(TUTORIAL_STEPS.map((step) => step.id));
    expect(TUTORIAL_STEPS).toHaveLength(7);
  });
});

describe("tutorial machine", () => {
  it("opens with Marit's note, which halts the shift until acknowledged", () => {
    const start = createTutorial();
    expect(stepId(start)).toBe("note");
    expect(isBlocking(start)).toBe(true);
    const next = run(start, { type: "ack" });
    expect(isBlocking(next)).toBe(false);
  });

  it("advances only on the matching action", () => {
    let state = run(createTutorial(), { type: "ack" });
    expect(stepId(state)).toBeNull();
    state = run(state, seated("regular-2"));
    expect(stepId(state)).toBe("seat");
    state = run(state, drinkReady, bookReady, servedBy("regular-2"), seated("walkin-1"));
    expect(stepId(state)).toBe("seat");
    state = run(state, { type: "ack" });
    expect(stepId(state)).toBe("seat");
    state = run(state, selected);
    expect(stepId(state)).toBeNull();
    expect(state.index).toBe(4);
  });

  it("waits for each action in turn", () => {
    let state = run(createTutorial(), { type: "ack" }, seated("regular-2"), selected);
    expect(stepId(state)).toBe("drink");
    state = run(state, selected, bookReady, servedBy("walkin-1"));
    expect(stepId(state)).toBe("drink");
    state = run(state, drinkReady);
    expect(stepId(state)).toBe("serve");
    state = run(state, servedBy("walkin-2"));
    expect(stepId(state)).toBe("serve");
    state = run(state, servedBy("regular-2"));
    expect(stepId(state)).toBeNull();
    state = run(state, seated("regular-3"));
    expect(stepId(state)).toBe("pastry");
  });

  it("walks the seven steps in order on a normal run", () => {
    const seen: string[] = [];
    let state = createTutorial();
    const record = (): void => {
      const id = stepId(state);
      if (id && seen.at(-1) !== id) seen.push(id);
    };
    record();
    for (const input of [
      { type: "ack" } as TutorialInput,
      seated("regular-2"),
      selected,
      drinkReady,
      servedBy("regular-2"),
      seated("regular-3"),
      servedBy("regular-3"),
      seated("regular-1"),
      bookReady,
      { type: "ack" } as TutorialInput,
    ]) {
      state = tutorialReduce(state, input);
      record();
    }
    expect(seen).toEqual(TUTORIAL_STEPS.map((step) => step.id));
    expect(state.status).toBe("done");
    expect(isFinished(state)).toBe(true);
  });

  it("shows the patience card until acknowledged or the shift closes", () => {
    const toPatience = run(
      createTutorial(),
      { type: "ack" },
      seated("regular-2"),
      selected,
      drinkReady,
      servedBy("regular-2"),
      seated("regular-3"),
      servedBy("regular-3"),
      seated("regular-1"),
      bookReady,
    );
    expect(stepId(toPatience)).toBe("patience");
    expect(run(toPatience, event({ ...tick, type: "shift-closed" })).status).toBe("done");
    expect(run(toPatience, { type: "ack" }).status).toBe("done");
  });

  it("does not get stuck when a later action happened early", () => {
    const state = run(
      createTutorial(),
      { type: "ack" },
      seated("regular-2"),
      seated("regular-3"),
      selected,
      drinkReady,
      servedBy("regular-3"),
      servedBy("regular-2"),
    );
    expect(stepId(state)).toBeNull();
    expect(state.index).toBe(5);
  });

  it("can be skipped at any point and then ignores everything", () => {
    const state = run(createTutorial(), { type: "ack" }, seated("regular-2"), { type: "skip" });
    expect(state.status).toBe("skipped");
    expect(isFinished(state)).toBe(true);
    expect(currentStep(state)).toBeNull();
    expect(run(state, selected, drinkReady, { type: "ack" })).toBe(state);
  });

  it("ignores acknowledgements on steps that need a real action", () => {
    const state = run(createTutorial(), { type: "ack" }, seated("regular-2"));
    expect(run(state, { type: "ack" })).toEqual(state);
  });
});
