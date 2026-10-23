import { afterEach, describe, expect, it } from "vitest";
import { campaignFixture, tapAt } from "./helpers/board";
import {
  byText,
  click,
  createTestEnv,
  flush,
  mountApp,
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
});

async function open(options: TestEnvOptions): Promise<{ app: Mounted; test: TestEnv }> {
  const test = await createTestEnv(options);
  const app = await mountApp(test.env);
  mounted = app;
  await flush(8);
  return { app, test };
}

const dialog = (root: ParentNode): HTMLElement | null => root.querySelector("[role='dialog']");
const back = async (test: TestEnv): Promise<void> => {
  test.lifecycle.pressBack();
  await flush(6);
};

describe("Android back button", () => {
  it("closes the topmost sheet before leaving the screen", async () => {
    const { app, test } = await open({ fixture: "mid" });
    test.router.push("chapters");
    test.router.push("puzzle", { id: "harbor-01" });
    await flush(10);
    await click(app.container.querySelector("[aria-label='Pause']"));
    expect(dialog(app.container)?.textContent).toContain("Paused");
    await back(test);
    expect(dialog(app.container)).toBeNull();
    expect(test.router.current.name).toBe("puzzle");
    await back(test);
    expect(test.router.current.name).toBe("chapters");
  });

  it("closes the restart confirmation opened from the pause sheet", async () => {
    const { app, test } = await open({ fixture: "mid" });
    test.router.push("puzzle", { id: "harbor-01" });
    await flush(10);
    const { puzzle } = campaignFixture("harbor-01");
    const free = Array.from(puzzle.cells).findIndex(
      (cell) => cell.kind === "open" && cell.fixed === undefined,
    );
    await tapAt(boardSvg(app.container), puzzle.size, free);
    await click(app.container.querySelector("[aria-label='Pause']"));
    await click(byText(app.container, "button", "Restart puzzle") ?? null);
    expect(dialog(app.container)?.textContent).toContain("Restart this puzzle?");
    await back(test);
    expect(dialog(app.container)).toBeNull();
    expect(test.router.current.name).toBe("puzzle");
  });

  it("pops a screen when no sheet is open", async () => {
    const { test } = await open({ fixture: "mid" });
    test.router.push("stats");
    await flush(4);
    expect(test.router.current.name).toBe("stats");
    await back(test);
    expect(test.router.current.name).toBe("home");
  });

  it("asks before exiting from Home", async () => {
    const { app, test } = await open({ fixture: "mid" });
    await back(test);
    expect(dialog(app.container)?.textContent).toContain("Leave Lantern Loops?");
    expect(test.exits).toHaveLength(0);
    await back(test);
    expect(dialog(app.container)).toBeNull();
    await back(test);
    await click(byText(app.container, "button", "Leave"));
    expect(test.exits).toHaveLength(1);
  });

  it("closes the settings reset confirmation first", async () => {
    const { app, test } = await open({ fixture: "mid", route: { name: "settings" } });
    await click(byText(app.container, "button", "Reset progress"));
    expect(dialog(app.container)).not.toBeNull();
    await back(test);
    expect(dialog(app.container)).toBeNull();
    expect(test.router.current.name).toBe("settings");
  });
});

describe("motion", () => {
  it("plays the screen transition when motion is allowed", async () => {
    const { test } = await open({ fixture: "mid" });
    test.animate.mockClear();
    test.router.push("stats");
    await flush(6);
    expect(test.animate).toHaveBeenCalled();
  });

  it("starts no animation for transitions or the win sequence with reduced motion", async () => {
    const { app, test } = await open({
      fixture: "fresh",
      settings: { reducedMotion: true },
      route: { name: "puzzle", params: { id: "harbor-01" } },
    });
    test.router.push("stats");
    await flush(6);
    test.router.pop();
    await flush(10);
    const { puzzle, solution } = campaignFixture("harbor-01");
    await solveByTaps(app.container, puzzle, solution);
    expect(dialog(app.container)?.textContent).toContain("Puzzle solved");
    expect(test.animate).not.toHaveBeenCalled();
    expect(document.documentElement.dataset.reducedMotion).toBe("true");
  });

  it("runs the win sequence when motion is allowed", async () => {
    const { app, test } = await open({
      fixture: "fresh",
      route: { name: "puzzle", params: { id: "harbor-01" } },
    });
    test.animate.mockClear();
    const { puzzle, solution } = campaignFixture("harbor-01");
    await solveByTaps(app.container, puzzle, solution);
    expect(dialog(app.container)?.textContent).toContain("Puzzle solved");
    expect(test.animate.mock.calls.length).toBeGreaterThan(5);
  });
});

describe("high contrast", () => {
  it("applies the high contrast tokens to the document", async () => {
    await open({ fixture: "mid", settings: { highContrast: true } });
    expect(document.documentElement.dataset.contrast).toBe("high");
    expect(document.documentElement.style.getPropertyValue("--wg-color-text")).toBe("#FFFFFF");
  });
});
