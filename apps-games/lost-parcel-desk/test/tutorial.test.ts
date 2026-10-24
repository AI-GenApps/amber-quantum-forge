import {
  type CaseState,
  createCaseState,
  getCase,
  TOTAL_TUTORIAL_STEPS,
  TUTORIAL,
} from "@web-games/lost-parcel-desk-core";
import { describe, expect, it } from "vitest";
import { pendingCards } from "../src/onboarding/cards";
import {
  finishedTutorial,
  promptFor,
  skipTutorial,
  startTutorial,
  stepTutorial,
  triggerMet,
} from "../src/onboarding/tutorial";

const def = getCase("01");
if (!def) throw new Error("case 01 missing");
const fresh = (): CaseState => createCaseState(def);
const scarf = (): CaseState => ({ ...fresh(), seenObjectIds: ["01-2"] });
const found = (): CaseState => ({ ...scarf(), foundClueIds: ["01-c1"] });
const pinned = (): CaseState => ({ ...found(), pinnedClueIds: ["01-c1"] });
const linked = (): CaseState => ({
  ...pinned(),
  links: [{ clueId: "01-c1", personId: "p01", kind: "fits" }],
});
const accused = (): CaseState => ({ ...linked(), wrongAccusations: 1 });

describe("tutorial steps", () => {
  it("are the six steps of the content plan", () => {
    expect(TOTAL_TUTORIAL_STEPS).toBe(6);
    expect(TUTORIAL.map((step) => step.prompt)).toEqual([
      "Tap the parcel to open it.",
      "Tap the knitted scarf to pick it up.",
      "Switch on the magnifier and tap the glowing spot.",
      "Pin the clue to your board.",
      "Link the clue to the person it fits.",
      "Link one more clue, then accuse.",
    ]);
    expect(promptFor(3)).toBe(TUTORIAL[2]?.prompt);
    expect(promptFor(99)).toBe("");
  });
});

describe("tutorial machine", () => {
  it("starts on step 1 and waits for the parcel", () => {
    const start = startTutorial();
    expect(start).toEqual({ status: "active", step: 1 });
    expect(stepTutorial(start, { state: null })).toBe(start);
  });

  it("advances one step per matching action", () => {
    let tutorial = startTutorial();
    const steps: Array<[CaseState, number]> = [
      [fresh(), 2],
      [scarf(), 3],
      [found(), 4],
      [pinned(), 5],
      [linked(), 6],
    ];
    for (const [state, expected] of steps) {
      tutorial = stepTutorial(tutorial, { state });
      expect(tutorial).toEqual({ status: "active", step: expected });
    }
    tutorial = stepTutorial(tutorial, { state: accused() });
    expect(tutorial.status).toBe("done");
    expect(finishedTutorial(tutorial)).toBe(true);
  });

  it("counts a correct accusation (a closed case) as the first accusation", () => {
    const closed: CaseState = { ...linked(), closed: true, deliveredId: "p01", stamps: 3 };
    expect(triggerMet(TUTORIAL[5]?.trigger ?? { kind: "accused" }, { state: closed })).toBe(true);
  });

  it("does not advance on an action that belongs to a later step", () => {
    const tutorial = { status: "active", step: 2 } as const;
    expect(stepTutorial(tutorial, { state: { ...fresh(), seenObjectIds: ["01-1"] } })).toBe(
      tutorial,
    );
    expect(stepTutorial(tutorial, { state: { ...fresh(), pinnedClueIds: ["01-c1"] } })).toBe(
      tutorial,
    );
    const atPin = { status: "active", step: 4 } as const;
    expect(stepTutorial(atPin, { state: { ...found(), links: linked().links } })).toEqual({
      status: "active",
      step: 4,
    });
    expect(stepTutorial({ status: "active", step: 3 }, { state: scarf() })).toEqual({
      status: "active",
      step: 3,
    });
  });

  it("ignores a rules-out link and a case other than 01", () => {
    const atLink = { status: "active", step: 5 } as const;
    const ruled: CaseState = {
      ...pinned(),
      links: [{ clueId: "01-c1", personId: "p02", kind: "rules-out" }],
    };
    expect(stepTutorial(atLink, { state: ruled })).toBe(atLink);
    const other = getCase("02");
    if (!other) throw new Error("case 02 missing");
    expect(stepTutorial(startTutorial(), { state: createCaseState(other) })).toEqual(
      startTutorial(),
    );
  });

  it("catches up through steps whose actions already happened, in order", () => {
    expect(stepTutorial(startTutorial(), { state: pinned() })).toEqual({
      status: "active",
      step: 5,
    });
  });

  it("can be skipped and then never advances or repeats", () => {
    const skipped = skipTutorial({ status: "active", step: 2 });
    expect(skipped.status).toBe("skipped");
    expect(finishedTutorial(skipped)).toBe(true);
    expect(stepTutorial(skipped, { state: accused() })).toBe(skipped);
    expect(skipTutorial(skipped)).toBe(skipped);
    const done = stepTutorial({ status: "active", step: 6 }, { state: accused() });
    expect(stepTutorial(done, { state: pinned() })).toBe(done);
    expect(skipTutorial(done)).toBe(done);
  });
});

describe("mechanic cards", () => {
  it("shows each card only on its own case, once", () => {
    expect(pendingCards({}, "01").map((card) => card.id)).toEqual(["look-closer", "the-board"]);
    expect(pendingCards({}, "05").map((card) => card.id)).toEqual(["key-and-lock"]);
    expect(pendingCards({}, "06").map((card) => card.id)).toEqual(["rule-outs"]);
    for (const id of ["02", "03", "04", "07", "08", "09", "10", "11", "12"]) {
      expect(pendingCards({}, id), id).toEqual([]);
    }
    expect(pendingCards({ "card-look-closer": true }, "01").map((card) => card.id)).toEqual([
      "the-board",
    ]);
    expect(pendingCards({ "card-look-closer": true, "card-the-board": true }, "01")).toEqual([]);
  });
});
