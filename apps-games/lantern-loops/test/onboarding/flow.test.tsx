import { getTutorial } from "@web-games/lantern-loops-core";
import { afterEach, describe, expect, it } from "vitest";
import { puzzleFrom } from "../helpers/board";
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
});

async function open(
  route: NonNullable<TestEnvOptions["route"]>,
  options: TestEnvOptions = {},
): Promise<{ app: Mounted; test: TestEnv }> {
  const test = await createTestEnv({ route, ...options });
  const app = await mountApp(test.env);
  mounted = app;
  await flush(10);
  return { app, test };
}

const done = (test: TestEnv): boolean => test.env.services.progression.current().onboardingDone;
const sheet = (root: ParentNode) => root.querySelector("[role='dialog']");

describe("first launch", () => {
  it("shows the welcome card to a fresh profile and walks both boards", async () => {
    const { app, test } = await open({ name: "boot" }, { fixture: "fresh" });
    expect(app.container.querySelector("[data-screen='onboarding']")).not.toBeNull();
    expect(done(test)).toBe(false);
    await click(byText(app.container, "button", "Start practice"));
    expect(test.router.current).toEqual({ name: "puzzle", params: { id: "tutorial-1" } });
    for (const id of ["tutorial-1", "tutorial-2"]) {
      const record = getTutorial(id);
      if (!record) throw new Error("missing tutorial");
      expect(
        app.container.querySelector("[data-testid='tutorial-step']")?.getAttribute("data-step"),
      ).toBe(id);
      expect(app.container.querySelectorAll(".ll-target").length).toBeGreaterThan(0);
      const solution = Uint8Array.from(record.solution, (c) => Number.parseInt(c, 16));
      await solveByTaps(app.container, puzzleFrom(record.code, id), solution);
      expect(sheet(app.container)?.textContent).toContain("Puzzle solved");
      if (id === "tutorial-1") {
        expect(done(test)).toBe(false);
        await click(byText(app.container, "[role='dialog'] button", "Continue"));
        await flush(8);
      }
    }
    expect(done(test)).toBe(true);
    await click(byText(app.container, "button", "Finish practice"));
    expect(test.router.current.name).toBe("home");
  });

  it("Skip on the welcome card saves the flag and opens Home", async () => {
    const { app, test } = await open({ name: "boot" }, { fixture: "fresh" });
    await click(byText(app.container, "button", "Skip"));
    expect(done(test)).toBe(true);
    expect(test.router.current.name).toBe("home");
  });

  it.each(["tutorial-1", "tutorial-2"])("Skip is on screen and works on %s", async (id) => {
    const { app, test } = await open({ name: "puzzle", params: { id } }, { fixture: "fresh" });
    expect(byText(app.container, "button", "Skip")).not.toBeNull();
    await click(byText(app.container, "button", "Skip"));
    expect(done(test)).toBe(true);
    expect(test.router.current.name).toBe("home");
  });

  it("keeps Skip visible after the board is touched", async () => {
    const { app } = await open(
      { name: "puzzle", params: { id: "tutorial-1" } },
      { fixture: "fresh" },
    );
    await click(app.container.querySelector("[data-brush='corner']"));
    expect(byText(app.container, "button", "Skip")).not.toBeNull();
  });

  it("never shows the onboarding to a returning profile", async () => {
    const { app, test } = await open({ name: "boot" }, { fixture: "mid" });
    expect(app.container.querySelector("[data-screen='onboarding']")).toBeNull();
    expect(app.container.querySelector("[data-screen='home']")).not.toBeNull();
    expect(test.router.current.name).toBe("home");
  });
});

describe("replay", () => {
  it("replays from Settings without touching stars or the flag", async () => {
    const { app, test } = await open({ name: "settings" }, { fixture: "mid" });
    const starsBefore = { ...test.env.services.progression.current().stars };
    await click(byText(app.container, "button", "Replay tutorial"));
    expect(test.router.current).toEqual({ name: "puzzle", params: { id: "tutorial-1" } });
    await flush(8);
    const record = getTutorial("tutorial-1");
    if (!record) throw new Error("missing tutorial");
    const solution = Uint8Array.from(record.solution, (c) => Number.parseInt(c, 16));
    await solveByTaps(app.container, puzzleFrom(record.code, "tutorial-1"), solution);
    expect(sheet(app.container)?.textContent).toContain("Puzzle solved");
    expect(done(test)).toBe(true);
    expect(test.env.services.progression.current().stars).toEqual(starsBefore);
  });
});

describe("coach cards", () => {
  it("show once per card, independently, and persist across launches", async () => {
    const first = await open(
      { name: "puzzle", params: { id: "bridge-01" } },
      { fixture: "finished" },
    );
    expect(sheet(first.app.container)?.textContent).toContain("Mirrors turn the light");
    await click(byText(first.app.container, "button", "Got it"));
    expect(sheet(first.app.container)).toBeNull();
    const stored = first.test.adapter.get("lantern-loops.ui");
    expect(await stored).toContain("bridge-01");
    expect(await first.test.env.services.flags.hasSeen("sky-01")).toBe(false);
    first.test.router.reset("puzzle", { id: "bridge-02" });
    await flush(6);
    expect(sheet(first.app.container)).toBeNull();
    first.test.router.reset("puzzle", { id: "bridge-01" });
    await flush(8);
    expect(sheet(first.app.container)).toBeNull();
    first.test.router.reset("puzzle", { id: "sky-01" });
    await flush(8);
    expect(sheet(first.app.container)?.textContent).toContain("Gates need a straight tile");
    await click(byText(first.app.container, "button", "Got it"));
    expect(await first.test.env.services.flags.hasSeen("sky-01")).toBe(true);
    expect(await first.test.env.services.flags.hasSeen("bridge-01")).toBe(true);
  });

  it("do not appear on other puzzles", async () => {
    const { app } = await open(
      { name: "puzzle", params: { id: "bridge-02" } },
      { fixture: "finished" },
    );
    expect(sheet(app.container)).toBeNull();
  });
});
