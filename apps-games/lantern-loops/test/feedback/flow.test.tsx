import { afterEach, describe, expect, it, vi } from "vitest";
import { puzzleForDate } from "../../src/services/daily";
import { campaignFixture, tapAt } from "../helpers/board";
import {
  byText,
  click,
  createTestEnv,
  flush,
  MONDAY_KEY,
  mountApp,
  removeAnimate,
  type TestEnv,
  type TestEnvOptions,
} from "../helpers/env";
import { boardSvg, solveByTaps } from "../helpers/solve";

type Mounted = Awaited<ReturnType<typeof mountApp>>;
let mounted: Mounted | null = null;

afterEach(() => {
  mounted?.unmount();
  mounted = null;
  document.body.replaceChildren();
  removeAnimate();
  vi.useRealTimers();
});

async function open(
  route: NonNullable<TestEnvOptions["route"]>,
  options: TestEnvOptions = {},
): Promise<{ app: Mounted; test: TestEnv }> {
  const test = await createTestEnv({ route, fixture: "fresh", ...options });
  const app = await mountApp(test.env);
  mounted = app;
  await flush(8);
  test.events.length = 0;
  return { app, test };
}

const puzzleRoute = (id: string) => ({ name: "puzzle", params: { id } }) as const;

describe("interface sounds", () => {
  it("taps play ui-tap, the back arrow plays ui-back once, sheets play sheet-open", async () => {
    const { app, test } = await open({ name: "home" }, { fixture: "mid" });
    await click(byText(app.container, "button", "Settings"));
    expect(test.events).toEqual(["ui-tap"]);
    test.events.length = 0;
    await click(app.container.querySelector("[aria-label='Back']"));
    expect(test.events).toEqual(["ui-back"]);
    test.events.length = 0;
    await click(byText(app.container, "button", "Play campaign"));
    await click(byText(app.container, "button", "Harbor"));
    test.events.length = 0;
    test.router.reset("puzzle", { id: "harbor-01" });
    await flush(8);
    test.events.length = 0;
    await click(app.container.querySelector("[aria-label='Pause']"));
    expect(test.events).toEqual(["ui-tap", "sheet-open"]);
  });

  it("does not play the tap sound for disabled buttons", async () => {
    const { app, test } = await open(puzzleRoute("harbor-01"));
    const undo = app.container.querySelector<HTMLButtonElement>("[aria-label='Undo']");
    expect(undo?.disabled).toBe(true);
    await click(undo);
    expect(test.events).toEqual([]);
  });
});

describe("board feedback on the puzzle screen", () => {
  it("places, undoes and restarts with the matching events and haptics", async () => {
    const { app, test } = await open(puzzleRoute("harbor-01"));
    const { puzzle } = campaignFixture("harbor-01");
    const free = Array.from(puzzle.cells).findIndex(
      (cell) => cell.kind === "open" && cell.fixed === undefined,
    );
    await tapAt(boardSvg(app.container), puzzle.size, free);
    expect(test.events).toEqual(["tile-place"]);
    expect(test.buzzes).toEqual(["impact:light"]);
    await click(app.container.querySelector("[aria-label='Undo']"));
    expect(test.events).toEqual(["tile-place", "undo"]);
    await click(app.container.querySelector("[aria-label='Redo']"));
    await click(app.container.querySelector("[aria-label='Restart']"));
    await click(byText(app.container, "[role='dialog'] button", "Restart"));
    expect(test.events).toContain("tile-erase");
  });

  it("a hint plays the hint event and the light haptic", async () => {
    const { app, test } = await open(puzzleRoute("harbor-01"));
    await click(app.container.querySelector("[aria-label^='Hint,']"));
    expect(test.events).toEqual(["sheet-open"]);
    await click(byText(app.container, "button", "Use hint"));
    await flush(6);
    expect(test.events).toContain("hint");
    expect(test.buzzes).toContain("impact:light");
  });

  it("solving closes the loops, lights the lanterns and plays win-3 with a success haptic", async () => {
    const { app, test } = await open(puzzleRoute("harbor-01"));
    const { puzzle, solution } = campaignFixture("harbor-01");
    await solveByTaps(app.container, puzzle, solution);
    expect(test.events).toContain("loop-close");
    expect(test.events).toContain("lantern-lit");
    expect(test.events.indexOf("win-3")).toBeGreaterThan(test.events.indexOf("loop-close"));
    expect(test.events).not.toContain("daily-done");
    expect(test.buzzes).toContain("impact:medium");
    expect(test.buzzes.at(-1)).toBe("notification:success");
  });

  it("one hint then a solve plays win-2", async () => {
    const { app, test } = await open(puzzleRoute("harbor-01"));
    const { puzzle, solution } = campaignFixture("harbor-01");
    await click(app.container.querySelector("[aria-label^='Hint,']"));
    await click(byText(app.container, "button", "Use hint"));
    await flush(6);
    const marker = app.container.querySelector(".ll-hinted");
    const cell = Number(marker?.closest("[data-cell]")?.getAttribute("data-cell"));
    await solveByTaps(app.container, puzzle, solution, new Set([cell]));
    expect(test.events).toContain("win-2");
    expect(test.events).not.toContain("win-3");
  });

  it("a daily solve adds daily-done after the win sound", async () => {
    const { app, test } = await open(puzzleRoute(`daily-${MONDAY_KEY}`));
    const day = puzzleForDate(MONDAY_KEY);
    await solveByTaps(app.container, day.puzzle, day.solution);
    const win = test.events.indexOf("win-3");
    expect(win).toBeGreaterThanOrEqual(0);
    expect(test.events.indexOf("daily-done")).toBeGreaterThan(win);
  });

  it("a chapter unlock adds chapter-unlock", async () => {
    const stars: Record<string, number> = {};
    for (let n = 2; n <= 15; n++) stars[`harbor-${String(n).padStart(2, "0")}`] = 3;
    const { app, test } = await open(puzzleRoute("harbor-01"), { profile: { stars } });
    const { puzzle, solution } = campaignFixture("harbor-01");
    await solveByTaps(app.container, puzzle, solution);
    expect(test.events).toContain("chapter-unlock");
  });

  it("emits no board events for a practice board hint attempt or a brush change", async () => {
    const { app, test } = await open(puzzleRoute("tutorial-1"));
    await click(app.container.querySelector("[data-brush='corner']"));
    expect(test.events).toEqual(["ui-tap"]);
  });
});
