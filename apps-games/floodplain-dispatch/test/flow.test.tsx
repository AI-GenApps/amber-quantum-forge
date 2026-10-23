import { dailySeedOf, getMap, shareText } from "@web-games/floodplain-dispatch-core";
import { act } from "preact/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { dailyPuzzle } from "../src/state/dailyInfo";
import { buttonByText, mountApp, press, q, type Rig, starsFor, text, VALLEY_IDS } from "./helpers";
import { clickByText, Pilot, playUntilResult, tick } from "./pilot";

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

const v01 = getMap("v01");
const root = () => rig?.container as HTMLElement;
const scrub = () => q<HTMLInputElement>(root(), ".fd-scrub");
const week = () => text(q(root(), "[data-testid='week-counter']"));

async function open(options: Parameters<typeof mountApp>[0] = {}): Promise<Pilot> {
  rig = await mountApp({ route: ["board", { mapId: "v01" }], ...options });
  return new Pilot(rig, "v01");
}

async function runPerfect(options: Parameters<typeof mountApp>[0] = {}): Promise<Pilot> {
  const pilot = await open(options);
  await pilot.placeAll(v01.reference);
  await press(pilot.host, " ");
  return pilot;
}

describe("a full campaign map by keyboard", () => {
  it("plans v01, runs it, reads the result and records the stars", async () => {
    const pilot = await runPerfect();
    expect(week()).toBe("Week 1 of 20");
    expect(root().querySelector(".fd-tray")).toBeNull();
    await playUntilResult(rig as Rig);
    const result = q(root(), "[data-testid='result']");
    expect(q(root(), "[role='dialog'] h2").textContent).toBe("Dry feet, full barns.");
    expect(result.querySelector("[role='img']")?.getAttribute("aria-label")).toBe("3 of 3 stars");
    expect(text(q(result, "[data-testid='result-score']"))).toBe("Score 410");
    expect(text(result)).toContain("Spent 6, par 6, budget 9");
    expect(text(result)).toContain("1 of 1 houses supplied");
    expect(text(result)).toContain("No houses flooded");
    expect(result.querySelectorAll(".fd-goal--met")).toHaveLength(3);
    expect(text(result)).toContain("1 of 1 fields irrigated");
    await rig?.flush();
    expect(text(result)).toContain("Plus 25 coins");
    const profile = rig?.app.game.getState().profile;
    expect(profile?.stars.v01).toBe(3);
    expect(profile?.coins).toBe(75);
    expect(profile?.best.v01).toMatchObject({ stars: 3, spend: 6 });
    expect(profile?.history.at(-1)).toMatchObject({ kind: "campaign", id: "v01", stars: 3 });
    expect(pilot.live()).toContain("Houses supplied 1, flooded 0. Fields irrigated 1.");
  });

  it("opens the next map from the result sheet", async () => {
    await runPerfect();
    await playUntilResult(rig as Rig);
    await clickByText(rig as Rig, "Next map");
    expect(rig?.app.router.current).toMatchObject({ name: "board", params: { mapId: "v02" } });
    await rig?.flush();
    expect(q(root(), ".wg-screen h1").textContent).toBe("2. Two Fields Over");
  });

  it("shares the campaign line through the kit share function", async () => {
    await runPerfect();
    await playUntilResult(rig as Rig);
    await clickByText(rig as Rig, "Share");
    await rig?.flush();
    expect(rig?.shared).toHaveLength(1);
    expect(rig?.shared[0]?.text).toBe(
      shareText("campaign", { mapId: "v01", stars: 3, flooded: 0, spend: 6, budget: 9 }),
    );
    expect(rig?.shared[0]?.text).toBe(
      'Floodplain Dispatch - Valley 1 "First Trickle": 3/3 stars, 0 flooded, spent 6 of 9.',
    );
    expect(text(root())).toContain("Copied or shared");
  });

  it("says when sharing is unavailable", async () => {
    await runPerfect({ shareResult: { path: "unavailable", ok: false, cancelled: false } });
    await playUntilResult(rig as Rig);
    await clickByText(rig as Rig, "Share");
    await rig?.flush();
    expect(text(root())).toContain("Sharing is not available here");
  });

  it("keeps the plan on Edit and clears it on Retry", async () => {
    const pilot = await runPerfect();
    await playUntilResult(rig as Rig);
    await clickByText(rig as Rig, "Edit plan");
    expect(rig?.container.querySelector("[role='dialog']")).toBeNull();
    expect(pilot.budgetLeft()).toBe("3 of 9 left");
    await press(pilot.host, " ");
    await playUntilResult(rig as Rig);
    await clickByText(rig as Rig, "Retry");
    expect(pilot.budgetLeft()).toBe("9 of 9 left");
    expect(root().querySelector(".fd-tray")).not.toBeNull();
  });

  it("reports a failed season without stars and hides Next", async () => {
    const pilot = await open();
    await press(pilot.host, " ");
    await playUntilResult(rig as Rig);
    expect(q(root(), "[role='dialog'] h2").textContent).toBe("The season got away from us.");
    expect(q(root(), "[data-testid='result'] [role='img']").getAttribute("aria-label")).toBe(
      "0 of 3 stars",
    );
    expect(text(q(root(), "[data-testid='result']"))).toContain("1 houses flooded");
    expect(root().querySelectorAll(".fd-goal--met")).toHaveLength(0);
    expect(
      Array.from(root().querySelectorAll("button")).some((b) => b.textContent === "Next map"),
    ).toBe(false);
    await rig?.flush();
    expect(rig?.app.game.getState().profile.stars.v01).toBeUndefined();
  });
});

