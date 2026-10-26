import {
  FREEZE_PRICE,
  HARMONY_WEIGHTS,
  HINT_PRICE,
  HOW_TO_PAGES,
  MAX_GALLERY,
  RULE_CARDS,
  THREE_STAR_HARMONY,
  TUTORIAL_STEPS,
} from "@web-games/dress-rehearsal-core";
import { afterEach, describe, expect, it, vi } from "vitest";
import { HOW_TO } from "../src/data/howto";
import { cardFlag, pendingCards } from "../src/onboarding/cards";
import {
  finishedTutorial,
  shouldRunTutorial,
  startTutorial,
  stepTutorial,
  type TutorialAction,
  type TutorialState,
  targetsFor,
} from "../src/onboarding/tutorial";
import { all, buttonByText, click, mountApp, q, RIVIERA_IDS, type Rig, text } from "./helpers";
import { openTab, RIV01_LOOK, settle, startBoard, tapPlace } from "./play";

let rig: Rig | null = null;

afterEach(() => {
  rig?.unmount();
  rig = null;
  document.body.replaceChildren();
  vi.restoreAllMocks();
});

const REAL_ACTIONS: TutorialAction[] = [
  { type: "client-seen" },
  { type: "tab-opened", tab: "top" },
  { type: "placed" },
  { type: "complete", complete: true },
  { type: "finish" },
];

describe("tutorial step machine", () => {
  it("has the five riv-01 steps and starts on the first", () => {
    expect(TUTORIAL_STEPS).toHaveLength(5);
    expect(startTutorial()).toEqual({ status: "active", step: 1 });
  });

  it("advances one step per real action, in order, and then finishes", () => {
    let state = startTutorial();
    for (const [index, action] of REAL_ACTIONS.entries()) {
      expect(state.step).toBe(index + 1);
      state = stepTutorial(state, action);
    }
    expect(state.status).toBe("done");
    expect(finishedTutorial(state)).toBe(true);
    expect(targetsFor(state)).toEqual([]);
  });

  it("ignores every action that is not the one the step waits for", () => {
    for (const [index, wanted] of REAL_ACTIONS.entries()) {
      const state: TutorialState = { status: "active", step: index + 1 };
      for (const action of [...REAL_ACTIONS, { type: "tab-opened", tab: "shoes" } as const]) {
        if (action.type === wanted.type && JSON.stringify(action) === JSON.stringify(wanted)) {
          continue;
        }
        expect(stepTutorial(state, action)).toBe(state);
      }
      expect(stepTutorial(state, { type: "complete", complete: false })).toBe(state);
    }
  });

  it("can be skipped from any step and then ignores everything", () => {
    for (let step = 1; step <= 5; step++) {
      const skipped = stepTutorial({ status: "active", step }, { type: "skip" });
      expect(skipped.status).toBe("skipped");
      expect(finishedTutorial(skipped)).toBe(true);
      expect(stepTutorial(skipped, REAL_ACTIONS[step - 1] as TutorialAction)).toBe(skipped);
    }
  });

  it("highlights the parts named by the step", () => {
    expect(targetsFor(startTutorial())).toEqual(["client-card", "rule-chip"]);
    expect(targetsFor({ status: "active", step: 5 })).toEqual(["finish-button"]);
  });

  it("runs only on riv-01 and only while the saved flag is unset", () => {
    expect(shouldRunTutorial({ tutorial: false }, "riv-01")).toBe(true);
    expect(shouldRunTutorial({ tutorial: true }, "riv-01")).toBe(false);
    expect(shouldRunTutorial({ tutorial: false }, "riv-02")).toBe(false);
    expect(shouldRunTutorial({ tutorial: false }, null)).toBe(false);
  });
});

describe("rule cards", () => {
  it("shows each card only on its own challenge, in table order", () => {
    expect(RULE_CARDS).toHaveLength(9);
    for (const card of RULE_CARDS) {
      const ids = pendingCards({}, card.shownOn).map((entry) => entry.id);
      expect(ids).toContain(card.id);
    }
    expect(pendingCards({}, "riv-01").map((c) => c.id)).toEqual(["brief", "warmth", "features"]);
    expect(pendingCards({}, "riv-02").map((c) => c.id)).toEqual(["colour-wheel", "budget"]);
    expect(pendingCards({}, "riv-04")).toEqual([]);
    expect(pendingCards({}, null)).toEqual([]);
  });

  it("drops cards that were seen", () => {
    const seen = { brief: true, warmth: true } as const;
    expect(pendingCards(seen, "riv-01").map((c) => c.id)).toEqual(["features"]);
    expect(cardFlag("brief")).toBe("card-brief");
  });
});

