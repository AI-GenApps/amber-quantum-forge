import { getCase } from "@web-games/lost-parcel-desk-core";
import { afterEach, describe, expect, it } from "vitest";
import {
  buttonByText,
  buttonStarting,
  click,
  mountApp,
  progress,
  q,
  qa,
  type Rig,
  tap,
  tapStarting,
  text,
} from "./helpers";

let rig: Rig | null = null;

afterEach(() => {
  rig?.unmount();
  rig = null;
  document.body.replaceChildren();
});

const CHAPTERS = {
  "chapter-1-intro": true,
  "chapter-2-intro": true,
  "chapter-3-intro": true,
} as const;
const CARDS_SEEN = {
  "card-look-closer": true,
  "card-the-board": true,
  "card-key-and-lock": true,
  "card-rule-outs": true,
} as const;

const coach = (r: Rig): HTMLElement | null =>
  r.container.querySelector<HTMLElement>("[data-testid='coachmark']");
const step = (r: Rig): string | null => coach(r)?.getAttribute("data-step") ?? null;
const flags = (r: Rig) => r.app.game.getState().profile.flags;

async function linkFits(r: Rig, clueId: string, personId: string): Promise<void> {
  await click(q(r.container, `.lp-pinned [data-clue='${clueId}']`));
  await click(q(r.container, `[data-card='${personId}']`));
  await r.flush();
  await tap(r, "Fits");
}

describe("case 01 tutorial", () => {
  it("is advanced by the real actions, step by step, and then never repeats", async () => {
    rig = await mountApp({
      route: ["intro", { caseId: "01" }],
      profile: { flags: { ...CHAPTERS, ...CARDS_SEEN } },
    });
    const c = rig.container;
    expect(step(rig)).toBe("1");
    expect(text(q(c, "[data-testid='coach-text']"))).toBe("Tap the parcel to open it.");
    expect(text(q(c, "[data-testid='coachmark']"))).toContain("Step 1 of 6");
    expect(q(c, ".wg-btn.lp-coach-target").textContent).toContain("Open parcel");

    await tap(rig, "Open parcel");
    expect(rig.app.router.current.name).toBe("table");
    expect(step(rig)).toBe("2");
    expect(q(c, "[data-object='01-2']").classList.contains("lp-coach-target")).toBe(true);

    await click(q(c, "[data-object='01-1']"));
    await rig.flush();
    expect(step(rig)).toBe("2");
    await rig.app.router.handleBack();
    await rig.flush();
    await click(q(c, "[data-object='01-2']"));
    await rig.flush();
    expect(step(rig)).toBe("3");
    expect(q(c, ".lp-magnifier").classList.contains("lp-coach-target")).toBe(true);

    await tap(rig, "Magnifier on");
    expect(step(rig)).toBe("3");
    await click(q(c, "[data-hotspot='01-c1']"));
    await rig.flush();
    expect(step(rig)).toBe("4");

    await tapStarting(rig, "Pin");
    expect(step(rig)).toBe("5");
    rig.app.router.handleBack();
    await rig.flush();
    await tap(rig, "Deduction board");
    expect(step(rig)).toBe("5");
    await linkFits(rig, "01-c1", "p01");
    expect(step(rig)).toBe("6");
    expect(q(c, ".lp-accuse").classList.contains("lp-coach-target")).toBe(true);

    expect(flags(rig)["tutorial-done"]).toBeUndefined();
    rig.app.router.handleBack();
    await rig.flush();
    await click(q(c, "[data-object='01-3']"));
    await rig.flush();
    await tapStarting(rig, "Pin");
    rig.app.router.handleBack();
    await rig.flush();
    await tap(rig, "Deduction board");
    expect(step(rig)).toBe("6");
    await linkFits(rig, "01-c2", "p01");
    expect(step(rig)).toBe("6");
    await click(q(c, "[data-card='p01']"));
    await tapStarting(rig, "Accuse");
    expect(step(rig)).toBe("6");
    expect(flags(rig)["tutorial-done"]).toBeUndefined();
    await tap(rig, "Accuse");
    expect(rig.app.router.current.name).toBe("reveal");
    await rig.flush();
    expect(flags(rig)["tutorial-done"]).toBe(true);
    expect(coach(rig)).toBeNull();
  });

  it("can be skipped, saves the flag and does not come back", async () => {
    rig = await mountApp({
      route: ["intro", { caseId: "01" }],
      profile: { flags: { ...CHAPTERS, ...CARDS_SEEN } },
    });
    expect(step(rig)).toBe("1");
    await tap(rig, "Skip tutorial");
    expect(coach(rig)).toBeNull();
    expect(flags(rig)["tutorial-done"]).toBe(true);
    await tap(rig, "Open parcel");
    await click(q(rig.container, "[data-object='01-2']"));
    await rig.flush();
    expect(coach(rig)).toBeNull();
    rig.unmount();

    rig = await mountApp({
      route: ["intro", { caseId: "01" }],
      profile: { flags: { ...CHAPTERS, ...CARDS_SEEN, "tutorial-done": true } },
    });
    expect(coach(rig)).toBeNull();
  });

  it("starts again after progress is erased", async () => {
    rig = await mountApp({
      route: ["settings"],
      profile: { flags: { ...CHAPTERS, ...CARDS_SEEN } },
    });
    await rig.app.game.markFlag("tutorial-done");
    await rig.flush();
    await tap(rig, "Reset progress");
    await tap(rig, "Erase everything");
    expect(rig.app.router.current.name).toBe("home");
    expect(flags(rig)["tutorial-done"]).toBeUndefined();
    rig.app.router.push("intro", { caseId: "01" });
    await rig.flush();
    expect(step(rig)).toBe("1");
  });

  it("does not show on other cases or after case 01 is delivered", async () => {
    rig = await mountApp({
      route: ["intro", { caseId: "02" }],
      profile: { ...progress(["01"]), flags: { ...CHAPTERS } },
    });
    expect(coach(rig)).toBeNull();
    rig.unmount();
    rig = await mountApp({
      route: ["intro", { caseId: "01" }],
      profile: { ...progress(["01"]), flags: { ...CHAPTERS, ...CARDS_SEEN } },
    });
    expect(coach(rig)).toBeNull();
    rig.unmount();
    rig = await mountApp({ route: ["home"], profile: { flags: { ...CHAPTERS } } });
    expect(coach(rig)).toBeNull();
  });
});