describe("a full campaign map by pointer", () => {
  it("goes Home, Regions, Levels, Board, Result and back through Retry", async () => {
    rig = await mountApp({ route: ["home"] });
    await clickByText(rig, "Play");
    await act(() => {
      (root().querySelector("[data-region='valley']") as HTMLButtonElement).click();
    });
    expect(rig.app.router.current.name).toBe("levels");
    await act(() => {
      (root().querySelector("[data-map='v01']") as HTMLButtonElement).click();
    });
    expect(rig.app.router.current).toMatchObject({ name: "board", params: { mapId: "v01" } });
    const pilot = new Pilot(rig, "v01");
    await pilot.drag(v01.reference.map(({ x, y }) => ({ x, y })));
    expect(pilot.budgetLeft()).toBe("3 of 9 left");
    await clickByText(rig, "Run season");
    await playUntilResult(rig);
    expect(q(root(), "[data-testid='result'] [role='img']").getAttribute("aria-label")).toBe(
      "3 of 3 stars",
    );
    await clickByText(rig, "Retry");
    expect(pilot.budgetLeft()).toBe("9 of 9 left");
    await pilot.tap(1, 1);
    expect(pilot.budgetLeft()).toBe("8 of 9 left");
    await clickByText(rig, "Run season");
    await playUntilResult(rig);
    expect(q(root(), "[data-testid='result'] [role='img']").getAttribute("aria-label")).toBe(
      "0 of 3 stars",
    );
    await rig.flush();
    expect(rig.app.game.getState().profile.stars.v01).toBe(3);
    expect(rig.app.game.getState().profile.stats.seasons).toBe(2);
  });
});

