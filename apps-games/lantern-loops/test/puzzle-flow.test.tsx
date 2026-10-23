import { dailyId, getPuzzle, getTutorial } from "@web-games/lantern-loops-core";
import { afterEach, describe, expect, it, vi } from "vitest";
import { resolveSource } from "../src/app/source";
import { puzzleForDate } from "../src/services/daily";
import { campaignFixture, key, puzzleFrom, tapAt } from "./helpers/board";
import {
  byText,
  click,
  createTestEnv,
  flush,
  MONDAY,
  MONDAY_KEY,
  mountApp,
  profileFixture,
  removeAnimate,
  type TestEnv,
  type TestEnvOptions,
} from "./helpers/env";
import { boardSvg, solveByTaps } from "./helpers/solve";

type Mounted = Awaited<ReturnType<typeof mountApp>>;
let mounted: Mounted | null = null;

afterEach(() => {
  mounted?.unmount();
  mounted = null;
  document.body.replaceChildren();
  removeAnimate();
  vi.useRealTimers();
});

async function openPuzzle(
  id: string,
  options: TestEnvOptions = {},
): Promise<{ app: Mounted; test: TestEnv }> {
  const test = await createTestEnv({ route: { name: "puzzle", params: { id } }, ...options });
  const app = await mountApp(test.env);
  mounted = app;
  await flush(8);
  return { app, test };
}

const text = (root: ParentNode, selector: string): string =>
  root.querySelector(selector)?.textContent ?? "";
const sheet = (root: ParentNode): HTMLElement | null => root.querySelector("[role='dialog']");

describe("campaign solve", () => {
  it("opens the win sheet with 3 stars and moves on to the next puzzle", async () => {
    const { app, test } = await openPuzzle("harbor-01", { fixture: "fresh" });
    const { puzzle, solution } = campaignFixture("harbor-01");
    expect(text(app.container, ".ll-hud-title")).toContain(
      getPuzzle("harbor-01")?.title ?? "missing",
    );
    await solveByTaps(app.container, puzzle, solution);
    const win = sheet(app.container);
    expect(win?.textContent).toContain("Puzzle solved");
    expect(win?.querySelector("[role='img']")?.getAttribute("aria-label")).toBe("3 of 3 stars");
    expect(text(app.container, "[data-testid='win-hints']")).toBe("Hints used: 0");
    expect(text(app.container, "[data-testid='win-time']")).toMatch(/^Time \d+:\d\d$/);
    expect(test.env.services.progression.current().stars["harbor-01"]).toBe(3);
    expect(await test.env.services.runs.get("harbor-01")).toBeNull();
    await click(byText(app.container, "button", "Next puzzle"));
    expect(test.router.current).toEqual({ name: "puzzle", params: { id: "harbor-02" } });
  });

  it("gives 2 stars after one hint and 1 star after two", async () => {
    for (const [hints, stars] of [
      [1, 2],
      [2, 1],
    ] as const) {
      const { app, test } = await openPuzzle("harbor-01", { fixture: "fresh" });
      const { puzzle, solution } = campaignFixture("harbor-01");
      for (let k = 0; k < hints; k++) {
        await click(app.container.querySelector("[aria-label^='Hint,']"));
        await click(byText(app.container, "button", "Use hint"));
        await flush(6);
      }
      expect(test.env.services.progression.current().tokens).toBe(3 - hints);
      await solveByTaps(app.container, puzzle, solution);
      expect(sheet(app.container)?.querySelector("[role='img']")?.getAttribute("aria-label")).toBe(
        `${stars} of 3 stars`,
      );
      expect(text(app.container, "[data-testid='win-hints']")).toBe(`Hints used: ${hints}`);
      expect(test.env.services.progression.current().stars["harbor-01"]).toBe(stars);
      app.unmount();
      document.body.replaceChildren();
      removeAnimate();
    }
  });

  it("opens the unlock celebration before the win sheet when a chapter opens", async () => {
    const stars: Record<string, number> = {};
    for (let n = 2; n <= 15; n++) stars[`harbor-${String(n).padStart(2, "0")}`] = 3;
    const { app, test } = await openPuzzle("harbor-01", { fixture: "fresh", profile: { stars } });
    const { puzzle, solution } = campaignFixture("harbor-01");
    await solveByTaps(app.container, puzzle, solution);
    expect(sheet(app.container)?.textContent).toContain("New chapter open");
    expect(sheet(app.container)?.textContent).toContain("Garden is open");
    await click(byText(app.container, "button", "Continue"));
    expect(sheet(app.container)?.textContent).toContain("Puzzle solved");
    expect(test.env.services.progression.current().stars["harbor-01"]).toBe(3);
  });
});

