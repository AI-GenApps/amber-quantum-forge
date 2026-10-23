import {
  getMap,
  MAPS,
  MECHANIC_CARDS,
  type Profile,
  TUTORIAL_STEPS,
} from "@web-games/floodplain-dispatch-core";
import { act } from "preact/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cardFlag, pendingCard } from "../src/onboarding/cards";
import {
  canalConnected,
  finishedTutorial,
  highlightFor,
  startTutorial,
  stepTutorial,
  TUTORIAL_FLAG,
  type TutorialAction,
} from "../src/onboarding/tutorial";
import { buttonByText, click, mountApp, q, type Rig, starsFor, text } from "./helpers";
import { clickByText, Pilot, playUntilResult } from "./pilot";

describe("tutorial step machine", () => {
  it("has the five v01 steps in order", () => {
    expect(TUTORIAL_STEPS.map((step) => step.step)).toEqual([1, 2, 3, 4, 5]);
    expect(startTutorial()).toEqual({ status: "active", step: 1 });
  });

  it("advances only on the matching real action", () => {
    let state = startTutorial();
    const wrong: TutorialAction[] = [
      { type: "tool", tool: "canal" },
      { type: "plan", connected: true },
      { type: "run" },
      { type: "result-seen" },
    ];
    for (const action of wrong) expect(stepTutorial(state, action)).toBe(state);
    state = stepTutorial(state, { type: "inlet-ack" });
    expect(state.step).toBe(2);
    expect(stepTutorial(state, { type: "tool", tool: "erase" })).toBe(state);
    expect(stepTutorial(state, { type: "inlet-ack" })).toBe(state);
    state = stepTutorial(state, { type: "tool", tool: "canal" });
    expect(state.step).toBe(3);
    expect(stepTutorial(state, { type: "plan", connected: false })).toBe(state);
    state = stepTutorial(state, { type: "plan", connected: true });
    expect(state.step).toBe(4);
    expect(stepTutorial(state, { type: "result-seen" })).toBe(state);
    state = stepTutorial(state, { type: "run" });
    expect(state.step).toBe(5);
    state = stepTutorial(state, { type: "result-seen" });
    expect(state).toEqual({ status: "done", step: 5 });
    expect(finishedTutorial(state)).toBe(true);
  });

  it("can be skipped at any step and then never moves again", () => {
    for (let step = 1; step <= 5; step++) {
      const skipped = stepTutorial({ status: "active", step }, { type: "skip" });
      expect(skipped.status).toBe("skipped");
      expect(stepTutorial(skipped, { type: "inlet-ack" })).toBe(skipped);
      expect(stepTutorial(skipped, { type: "run" })).toBe(skipped);
    }
  });

  it("highlights the inlet, the canal tool, the path, Run and the stars in turn", () => {
    const at = (step: number) => highlightFor({ status: "active", step });
    expect(at(1)).toMatchObject({ inlet: true, houses: false });
    expect(at(2)).toMatchObject({ canalTool: true, inlet: false });
    expect(at(3)).toMatchObject({ inlet: true, houses: true });
    expect(at(4)).toMatchObject({ runButton: true });
    expect(at(5)).toMatchObject({ resultStars: true });
    expect(Object.values(highlightFor({ status: "done", step: 5 }))).not.toContain(true);
  });

  it("recognises a canal chain from the river to a cell beside the cottage", () => {
    const v01 = getMap("v01");
    expect(canalConnected(v01, [])).toBe(false);
    expect(canalConnected(v01, v01.reference ?? [])).toBe(true);
    const reference = v01.reference ?? [];
    expect(canalConnected(v01, reference.slice(0, 1))).toBe(false);
    expect(canalConnected(v01, reference.slice(0, 2))).toBe(true);
    const gap = reference.filter((_, index) => index === 0 || index >= 4);
    expect(canalConnected(v01, gap)).toBe(false);
    expect(
      canalConnected(
        v01,
        (v01.reference ?? []).filter((p) => p.kind !== "canal"),
      ),
    ).toBe(false);
  });
});

describe("mechanic card logic", () => {
  it("has seven cards, each on its own map", () => {
    expect(MECHANIC_CARDS).toHaveLength(7);
    expect(new Set(MECHANIC_CARDS.map((card) => card.mapId)).size).toBe(7);
    expect(MECHANIC_CARDS.map((card) => card.mapId)).toEqual([
      "v01",
      "v03",
      "v04",
      "v06",
      "d01",
      "h01",
      "e01",
    ]);
  });

  it("finds the pending card only on its map and only until its flag is set", () => {
    for (const card of MECHANIC_CARDS) {
      expect(pendingCard({}, card.mapId)).toBe(card);
      expect(pendingCard({ [cardFlag(card.id)]: true }, card.mapId)).toBeNull();
    }
    expect(pendingCard({}, "v02")).toBeNull();
    expect(pendingCard({}, undefined)).toBeNull();
  });
});

let rig: Rig | null = null;

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
});

afterEach(() => {
  rig?.unmount();
  rig = null;
  document.body.replaceChildren();
  vi.useRealTimers();
});

const root = () => rig?.container as HTMLElement;
const dialog = () => root().querySelector("[role='dialog']");
const coach = () => root().querySelector("[data-testid='coachmark']");

async function open(mapId: string, profile: Partial<Profile> = { flags: {} }): Promise<Rig> {
  rig = await mountApp({ route: ["board", { mapId }], profile });
  return rig;
}

function allStarsExcept(mapId: string): Record<string, 1 | 2 | 3> {
  return starsFor(MAPS.map((map) => map.id).filter((id) => id !== mapId));
}

