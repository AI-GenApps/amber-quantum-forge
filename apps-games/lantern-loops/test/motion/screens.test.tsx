import { afterEach, describe, expect, it, vi } from "vitest";
import { campaignFixture } from "../helpers/board";
import {
  byText,
  click,
  createTestEnv,
  flush,
  mountApp,
  removeAnimate,
  type TestEnv,
  type TestEnvOptions,
} from "../helpers/env";
import { solveByTaps } from "../helpers/solve";

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
  const test = await createTestEnv({ route, fixture: "mid", ...options });
  const app = await mountApp(test.env);
  mounted = app;
  await flush(8);
  return { app, test };
}

describe("screen and sheet motion", () => {
  it("animates screen entrances, the flame and sheets when motion is on", async () => {
    const { app, test } = await open({ name: "home" });
    const afterHome = test.animate.mock.calls.length;
    expect(afterHome).toBeGreaterThanOrEqual(2);
    test.router.reset("puzzle", { id: "harbor-01" });
    await flush(8);
    const before = test.animate.mock.calls.length;
    await click(app.container.querySelector("[aria-label='Pause']"));
    expect(test.animate.mock.calls.length).toBeGreaterThan(before);
  });

  it("repeats the flame flicker on the Home screen and stops when it closes", async () => {
    vi.useFakeTimers();
    const { test } = await open({ name: "home" });
    const start = test.animate.mock.calls.length;
    await vi.advanceTimersByTimeAsync(3300);
    expect(test.animate.mock.calls.length).toBe(start + 1);
    mounted?.unmount();
    mounted = null;
    const stopped = test.animate.mock.calls.length;
    await vi.advanceTimersByTimeAsync(7000);
    expect(test.animate.mock.calls.length).toBe(stopped);
  });

  it("starts no animation at all with Reduced motion on, even through a win", async () => {
    const { app, test } = await open(
      { name: "puzzle", params: { id: "harbor-01" } },
      { fixture: "fresh", settings: { reducedMotion: true } },
    );
    await click(app.container.querySelector("[aria-label='Pause']"));
    await click(byText(app.container, "button", "Resume"));
    const { puzzle, solution } = campaignFixture("harbor-01");
    await solveByTaps(app.container, puzzle, solution);
    expect(app.container.querySelector("[role='dialog']")?.textContent).toContain("Puzzle solved");
    expect(test.animate).not.toHaveBeenCalled();
  });

  it("starts no animation on Home with Reduced motion on", async () => {
    const { test } = await open({ name: "home" }, { settings: { reducedMotion: true } });
    await flush(6);
    expect(test.animate).not.toHaveBeenCalled();
  });
});