describe("daily and archive solves", () => {
  it("records the daily, shows the streak and shares the emoji grid", async () => {
    const { app, test } = await openPuzzle(`daily-${MONDAY_KEY}`, { fixture: "fresh" });
    const day = puzzleForDate(MONDAY_KEY);
    await solveByTaps(app.container, day.puzzle, day.solution);
    expect(sheet(app.container)?.textContent).toContain("Puzzle solved");
    expect(text(app.container, "[data-testid='win-streak']")).toBe("Streak: 1 day");
    expect(text(app.container, "[data-testid='win-tokens']")).toContain("Earned 2 hint tokens");
    expect(test.env.services.progression.current().tokens).toBe(5);
    expect(test.env.services.progression.current().dailiesSolved[MONDAY_KEY]?.stars).toBe(3);
    await click(byText(app.container, "button", "Share result"));
    expect(test.shares).toHaveLength(1);
    const lines = (test.shares[0]?.text ?? "").split("\n");
    expect(lines[0]).toBe("Lantern Loops Daily 2026-10-19");
    expect(lines[1]).toMatch(/^3 stars {2}\d+:\d\d$/);
    expect(lines).toHaveLength(2 + 5);
    expect(app.container.textContent).toContain("Result copied");
  });

  it("pays one token for an archive solve and leaves the streak alone", async () => {
    const date = "2026-10-18";
    const { app, test } = await openPuzzle(`daily-${date}`, { fixture: "fresh" });
    const day = puzzleForDate(date);
    await solveByTaps(app.container, day.puzzle, day.solution);
    expect(app.container.querySelector("[data-testid='win-streak']")).toBeNull();
    expect(text(app.container, "[data-testid='win-tokens']")).toContain("Earned 1 hint tokens");
    expect(test.env.services.progression.current().streak).toBe(0);
    expect(test.env.services.progression.current().dailiesSolved[date]?.stars).toBe(3);
  });

  it("resolves only today and the archive window", () => {
    expect(resolveSource(dailyId(MONDAY_KEY), MONDAY_KEY)?.kind).toBe("daily");
    expect(resolveSource(dailyId("2026-10-18"), MONDAY_KEY)?.kind).toBe("archive");
    expect(resolveSource(dailyId("2026-10-20"), MONDAY_KEY)).toBeNull();
    expect(resolveSource(dailyId("2026-01-01"), MONDAY_KEY)).toBeNull();
    expect(resolveSource("nonsense", MONDAY_KEY)).toBeNull();
    expect(resolveSource("harbor-01", MONDAY_KEY)?.kind).toBe("campaign");
    expect(resolveSource("tutorial-1", MONDAY_KEY)?.kind).toBe("tutorial");
  });

  it("shows a message for an unknown puzzle", async () => {
    const { app } = await openPuzzle("nope");
    expect(app.container.textContent).toContain("That puzzle could not be found.");
  });
});

describe("hints", () => {
  it("explains an empty token jar without spending anything", async () => {
    const { app, test } = await openPuzzle("harbor-01", {
      fixture: "fresh",
      profile: { tokens: 0 },
    });
    await click(app.container.querySelector("[aria-label^='Hint,']"));
    expect(sheet(app.container)?.textContent).toContain("no hint tokens");
    expect(byText(app.container, "button", "Use hint")).toBeNull();
    await click(byText(app.container, "button", "Close"));
    expect(sheet(app.container)).toBeNull();
    expect(test.env.services.progression.current().tokens).toBe(0);
  });

  it("asks before spending and locks the revealed tile", async () => {
    const { app, test } = await openPuzzle("harbor-01", { fixture: "fresh" });
    await click(app.container.querySelector("[aria-label^='Hint,']"));
    expect(sheet(app.container)?.textContent).toContain("costs 1 token");
    await click(byText(app.container, "button", "Cancel"));
    expect(test.env.services.progression.current().tokens).toBe(3);
    await click(app.container.querySelector("[aria-label^='Hint,']"));
    await click(byText(app.container, "button", "Use hint"));
    await flush(6);
    expect(test.env.services.progression.current().tokens).toBe(2);
    expect(test.env.services.progression.current().hintsUsed).toBe(1);
    expect(app.container.querySelectorAll(".ll-hinted")).toHaveLength(1);
    expect(app.container.querySelector("[aria-label^='Hint,']")?.getAttribute("aria-label")).toBe(
      "Hint, 2 tokens left",
    );
  });

  it("is not available on practice boards", async () => {
    const { app, test } = await openPuzzle("tutorial-1", { fixture: "fresh" });
    await click(app.container.querySelector("[aria-label^='Hint,']"));
    expect(app.container.textContent).toContain("Hints are off for practice boards.");
    expect(test.env.services.progression.current().tokens).toBe(3);
  });
});

