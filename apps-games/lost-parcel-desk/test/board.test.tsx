import { getCase } from "@web-games/lost-parcel-desk-core";
import { afterEach, describe, expect, it } from "vitest";
import {
  buttonByText,
  buttonStarting,
  click,
  GAME_CSS,
  mountApp,
  progress,
  q,
  qa,
  type Rig,
  tap,
  text,
} from "./helpers";

let rig: Rig | null = null;

afterEach(() => {
  rig?.unmount();
  rig = null;
  document.body.replaceChildren();
});

async function boardWithClues(options: Parameters<typeof mountApp>[0] = {}): Promise<Rig> {
  const r = await mountApp({ route: ["board", { caseId: "01" }], ...options });
  await r.flush();
  const game = r.app.game;
  await game.inspect("01-3");
  await game.inspect("01-2");
  await game.zoom("01-c1");
  await game.pin("01-c1");
  await game.pin("01-c2");
  await r.flush();
  return r;
}

const chip = (r: Rig, id: string) => q(r.container, `.lp-pinned [data-clue='${id}']`);
const card = (r: Rig, id: string) => q(r.container, `[data-card='${id}']`);

describe("pinned clues and the link menu", () => {
  it("starts the case from the route and lists what is pinned", async () => {
    rig = await boardWithClues();
    expect(qa(rig.container, ".lp-pinned .lp-chip")).toHaveLength(2);
    expect(qa(rig.container, ".lp-pcard")).toHaveLength(3);
    expect(text(q(rig.container, ".lp-subnote"))).toBe(
      "Tap a pinned clue, then tap a person to link it.",
    );
  });

  it("selects a clue, then opens the link menu from a card", async () => {
    rig = await boardWithClues();
    await click(chip(rig, "01-c1"));
    expect(chip(rig, "01-c1").getAttribute("aria-pressed")).toBe("true");
    expect(text(card(rig, "p01"))).toContain("Tap to link the clue here");
    await click(card(rig, "p01"));
    await rig.flush();
    const menu = q(rig.container, "[data-testid='link-menu']");
    expect(text(q(rig.container, "[role='dialog']"))).toContain(
      "Link copper hair strand in the wool to Odalie Fenn",
    );
    expect(qa(menu, "button").map((b) => text(b))).toEqual(["Fits", "Rules out", "Remove link"]);
    expect(qa<HTMLButtonElement>(menu, "button")[2]?.disabled).toBe(true);
  });

  it("links as fits and as rules out with words and icons, and removes a link", async () => {
    rig = await boardWithClues();
    const c = rig.container;
    await click(chip(rig, "01-c1"));
    await click(card(rig, "p01"));
    await tap(rig, "Fits");
    expect(c.querySelector("[role='dialog']")).toBeNull();
    const fits = q(c, "[data-person='p01'] [data-link='fits']");
    expect(text(fits)).toContain("Fits");
    expect(fits.querySelector("[data-icon='tick']")).not.toBeNull();
    expect(chip(rig, "01-c1").getAttribute("data-state")).toBe("linked");
    expect(text(q(c, "[data-testid='board-live']"))).toContain("Odalie: 1 clue fits, 0 rule out.");

    await click(chip(rig, "01-c1"));
    await click(card(rig, "p12"));
    await tap(rig, "Rules out");
    const out = q(c, "[data-person='p12'] [data-link='rules-out']");
    expect(text(out)).toContain("Rules out");
    expect(out.querySelector("[data-icon='cross']")).not.toBeNull();
    expect(text(q(c, "[data-testid='summary-p12']"))).toBe("0 fit, 1 rule out");

    await click(chip(rig, "01-c1"));
    await click(card(rig, "p12"));
    await tap(rig, "Remove link");
    expect(c.querySelector("[data-person='p12'] [data-link]")).toBeNull();
    expect(text(q(c, "[data-testid='summary-p12']"))).toBe("0 fit, 0 rule out");
  });

  it("changes a link from fits to rules out on the same card", async () => {
    rig = await boardWithClues();
    await click(chip(rig, "01-c2"));
    await click(card(rig, "p10"));
    await tap(rig, "Fits");
    await click(chip(rig, "01-c2"));
    await click(card(rig, "p10"));
    await tap(rig, "Rules out");
    expect(rig.app.game.getState().active?.state.links).toEqual([
      { clueId: "01-c2", personId: "p10", kind: "rules-out" },
    ]);
  });

  it("unpins a clue and drops its links", async () => {
    rig = await boardWithClues();
    await click(chip(rig, "01-c2"));
    await click(card(rig, "p01"));
    await tap(rig, "Fits");
    await rig.app.game.unpin("01-c2");
    await rig.flush();
    expect(qa(rig.container, ".lp-pinned .lp-chip")).toHaveLength(1);
    expect(rig.container.querySelector("[data-link]")).toBeNull();
  });

  it("asks for a clue when only a card is chosen and the link key is pressed", async () => {
    rig = await boardWithClues();
    await click(card(rig, "p01"));
    expect(rig.container.querySelector("[role='dialog']")).toBeNull();
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "l", bubbles: true }));
    await rig.flush();
    expect(text(q(rig.container, "[data-testid='board-notice']"))).toBe(
      "Select a pinned clue first.",
    );
  });
});