describe("mechanic cards", () => {
  it("show the two case 01 cards before the case starts, once", async () => {
    rig = await mountApp({
      route: ["intro", { caseId: "01" }],
      profile: { flags: { ...CHAPTERS, "tutorial-done": true } },
    });
    const c = rig.container;
    await tap(rig, "Open parcel");
    expect(rig.app.router.current.name).toBe("intro");
    expect(rig.app.game.getState().active).toBeNull();
    expect(text(q(c, "[role='dialog']"))).toContain("Look closer");
    expect(text(q(c, "[data-testid='card-text']"))).toBe(
      "Tap an object to pick it up. Turn it over to read the back, and use the magnifier to find small details.",
    );
    await tap(rig, "Got it");
    expect(flags(rig)["card-look-closer"]).toBe(true);
    expect(rig.app.router.current.name).toBe("intro");
    expect(text(q(c, "[role='dialog']"))).toContain("The deduction board");
    await tap(rig, "Got it");
    expect(flags(rig)["card-the-board"]).toBe(true);
    expect(rig.app.router.current.name).toBe("table");
    expect(rig.app.game.getState().active?.id).toBe("01");

    rig.app.router.replace("intro", { caseId: "01" });
    await rig.flush();
    await tap(rig, "Resume parcel");
    expect(rig.app.router.current.name).toBe("table");
    expect(qa(c, "[role='dialog']")).toHaveLength(0);
  });

  it("show Key and lock only on case 05 and Rule-outs only on case 06", async () => {
    const closed = progress(["01", "02", "03", "04", "05"]);
    rig = await mountApp({
      route: ["intro", { caseId: "05" }],
      profile: { ...closed, flags: { ...CHAPTERS, "tutorial-done": true } },
    });
    await tap(rig, "Open parcel");
    expect(text(q(rig.container, "[role='dialog']"))).toContain("Key and lock");
    expect(flags(rig)["card-rule-outs"]).toBeUndefined();
    await tap(rig, "Got it");
    expect(flags(rig)["card-key-and-lock"]).toBe(true);
    expect(rig.app.router.current.name).toBe("table");
    rig.unmount();

    rig = await mountApp({
      route: ["intro", { caseId: "06" }],
      profile: { ...closed, flags: { ...CHAPTERS, "tutorial-done": true } },
    });
    await tap(rig, "Open parcel");
    expect(text(q(rig.container, "[role='dialog']"))).toContain("Rule-outs");
    await tap(rig, "Got it");
    expect(flags(rig)["card-rule-outs"]).toBe(true);
    expect(rig.app.router.current.name).toBe("table");
  });

  it("do not appear on cases without one", async () => {
    rig = await mountApp({
      route: ["intro", { caseId: "02" }],
      profile: { ...progress(["01"]), flags: { ...CHAPTERS } },
    });
    await tap(rig, "Open parcel");
    expect(qa(rig.container, "[role='dialog']")).toHaveLength(0);
    expect(rig.app.router.current.name).toBe("table");
    expect(getCase("02")?.id).toBe("02");
    expect(buttonStarting(rig.container, "Deduction board")).toBeDefined();
    expect(buttonByText(rig.container, "Pause")).toBeDefined();
  });
});