describe("controls", () => {
  it("restarts after a confirmation and keeps undo and redo in sync", async () => {
    const { app } = await openPuzzle("harbor-01", { fixture: "fresh" });
    const { puzzle } = campaignFixture("harbor-01");
    const svg = boardSvg(app.container);
    const button = (label: string): HTMLButtonElement =>
      app.container.querySelector(`[aria-label='${label}']`) as HTMLButtonElement;
    expect(button("Undo").disabled).toBe(true);
    expect(button("Restart").disabled).toBe(true);
    const free = Array.from(puzzle.cells).findIndex(
      (cell) => cell.kind === "open" && cell.fixed === undefined,
    );
    await tapAt(svg, puzzle.size, free);
    expect(button("Undo").disabled).toBe(false);
    expect(button("Restart").disabled).toBe(false);
    await click(button("Undo"));
    expect(button("Redo").disabled).toBe(false);
    await click(button("Redo"));
    await click(button("Restart"));
    expect(sheet(app.container)?.textContent).toContain("Restart this puzzle?");
    await click(byText(app.container, "button", "Cancel"));
    expect(
      app.container.querySelector(`[data-cell='${free}']`)?.getAttribute("aria-label"),
    ).toContain("straight horizontal");
    await click(button("Restart"));
    await click(byText(app.container, "[role='dialog'] button", "Restart"));
    expect(
      app.container.querySelector(`[data-cell='${free}']`)?.getAttribute("aria-label"),
    ).toContain("empty");
  });

  it("persists the brush in the profile", async () => {
    const { app, test } = await openPuzzle("harbor-01", { fixture: "fresh" });
    await click(app.container.querySelector("[data-brush='corner']"));
    await flush(4);
    expect(test.env.services.progression.current().brush).toBe("corner");
    expect(app.container.querySelector("[data-brush='corner']")?.getAttribute("aria-checked")).toBe(
      "true",
    );
  });

  it("opens the pause sheet from the HUD and the Escape key", async () => {
    const { app, test } = await openPuzzle("harbor-01", { fixture: "fresh" });
    await click(app.container.querySelector("[aria-label='Pause']"));
    expect(sheet(app.container)?.textContent).toContain("Paused");
    await click(byText(app.container, "button", "Resume"));
    expect(sheet(app.container)).toBeNull();
    await key(boardSvg(app.container), "Escape");
    expect(sheet(app.container)?.textContent).toContain("Paused");
    await click(byText(app.container, "button", "How to play"));
    expect(test.router.current.name).toBe("howto");
  });

  it("leaves the puzzle from the pause sheet", async () => {
    const { app, test } = await openPuzzle("harbor-01", { fixture: "fresh" });
    test.router.reset("chapters");
    test.router.push("puzzle", { id: "harbor-01" });
    await flush(8);
    await click(app.container.querySelector("[aria-label='Pause']"));
    await click(byText(app.container, "button", "Leave puzzle"));
    expect(test.router.current.name).toBe("chapters");
  });
});

describe("saving and timing", () => {
  it("autosaves after every move and restores the board", async () => {
    const first = await openPuzzle("harbor-01", { fixture: "fresh" });
    const { puzzle } = campaignFixture("harbor-01");
    const free = Array.from(puzzle.cells).findIndex(
      (cell) => cell.kind === "open" && cell.fixed === undefined,
    );
    await tapAt(boardSvg(first.app.container), puzzle.size, free);
    await flush(6);
    const saved = await first.test.env.services.runs.get("harbor-01");
    expect(saved?.tiles[free]).toBe("a");
    expect(saved?.moves).toBe(1);
    first.app.unmount();
    document.body.replaceChildren();
    const copy = first.test.adapter.entries.get("lantern-loops.runs");
    const second = await createTestEnv({
      fixture: "fresh",
      route: { name: "puzzle", params: { id: "harbor-01" } },
    });
    second.adapter.entries.set("lantern-loops.runs", copy as string);
    const app = await mountApp(second.env);
    mounted = app;
    await flush(10);
    expect(
      app.container.querySelector(`[data-cell='${free}']`)?.getAttribute("aria-label"),
    ).toContain("straight horizontal");
  });

  it("saves the board when the app goes to the background", async () => {
    const { app, test } = await openPuzzle("harbor-01", { fixture: "fresh" });
    const { puzzle } = campaignFixture("harbor-01");
    const free = Array.from(puzzle.cells).findIndex(
      (cell) => cell.kind === "open" && cell.fixed === undefined,
    );
    await tapAt(boardSvg(app.container), puzzle.size, free);
    await flush(4);
    test.lifecycle.pause();
    await flush(6);
    expect((await test.env.services.runs.get("harbor-01"))?.tiles[free]).toBe("a");
  });

  it("runs the timer only while playing, not while a sheet is open or the app is hidden", async () => {
    vi.useFakeTimers({
      toFake: ["setInterval", "clearInterval", "setTimeout", "clearTimeout", "Date"],
    });
    vi.setSystemTime(MONDAY);
    const test = await createTestEnv({
      fixture: "fresh",
      liveClock: true,
      profile: { showTimer: true },
      route: { name: "puzzle", params: { id: "harbor-01" } },
    });
    const app = await mountApp(test.env);
    mounted = app;
    await flush(8);
    const timer = (): string => text(app.container, "[data-testid='timer']");
    expect(timer()).toBe("0:00");
    await vi.advanceTimersByTimeAsync(3000);
    expect(timer()).toBe("0:03");
    await click(app.container.querySelector("[aria-label='Pause']"));
    await vi.advanceTimersByTimeAsync(5000);
    expect(timer()).toBe("0:03");
    await click(byText(app.container, "button", "Resume"));
    await vi.advanceTimersByTimeAsync(2000);
    expect(timer()).toBe("0:05");
    test.lifecycle.pause();
    await vi.advanceTimersByTimeAsync(4000);
    test.lifecycle.resume();
    await vi.advanceTimersByTimeAsync(1000);
    expect(timer()).toBe("0:06");
  });

  it("hides the timer unless the setting is on", async () => {
    const { app } = await openPuzzle("harbor-01", { fixture: "fresh" });
    expect(app.container.querySelector("[data-testid='timer']")).toBeNull();
  });
});