describe("season playback", () => {
  it("steps frames, changes speed, pauses and scrubs", async () => {
    await runPerfect();
    expect(scrub().max).toBe("80");
    expect(scrub().value).toBe("0");
    await tick(160);
    expect(scrub().value).toBe("1");
    await tick(160);
    expect(scrub().value).toBe("2");
    await clickByText(rig as Rig, "Speed 4x");
    await tick(40);
    expect(scrub().value).toBe("3");
    await clickByText(rig as Rig, "Speed 2x");
    expect(q(root(), ".fd-speeds [aria-pressed='true']").textContent).toBe("2x");
    await clickByText(rig as Rig, "Pause");
    const paused = scrub().value;
    await tick(2000);
    expect(scrub().value).toBe(paused);
    expect(buttonByText(root(), "Play")).toBeTruthy();
    scrub().value = "40";
    await act(() => {
      scrub().dispatchEvent(new Event("input", { bubbles: true }));
    });
    expect(scrub().value).toBe("40");
    expect(week()).toBe("Week 11 of 20");
    await clickByText(rig as Rig, "Play");
    await tick(100);
    expect(Number(scrub().value)).toBeGreaterThan(40);
  });

  it("shows live badges as the season runs", async () => {
    await runPerfect();
    const chips = () =>
      Array.from(root().querySelectorAll("[data-testid='live-badges'] li")).map((li) => text(li));
    expect(chips()).toEqual(["0/1 house supplied", "0 flooded", "0/1 field irrigated"]);
    scrub().value = "80";
    await act(() => {
      scrub().dispatchEvent(new Event("input", { bubbles: true }));
    });
    expect(chips()).toEqual(["1/1 house supplied", "0 flooded", "1/1 field irrigated"]);
  });

  it("jumps week to week when motion is reduced", async () => {
    await runPerfect({ settings: { reducedMotion: true } });
    expect(scrub().value).toBe("0");
    await tick(700);
    expect(scrub().value).toBe("4");
    await tick(700);
    expect(scrub().value).toBe("8");
    await clickByText(rig as Rig, "Speed 4x");
    await tick(175);
    expect(scrub().value).toBe("12");
    expect(document.documentElement.dataset.motion).toBe("reduced");
  });

  it("jumps straight to the result and reopens it on demand", async () => {
    await runPerfect();
    await clickByText(rig as Rig, "See result");
    expect(q(root(), "[data-testid='result']")).toBeTruthy();
    await clickByText(rig as Rig, "Edit plan");
    expect(root().querySelector("[data-testid='result']")).toBeNull();
    await press(q(root(), "[data-testid='board-host']"), " ");
    await clickByText(rig as Rig, "See result");
    expect(q(root(), "[data-testid='result']")).toBeTruthy();
  });

  it("toggles playback with Space and returns to planning with Edit", async () => {
    const pilot = await runPerfect();
    await press(pilot.host, " ");
    const frozen = scrub().value;
    await tick(1000);
    expect(scrub().value).toBe(frozen);
    await clickByText(rig as Rig, "Edit plan");
    expect(pilot.budgetLeft()).toBe("3 of 9 left");
  });

  it("draws depth numbers during playback when high contrast is on", async () => {
    await runPerfect({ settings: { highContrast: true } });
    scrub().value = "40";
    await act(() => {
      scrub().dispatchEvent(new Event("input", { bubbles: true }));
    });
    await tick(0);
    expect(rig?.ctx.count("clip")).toBeGreaterThan(0);
    expect(rig?.ctx.count("fillText")).toBeGreaterThan(0);
  });
});

