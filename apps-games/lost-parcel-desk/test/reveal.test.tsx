import { CASES, getCase } from "@web-games/lost-parcel-desk-core";
import { act } from "preact/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TYPEWRITER_MS_PER_CHAR } from "../src/motion/timing";
import { linkCanonical, openEverything } from "./fixtures/game";
import { click, mountApp, progress, q, qa, type Rig, tap, tapStarting, text } from "./helpers";

let rig: Rig | null = null;

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval"] });
});

afterEach(() => {
  rig?.unmount();
  rig = null;
  document.body.replaceChildren();
  vi.useRealTimers();
});

async function finishByTaps(r: Rig, caseId: string): Promise<void> {
  await r.flush();
  await openEverything(r.app.game);
  await linkCanonical(r.app.game);
  await r.flush();
  const owner = getCase(caseId)?.ownerId ?? "";
  await click(q(r.container, `[data-card='${owner}']`));
  await tapStarting(r, "Accuse ");
  await tap(r, "Accuse");
}

describe("reveal motion", () => {
  it("shows the typed text at once and drops no stamp when motion is reduced", async () => {
    rig = await mountApp({ route: ["board", { caseId: "01" }], reducedMotion: true });
    await finishByTaps(rig, "01");
    const typed = q(rig.container, "[data-testid='typewriter']");
    expect(typed.getAttribute("data-complete")).toBe("true");
    expect(text(q(typed, "[aria-hidden='true']"))).toBe(getCase("01")?.reveal);
    expect(rig.container.querySelector(".lp-rstamp--fall")).toBeNull();
  });

  it("types the reveal out and drops the stamp when motion is allowed", async () => {
    rig = await mountApp({ route: ["board", { caseId: "01" }], reducedMotion: false });
    await finishByTaps(rig, "01");
    const typed = () => q(rig?.container as HTMLElement, "[data-testid='typewriter']");
    expect(typed().getAttribute("data-complete")).toBe("false");
    expect(text(q(typed(), "[aria-hidden='true']")).length).toBeLessThan(
      (getCase("01")?.reveal.length ?? 0) / 2,
    );
    expect(q(rig.container, "[data-testid='typewriter-full']").textContent).toBe(
      getCase("01")?.reveal,
    );
    expect(rig.container.querySelector(".lp-rstamp--fall")).not.toBeNull();
    await act(() => {
      vi.advanceTimersByTime(TYPEWRITER_MS_PER_CHAR * (getCase("01")?.reveal.length ?? 0) + 100);
    });
    expect(typed().getAttribute("data-complete")).toBe("true");
    expect(text(q(typed(), "[aria-hidden='true']"))).toBe(getCase("01")?.reveal);
  });

  it("follows the in-app reduced motion switch even when the system allows motion", async () => {
    rig = await mountApp({
      route: ["board", { caseId: "01" }],
      reducedMotion: false,
      settings: { reducedMotion: true },
    });
    await finishByTaps(rig, "01");
    expect(q(rig.container, "[data-testid='typewriter']").getAttribute("data-complete")).toBe(
      "true",
    );
    expect(rig.container.querySelector(".lp-rstamp--fall")).toBeNull();
  });
});

describe("what a closed case pays", () => {
  it("shows the chapter outro, the bonus and the chapter that opens after case 04", async () => {
    rig = await mountApp({
      route: ["board", { caseId: "04" }],
      profile: progress(["01", "02", "03"], 2),
    });
    await finishByTaps(rig, "04");
    expect(rig.app.router.current.name).toBe("reveal");
    const dialog = q(rig.container, "[role='dialog']");
    expect(text(dialog)).toContain("Chapter 1 complete: The Spring Backlog");
    expect(text(q(dialog, "[data-testid='chapter-text']"))).toContain("Four parcels home");
    const gains = text(q(rig.container, "[data-testid='gains']"));
    expect(gains).toContain("Chapter bonus: 40 postage");
    expect(gains).toContain("Chapter 2 is open");
    expect(gains).toContain("Postage earned: 65");
    await tap(rig, "Carry on");
    expect(rig.container.querySelector("[role='dialog']")).toBeNull();
    expect(rig.app.game.getState().profile.flags["chapter-1-outro"]).toBe(true);
    expect(rig.app.game.getState().profile.postage).toBe(30 + 25 + 40);
  });

  it("announces a new desk theme when the stamps cross a threshold", async () => {
    rig = await mountApp({
      route: ["board", { caseId: "03" }],
      profile: progress(["01", "02"], 2),
    });
    await finishByTaps(rig, "03");
    expect(text(q(rig.container, "[data-testid='gains']"))).toContain(
      "New desk theme: Teal Blotter",
    );
    expect(rig.container.querySelector("[role='dialog']")).toBeNull();
  });

  it("offers the next case only when it is open and a way home otherwise", async () => {
    rig = await mountApp({
      route: ["board", { caseId: "04" }],
      profile: progress(["01", "02", "03"], 1),
    });
    await finishByTaps(rig, "04");
    await tap(rig, "Carry on");
    expect(
      qa(rig.container, "button").some((b) => (b.textContent ?? "").trim() === "Next case"),
    ).toBe(false);
    expect(
      qa(rig.container, "button").some((b) => (b.textContent ?? "").trim() === "Back to the desk"),
    ).toBe(true);
  });

  it("derives a reveal from the profile when the closed case is no longer in memory", async () => {
    rig = await mountApp({
      route: ["reveal", { caseId: "02" }],
      profile: progress(["01", "02"], 2),
    });
    await rig.flush();
    expect(text(q(rig.container, "[data-testid='stamps-text']"))).toBe("2 of 3 stamps");
    expect(text(q(rig.container, "[data-testid='typewriter-full']"))).toBe(getCase("02")?.reveal);
    expect(rig.container.querySelector("[data-testid='gains']")).toBeNull();
  });

  it("holds an authored reveal, ledger fragment and place for each of the 12 cases", () => {
    expect(CASES).toHaveLength(12);
    for (const item of CASES) {
      expect(item.reveal.length, item.id).toBeGreaterThan(100);
      expect(item.place.length, item.id).toBeGreaterThan(0);
    }
  });
});