describe("onboarding on riv-01", () => {
  const coach = () => document.body.querySelector<HTMLElement>("[data-testid='coachmark']");
  const card = () => document.body.querySelector<HTMLElement>("[data-testid='rule-card']");

  async function openFresh(challengeId = "riv-01"): Promise<Rig> {
    rig = await mountApp({
      route: ["styling", { challengeId }],
      freshOnboarding: true,
      profile:
        challengeId === "riv-01"
          ? {}
          : { stars: Object.fromEntries(RIVIERA_IDS.map((id) => [id, 3])) },
    });
    return rig;
  }

  async function dismissCards(r: Rig): Promise<string[]> {
    const seen: string[] = [];
    while (card()?.dataset.card) {
      seen.push(card()?.dataset.card ?? "");
      await click(buttonByText(document.body, "Got it"));
      await r.flush();
    }
    return seen;
  }

  it("shows the three cards before the brief, then walks the five steps by real actions", async () => {
    const r = await openFresh();
    expect(document.body.querySelector("[data-testid='brief']")).toBeNull();
    expect(await dismissCards(r)).toEqual(["brief", "warmth", "features"]);
    expect(r.app.game.getState().profile.flags.ruleCards).toMatchObject({
      brief: true,
      warmth: true,
      features: true,
    });
    await startBoard();
    expect(coach()?.dataset.step).toBe("1");
    expect(text(coach() as HTMLElement)).toContain("Tutorial step 1 of 5");
    await click(buttonByText(coach() as HTMLElement, "Got it"));
    expect(coach()?.dataset.step).toBe("2");
    await tapPlace(r, RIV01_LOOK[0] as string);
    expect(coach()?.dataset.step).toBe("4");
    for (const id of RIV01_LOOK.slice(1)) await tapPlace(r, id);
    await settle(r);
    expect(coach()?.dataset.step).toBe("5");
    await click(buttonByText(r.container, "Finish look"));
    await settle(r);
    expect(coach()).toBeNull();
    expect(r.app.game.getState().profile.flags.tutorial).toBe(true);
  });

  it("does not advance step 2 on a different tab and does not skip ahead on placements", async () => {
    const r = await openFresh();
    await dismissCards(r);
    await startBoard();
    await click(buttonByText(coach() as HTMLElement, "Got it"));
    await openTab(r, "shoes");
    expect(coach()?.dataset.step).toBe("2");
    await openTab(r, "top");
    expect(coach()?.dataset.step).toBe("3");
  });

  it("can be skipped, is saved and never comes back", async () => {
    const r = await openFresh();
    await dismissCards(r);
    await startBoard();
    await click(buttonByText(coach() as HTMLElement, "Skip tutorial"));
    expect(coach()).toBeNull();
    await r.flush();
    expect(r.app.game.getState().profile.flags.tutorial).toBe(true);
    r.unmount();
    rig = await mountApp({
      route: ["styling", { challengeId: "riv-01" }],
      profile: r.app.game.getState().profile,
    });
    expect(card()).toBeNull();
    await startBoard();
    expect(coach()).toBeNull();
  });

  it("shows the colour-wheel and budget cards once, on riv-02 only", async () => {
    const r = await openFresh("riv-02");
    expect(await dismissCards(r)).toEqual(["colour-wheel", "budget"]);
    expect(coach()).toBeNull();
    await startBoard();
    expect(coach()).toBeNull();
    r.unmount();
    rig = await mountApp({
      route: ["styling", { challengeId: "riv-02" }],
      profile: r.app.game.getState().profile,
    });
    expect(card()).toBeNull();
    expect(q(document.body, "[data-testid='brief']")).toBeTruthy();
  });

  it("shows no tutorial and no cards on a later challenge", async () => {
    await openFresh("riv-04");
    expect(card()).toBeNull();
    await startBoard();
    expect(coach()).toBeNull();
  });
});

describe("how to play", () => {
  it("has the six pages with real numbers from the core constants", () => {
    expect(HOW_TO).toHaveLength(6);
    expect(HOW_TO.map((page) => page.id)).toEqual(HOW_TO_PAGES.map((page) => page.id));
    for (const page of HOW_TO) expect(page.paragraphs.length).toBeGreaterThan(0);
    const body = (id: string): string =>
      HOW_TO.find((page) => page.id === id)?.paragraphs.join(" ") ?? "";
    const harmony = body("harmony");
    for (const weight of Object.values(HARMONY_WEIGHTS)) expect(harmony).toContain(String(weight));
    expect(HARMONY_WEIGHTS).toMatchObject({ scheme: 40, anchor: 10 });
    expect(body("stars")).toContain(`harmony of ${THREE_STAR_HARMONY}`);
    expect(THREE_STAR_HARMONY).toBe(70);
    expect(body("stars")).toContain(`${HINT_PRICE.campaign} coins`);
    expect(body("stars")).toContain(`${HINT_PRICE.daily}`);
    expect(body("daily-gallery")).toContain(`${FREEZE_PRICE} coins`);
    expect(body("daily-gallery")).toContain(String(MAX_GALLERY));
    expect([HINT_PRICE.campaign, HINT_PRICE.daily, FREEZE_PRICE, MAX_GALLERY]).toEqual([
      20, 30, 25, 24,
    ]);
  });

  it("renders each page on the screen and marks the saved flag", async () => {
    rig = await mountApp({ route: ["howto"], freshOnboarding: true });
    await rig.flush();
    expect(rig.app.game.getState().profile.flags.howTo).toBe(true);
    const titles: string[] = [];
    for (let i = 0; i < HOW_TO.length; i++) {
      titles.push(text(q(rig.container, "h2.dr-panel__title")));
      const next = all(rig.container, "button").find(
        (b) => (b.textContent ?? "").trim() === "Next",
      );
      if (next && i < HOW_TO.length - 1) await click(next);
    }
    expect(titles).toEqual(HOW_TO.map((page) => page.title));
    expect(text(rig.container)).toContain(HOW_TO.at(-1)?.paragraphs[0]?.slice(0, 20) ?? "?");
  });
});

describe("reduced motion on the styling board", () => {
  it("reaches the result without calling animate", async () => {
    const animate = vi.fn();
    Object.defineProperty(HTMLElement.prototype, "animate", { value: animate, configurable: true });
    try {
      rig = await mountApp({
        route: ["styling", { challengeId: "riv-01" }],
        settings: { reducedMotion: true },
      });
      await startBoard();
      for (const id of RIV01_LOOK) await tapPlace(rig, id);
      await click(buttonByText(rig.container, "Finish look"));
      await settle(rig);
      expect(all(document.body, ".wg-star--on")).toHaveLength(3);
      expect(animate).not.toHaveBeenCalled();
    } finally {
      Reflect.deleteProperty(HTMLElement.prototype, "animate");
    }
  });
});