describe("back button routing", () => {
  it("closes sheets first, then stops playback, then confirms leaving, then pops", async () => {
    rig = await mountApp({
      route: ["levels", { region: "valley" }],
    });
    rig.app.router.push("board", { mapId: "v01" });
    await rig.flush();
    const pilot = new Pilot(rig, "v01");
    await pilot.placeAll(v01.reference.slice(0, 2));
    await press(pilot.host, " ");
    await clickByText(rig, "See result");
    expect(q(root(), "[data-testid='result']")).toBeTruthy();
    expect(rig.app.router.handleBack()).toBe(true);
    await rig.flush();
    expect(root().querySelector("[data-testid='result']")).toBeNull();
    expect(root().querySelector(".fd-playback")).not.toBeNull();
    expect(rig.app.router.handleBack()).toBe(true);
    await rig.flush();
    expect(root().querySelector(".fd-playback")).toBeNull();
    expect(rig.app.router.current.name).toBe("board");
    expect(rig.app.router.handleBack()).toBe(true);
    await rig.flush();
    expect(text(root())).toContain("Leave this map?");
    expect(rig.app.router.handleBack()).toBe(true);
    await rig.flush();
    expect(root().querySelector("[role='dialog']")).toBeNull();
    expect(rig.app.router.current.name).toBe("board");
    expect(rig.app.router.handleBack()).toBe(true);
    await rig.flush();
    await clickByText(rig, "Leave");
    expect(rig.app.router.current.name).toBe("levels");
    expect(rig.app.router.handleBack()).toBe(false);
  });

  it("pops straight away from an empty plan and closes the pause sheet first", async () => {
    rig = await mountApp({ route: ["levels", { region: "valley" }] });
    rig.app.router.push("board", { mapId: "v01" });
    await rig.flush();
    await clickByText(rig, "Pause menu");
    expect(text(root())).toContain("Paused");
    expect(rig.app.router.handleBack()).toBe(true);
    await rig.flush();
    expect(root().querySelector("[role='dialog']")).toBeNull();
    expect(rig.app.router.current.name).toBe("board");
    expect(rig.app.router.handleBack()).toBe(true);
    expect(rig.app.router.current.name).toBe("levels");
  });

  it("can open how-to play and clear the plan from the pause sheet", async () => {
    const pilot = await open();
    await pilot.place({ x: 1, y: 1, kind: "canal" });
    await clickByText(rig as Rig, "Pause menu");
    await clickByText(rig as Rig, "Clear the plan");
    expect(pilot.budgetLeft()).toBe("9 of 9 left");
    await clickByText(rig as Rig, "Pause menu");
    await clickByText(rig as Rig, "How to play");
    expect(rig?.app.router.current.name).toBe("howto");
  });
});

describe("daily dispatch", () => {
  it("builds today's map, plays it with the reference plan and records the streak", async () => {
    vi.useRealTimers();
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    rig = await mountApp({ route: ["board", { daily: true }], profile: { coins: 100 } });
    expect(text(root())).toContain("Preparing today's map");
    await act(async () => {
      vi.advanceTimersByTime(5);
    });
    await rig.flush();
    expect(q(root(), ".wg-screen h1").textContent).toBe("Daily 2026-10-21");
    const puzzle = dailyPuzzle("2026-10-21");
    expect(dailySeedOf("2026-10-21")).toBeGreaterThan(0);
    const pilot = new Pilot(rig, puzzle.map);
    await pilot.placeAll(puzzle.map.reference);
    await press(pilot.host, " ");
    await playUntilResult(rig, 160, 600);
    expect(q(root(), "[data-testid='result'] [role='img']").getAttribute("aria-label")).toBe(
      "3 of 3 stars",
    );
    await rig.flush();
    const profile = rig.app.game.getState().profile;
    expect(profile.daily.streak).toBe(1);
    expect(profile.daily.results["2026-10-21"]?.stars).toBe(3);
    expect(profile.coins).toBe(100 + 20 + 2);
    expect(text(root())).toContain("Streak 1");
    expect(root().querySelector("button.wg-btn")).not.toBeNull();
    expect(
      Array.from(root().querySelectorAll("button")).some((b) => b.textContent === "Next map"),
    ).toBe(false);
    await clickByText(rig, "Share");
    await rig.flush();
    expect(rig.shared[0]?.text).toBe(
      "Floodplain Dispatch Daily 2026-10-21: 3/3 stars, 0 flooded. Streak 1.",
    );
  }, 120000);
});

describe("profile gating inside the board", () => {
  it("allows replaying a cleared map and records only improvements", async () => {
    await runPerfect({
      profile: { stars: starsFor(VALLEY_IDS, 3), coins: 10, regionBonusClaimed: { valley: true } },
    });
    await playUntilResult(rig as Rig);
    await rig?.flush();
    expect(rig?.app.game.getState().profile.coins).toBe(10);
    expect(text(q(root(), "[data-testid='result']"))).not.toContain("Plus");
  });
});