describe("hints", () => {
  it("shows the price and the postage left, then pins the clues and draws the links", async () => {
    rig = await mountApp({ route: ["board", { caseId: "01" }] });
    await rig.flush();
    const c = rig.container;
    await tap(rig, "Hint");
    expect(text(q(c, "[data-testid='hint-price']"))).toBe("Price: 20 postage. You have 30.");
    expect(text(q(c, "[role='dialog']"))).toContain("Hints left on this case: 2");
    await tap(rig, "Buy for 20");
    const state = rig.app.game.getState();
    expect(state.profile.postage).toBe(10);
    expect(state.active?.state.hintsUsed).toBe(1);
    expect(state.active?.state.pinnedClueIds).toEqual(["01-c1"]);
    expect(state.active?.state.links).toHaveLength(3);
    expect(text(q(c, "[data-testid='hint-note']"))).toContain("The owner's look is red hair.");
    expect(qa(c, "[data-person='p01'] [data-link='fits']")).toHaveLength(1);
    expect(qa(c, "[data-person='p12'] [data-link='rules-out']")).toHaveLength(1);
    expect(qa(c, "[data-link]")).toHaveLength(3);
    expect(text(q(c, "[data-testid='board-live']"))).toContain("Odalie: 1 clue fits");
  });

  it("will not sell a hint without enough postage", async () => {
    rig = await mountApp({ route: ["board", { caseId: "01" }], profile: { postage: 5 } });
    await rig.flush();
    await tap(rig, "Hint");
    expect(text(q(rig.container, "[role='alert']"))).toBe("You need 15 more postage.");
    expect(buttonStarting(rig.container, "Buy for").disabled).toBe(true);
    expect(rig.app.game.getState().profile.postage).toBe(5);
  });

  it("costs 15 on the daily parcel", async () => {
    rig = await mountApp({ route: ["board", { daily: true }] });
    await rig.flush();
    await tap(rig, "Hint");
    expect(text(q(rig.container, "[data-testid='hint-price']"))).toBe(
      "Price: 15 postage. You have 30.",
    );
  });

  it("is available from the evidence table too", async () => {
    rig = await mountApp({ route: ["table", { caseId: "01" }] });
    await rig.flush();
    await tap(rig, "Hint");
    await tap(rig, "Buy for 20");
    expect(rig.app.game.getState().active?.state.pinnedClueIds).toEqual(["01-c1"]);
  });
});

describe("key-and-lock pairs", () => {
  it("brackets a pair on a card once both clues are linked the same way", async () => {
    const def = getCase("05");
    const pair = def?.deductions.find((deduction) => deduction.kind === "pair");
    if (!def || !pair) throw new Error("case 05 has no pair");
    rig = await mountApp({
      route: ["board", { caseId: "05" }],
      profile: progress(["01", "02", "03", "04"], 2),
    });
    await rig.flush();
    const game = rig.app.game;
    for (const clueId of pair.clueIds) {
      const clue = def.clues.find((item) => item.id === clueId);
      if (!clue) throw new Error("clue");
      await game.inspect(clue.objectId);
      if (clue.face === "back") await game.flip(clue.objectId);
      if (clue.face === "zoom") await game.zoom(clue.id);
      await game.pin(clue.id);
    }
    await rig.flush();
    const owner = def.ownerId;
    const [first, second] = pair.clueIds as [string, string];
    await click(chip(rig, first));
    await click(card(rig, owner));
    await tap(rig, "Fits");
    expect(rig.container.querySelector("[data-bracket]")).toBeNull();
    await click(chip(rig, second));
    await click(card(rig, owner));
    await tap(rig, "Fits");
    const bracket = q(rig.container, `[data-person='${owner}'] [data-bracket]`);
    expect(text(bracket)).toContain("Key and lock pair");
    expect(qa(rig.container, "[data-bracket]")).toHaveLength(1);
  });
});

describe("high contrast", () => {
  it("changes the card classes and ships thicker outlines and a hatch pattern", async () => {
    rig = await boardWithClues({ settings: { highContrast: false } });
    expect(rig.container.querySelector(".lp-pcard--hc")).toBeNull();
    expect(rig.container.querySelector(".lp-paper--hc")).toBeNull();
    rig.unmount();
    rig = await boardWithClues({ settings: { highContrast: true } });
    expect(qa(rig.container, ".lp-pcard--hc")).toHaveLength(3);
    await click(chip(rig, "01-c1"));
    await click(card(rig, "p01"));
    await tap(rig, "Fits");
    expect(GAME_CSS).toMatch(/\.lp-pcard--hc \{\s*border-width: 4px;/);
    expect(GAME_CSS).toMatch(/\.lp-pcard--hc\.lp-pcard--linked \{[^}]*repeating-linear-gradient/);
    expect(q(rig.container, "[data-person='p01']").className).toContain("lp-pcard--linked");
  });
});

describe("pause and leaving", () => {
  it("pauses the clock, opens settings and leaves the case after a confirmation", async () => {
    rig = await mountApp({ route: ["table", { caseId: "01" }] });
    await rig.flush();
    await tap(rig, "Pause");
    expect(text(q(rig.container, "[role='dialog']"))).toContain("Paused");
    rig.app.game.tick(1000);
    await tap(rig, "Resume");
    expect(rig.container.querySelector("[role='dialog']")).toBeNull();
    await tap(rig, "Pause");
    await tap(rig, "Leave the case");
    expect(text(q(rig.container, "[role='dialog']"))).toContain("Leave this case?");
    await tap(rig, "Cancel");
    await tap(rig, "Pause");
    await tap(rig, "Leave the case");
    await tap(rig, "Leave");
    expect(rig.app.router.current.name).toBe("home");
    expect(rig.app.game.getState().active).toBeNull();
    expect(rig.app.game.getState().profile.session?.id).toBe("01");
    expect(buttonByText(rig.container, "Continue case 01")).toBeTruthy();
  });
});