describe("coach cards and tutorial", () => {
  it("introduces mirrors once on Bridge 1", async () => {
    const first = await openPuzzle("bridge-01", { fixture: "finished" });
    expect(sheet(first.app.container)?.textContent).toContain("Mirrors turn the light");
    await click(byText(first.app.container, "button", "Got it"));
    expect(sheet(first.app.container)).toBeNull();
    expect(await first.test.env.services.flags.hasSeen("bridge-01")).toBe(true);
    first.app.unmount();
    document.body.replaceChildren();
    const again = await createTestEnv({
      fixture: "finished",
      route: { name: "puzzle", params: { id: "bridge-01" } },
    });
    await again.env.services.flags.markSeen("bridge-01");
    const app = await mountApp(again.env);
    mounted = app;
    await flush(10);
    expect(sheet(app.container)).toBeNull();
  });

  it("introduces gates on Sky 1", async () => {
    const { app } = await openPuzzle("sky-01", { fixture: "finished" });
    expect(sheet(app.container)?.textContent).toContain("Gates need a straight tile");
  });

  it("walks both tutorial boards and then finishes onboarding", async () => {
    const { app, test } = await openPuzzle("tutorial-1", { fixture: "fresh" });
    expect(app.container.querySelector("[data-testid='tutorial-step']")?.textContent).toContain(
      "Drag from the glowing lantern",
    );
    expect(app.container.querySelectorAll(".ll-target").length).toBeGreaterThan(0);
    for (const id of ["tutorial-1", "tutorial-2"]) {
      const record = getTutorial(id);
      if (!record) throw new Error("tutorial missing");
      const puzzle = puzzleFrom(record.code, id);
      const solution = Uint8Array.from(record.solution, (c) => Number.parseInt(c, 16));
      await solveByTaps(app.container, puzzle, solution);
      expect(sheet(app.container)?.textContent).toContain("Puzzle solved");
      expect(app.container.querySelector("[data-testid='win-hints']")).toBeNull();
      if (id === "tutorial-1") {
        await click(byText(app.container, "[role='dialog'] button", "Continue"));
        expect(test.router.current).toEqual({ name: "puzzle", params: { id: "tutorial-2" } });
        await flush(8);
      }
    }
    expect(test.env.services.progression.current().onboardingDone).toBe(true);
    expect(test.env.services.progression.current().stars).toEqual({});
    await click(byText(app.container, "button", "Finish practice"));
    expect(test.router.current.name).toBe("home");
  });

  it("lets the player skip the tutorial", async () => {
    const { app, test } = await openPuzzle("tutorial-1", { fixture: "fresh" });
    await click(byText(app.container, "button", "Skip"));
    expect(test.router.current.name).toBe("home");
    expect(test.env.services.progression.current().onboardingDone).toBe(true);
  });
});

describe("profile fixtures", () => {
  it("fixtures describe a fresh, a mid-game and a finished profile", () => {
    expect(Object.keys(profileFixture("fresh").stars)).toHaveLength(0);
    expect(Object.keys(profileFixture("mid").stars)).toHaveLength(30);
    expect(Object.keys(profileFixture("finished").stars)).toHaveLength(120);
  });
});