describe("v01 guided tutorial", () => {
  it("shows the canal card first and no coachmark until it is dismissed", async () => {
    await open("v01");
    expect(dialog()?.textContent).toContain("Dig a canal");
    expect(text(q(root(), "[data-testid='mechanic-card']"))).toBe(MECHANIC_CARDS[0]?.text);
    expect(coach()).toBeNull();
    await click(buttonByText(root(), "Got it"));
    expect(dialog()).toBeNull();
    expect(coach()?.getAttribute("data-step")).toBe("1");
    expect(text(coach() as Element)).toContain("This is the river.");
  });

  it("walks the five steps by the real actions and saves the flag at the end", async () => {
    await open("v01");
    const app = (rig as Rig).app;
    await click(buttonByText(root(), "Got it"));
    await (rig as Rig).flush();
    expect(app.game.getState().profile.flags[cardFlag("canal")]).toBe(true);

    expect(root().querySelectorAll("[data-testid='tutorial-ring']")).toHaveLength(1);
    await click(buttonByText(root(), "Got it"));
    expect(coach()?.getAttribute("data-step")).toBe("2");
    expect(root().querySelector("[data-tool='canal']")?.getAttribute("data-highlight")).toBe(
      "true",
    );

    await click(q(root(), "[data-tool='canal']"));
    expect(coach()?.getAttribute("data-step")).toBe("3");
    expect(root().querySelectorAll("[data-testid='tutorial-ring']")).toHaveLength(2);

    const pilot = new Pilot(rig as Rig, "v01");
    const reference = getMap("v01").reference ?? [];
    await pilot.placeAll(reference.slice(0, 1));
    expect(coach()?.getAttribute("data-step")).toBe("3");
    await pilot.placeAll(reference.slice(1, 2));
    expect(coach()?.getAttribute("data-step")).toBe("4");
    await pilot.placeAll(reference.slice(2));
    expect(coach()?.getAttribute("data-step")).toBe("4");
    expect(root().querySelector(".fd-run")?.className).toContain("fd-hl");

    await click(q(root(), ".fd-run"));
    expect(coach()).toBeNull();
    await playUntilResult(rig as Rig);
    const note = q(root(), "[data-testid='coach-result']");
    expect(text(note)).toContain("Stars: supply, dry feet, thrift.");
    expect(app.game.getState().profile.flags[TUTORIAL_FLAG]).toBeUndefined();

    await clickByText(rig as Rig, "Got it");
    await (rig as Rig).flush();
    expect(root().querySelector("[data-testid='coach-result']")).toBeNull();
    expect(app.game.getState().profile.flags[TUTORIAL_FLAG]).toBe(true);
  });

  it("never repeats once it has been completed", async () => {
    await open("v01");
    await click(buttonByText(root(), "Got it"));
    await click(buttonByText(root(), "Skip tutorial"));
    await (rig as Rig).flush();
    const flags = (rig as Rig).app.game.getState().profile.flags;
    expect(flags[TUTORIAL_FLAG]).toBe(true);
    expect(coach()).toBeNull();
    (rig as Rig).unmount();
    await open("v01", { flags });
    expect(dialog()).toBeNull();
    expect(coach()).toBeNull();
  });

  it("is skippable while the card is not in the way and leaves planning usable", async () => {
    await open("v01");
    await click(buttonByText(root(), "Got it"));
    await click(buttonByText(root(), "Skip tutorial"));
    expect(coach()).toBeNull();
    expect(root().querySelector("[data-testid='tutorial-ring']")).toBeNull();
    expect(root().querySelector(".fd-run")?.className).not.toContain("fd-hl");
  });

  it("does not run on any other map", async () => {
    await open("v02", { flags: {}, stars: { v01: 1 } });
    expect(coach()).toBeNull();
    expect(dialog()).toBeNull();
  });
});

describe("mechanic cards", () => {
  for (const card of MECHANIC_CARDS) {
    it(`shows "${card.title}" once, on ${card.mapId} only`, async () => {
      await open(card.mapId, {
        flags: { [TUTORIAL_FLAG]: true },
        stars: allStarsExcept(card.mapId),
      });
      expect(dialog()?.textContent).toContain(card.title);
      expect(text(q(root(), "[data-testid='mechanic-card']"))).toBe(card.text);
      expect(root().querySelector(".fd-tray")).not.toBeNull();
      await click(buttonByText(root(), "Got it"));
      await (rig as Rig).flush();
      expect(dialog()).toBeNull();
      const flags = (rig as Rig).app.game.getState().profile.flags;
      expect(flags[cardFlag(card.id)]).toBe(true);
      expect(Object.keys(flags).filter((name) => name.startsWith("card-"))).toEqual([
        cardFlag(card.id),
      ]);
      (rig as Rig).unmount();
      await open(card.mapId, { flags, stars: allStarsExcept(card.mapId) });
      expect(dialog()).toBeNull();
    });
  }

  it("shows no card on maps without one", async () => {
    await open("v02", { flags: { [TUTORIAL_FLAG]: true }, stars: { v01: 3 } });
    expect(dialog()).toBeNull();
    (rig as Rig).unmount();
    await open("d02", { flags: { [TUTORIAL_FLAG]: true }, stars: allStarsExcept("d02") });
    expect(dialog()).toBeNull();
  });

  it("shows none on the daily map", async () => {
    rig = await mountApp({ route: ["board", { daily: true }], profile: { flags: {} } });
    await act(async () => {
      vi.advanceTimersByTime(5);
    });
    await (rig as Rig).flush();
    expect(root().querySelector(".fd-tray")).not.toBeNull();
    expect(dialog()).toBeNull();
    expect(coach()).toBeNull();
  });
});
