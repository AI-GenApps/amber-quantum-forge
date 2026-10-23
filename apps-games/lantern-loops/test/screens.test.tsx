import { assertNoPlatformFontFallback } from "@web-games/kit";
import { afterEach, describe, expect, it } from "vitest";
import { FONT_FAMILIES } from "../src/theme/fonts";
import {
  byText,
  click,
  createTestEnv,
  type Fixture,
  flush,
  MONDAY_KEY,
  mountApp,
  removeAnimate,
  type TestEnv,
  type TestEnvOptions,
} from "./helpers/env";

type Mounted = Awaited<ReturnType<typeof mountApp>>;
let mounted: Mounted | null = null;

afterEach(() => {
  mounted?.unmount();
  mounted = null;
  document.body.replaceChildren();
  removeAnimate();
});

async function open(
  fixture: Fixture,
  route?: TestEnvOptions["route"],
  extra: Partial<TestEnvOptions> = {},
): Promise<{ app: Mounted; test: TestEnv }> {
  const test = await createTestEnv({ fixture, ...(route ? { route } : {}), ...extra });
  const app = await mountApp(test.env);
  mounted = app;
  return { app, test };
}

const text = (root: ParentNode, selector: string): string =>
  root.querySelector(selector)?.textContent ?? "";

describe("home", () => {
  it("shows a fresh profile", async () => {
    const { app } = await open("fresh");
    const root = app.container;
    expect(root.querySelector("[data-screen='home']")).not.toBeNull();
    expect(text(root, "h1")).toBe("Lantern Loops");
    expect(text(root, "[data-testid='home-streak']")).toBe("No streak yet");
    expect(text(root, "[data-testid='home-tokens']")).toContain("3 hint tokens");
    expect(root.textContent).toContain("Monday");
    expect(root.textContent).toContain("5 by 5");
    expect(root.textContent).toContain("Tier 1 of 7");
    expect(root.textContent).toContain("Today is waiting");
    expect(root.textContent).toContain("Streak freeze ready");
  });

  it("shows a streak mid-game and a solved tick when finished", async () => {
    const mid = await open("mid");
    expect(text(mid.app.container, "[data-testid='home-streak']")).toBe("4 day streak");
    expect(mid.app.container.textContent).not.toContain("Solved today");
    mid.app.unmount();
    document.body.replaceChildren();
    const done = await open("finished");
    expect(text(done.app.container, "[data-testid='home-streak']")).toBe("31 day streak");
    expect(done.app.container.textContent).toContain("Solved today");
    expect(text(done.app.container, "[data-testid='home-tokens']")).toContain("20 hint tokens");
  });

  it("navigates to every target", async () => {
    const targets: Array<[string, string]> = [
      ["Play campaign", "chapters"],
      ["Archive", "archive"],
      ["Statistics", "stats"],
      ["Settings", "settings"],
      ["How to play", "howto"],
      ["About and licences", "about"],
    ];
    for (const [label, route] of targets) {
      const { app, test } = await open("mid");
      await click(byText(app.container, "button", label));
      expect(test.router.current.name, label).toBe(route);
      app.unmount();
      document.body.replaceChildren();
    }
    const { app, test } = await open("mid");
    await click(app.container.querySelector(".ll-daily-card"));
    expect(test.router.current.name).toBe("daily");
  });
});

describe("chapters", () => {
  it("locks Garden, Bridge and Sky on a fresh profile with the star thresholds", async () => {
    const { app } = await open("fresh", { name: "chapters" });
    const cards = (id: string): HTMLElement =>
      app.container.querySelector(`[data-chapter='${id}']`) as HTMLElement;
    expect(cards("harbor").getAttribute("data-locked")).toBe("false");
    expect(cards("garden").getAttribute("data-locked")).toBe("true");
    expect(cards("garden").textContent).toContain("45 stars to go");
    expect(cards("bridge").textContent).toContain("120 stars to go");
    expect(cards("sky").textContent).toContain("210 stars to go");
    expect((cards("garden") as HTMLButtonElement).disabled).toBe(true);
  });

  it("opens Garden mid-game and counts down to the next thresholds", async () => {
    const { app, test } = await open("mid", { name: "chapters" });
    const cards = (id: string): HTMLElement =>
      app.container.querySelector(`[data-chapter='${id}']`) as HTMLElement;
    expect(cards("garden").getAttribute("data-locked")).toBe("false");
    expect(cards("harbor").textContent).toContain("60 of 90 stars");
    expect(cards("harbor").textContent).toContain("30 of 30 solved");
    expect(cards("bridge").textContent).toContain("60 stars to go");
    expect(cards("sky").textContent).toContain("150 stars to go");
    await click(cards("garden"));
    expect(test.router.current).toEqual({ name: "puzzleList", params: { chapter: "garden" } });
  });

  it("unlocks everything when finished", async () => {
    const { app } = await open("finished", { name: "chapters" });
    expect(app.container.querySelectorAll("[data-locked='true']")).toHaveLength(0);
    expect(app.container.textContent).toContain("360 stars in total");
  });
});

describe("puzzle list", () => {
  it("lists the 30 puzzles of a chapter with their stars", async () => {
    const { app, test } = await open("mid", { name: "puzzleList", params: { chapter: "harbor" } });
    const buttons = app.container.querySelectorAll<HTMLElement>("[data-puzzle]");
    expect(buttons).toHaveLength(30);
    expect(buttons[0]?.getAttribute("data-stars")).toBe("2");
    expect(buttons[0]?.getAttribute("aria-label")).toContain("2 stars");
    await click(buttons[4] ?? null);
    expect(test.router.current).toEqual({ name: "puzzle", params: { id: "harbor-05" } });
  });

  it("explains a locked chapter instead of listing puzzles", async () => {
    const { app } = await open("fresh", { name: "puzzleList", params: { chapter: "garden" } });
    expect(app.container.querySelectorAll("[data-puzzle]")).toHaveLength(0);
    expect(text(app.container, "[data-testid='list-locked']")).toContain("Earn 45 more stars");
  });
});

describe("daily", () => {
  it("shows the Monday tier on a fresh profile", async () => {
    const { app, test } = await open("fresh", { name: "daily" });
    const root = app.container;
    expect(root.textContent).toContain("Today, Monday");
    expect(text(root, "[data-testid='medallion']")).toContain("No medallion yet");
    expect(text(root, "[data-testid='mechanics-strip']")).toBe("Lanterns");
    expect(text(root, "[data-testid='daily-freeze']")).toBe("Freeze ready");
    expect(byText(root, "button", "Play today")).not.toBeNull();
    await click(byText(root, "button", "Play today"));
    expect(test.router.current).toEqual({ name: "puzzle", params: { id: `daily-${MONDAY_KEY}` } });
  });

  it("shows the medallion and links the mechanics", async () => {
    const { app, test } = await open("mid", { name: "daily" });
    expect(text(app.container, "[data-testid='medallion']")).toContain("Spark");
    expect(text(app.container, "[data-testid='daily-streak']")).toBe("Streak 4");
    await click(byText(app.container, ".ll-chip-btn", "Lanterns"));
    expect(test.router.current).toEqual({ name: "howto", params: { page: "basics" } });
  });

  it("shows the solved state and a replay button when finished", async () => {
    const { app } = await open("finished", { name: "daily" });
    expect(text(app.container, "[data-testid='medallion']")).toContain("Moon");
    expect(text(app.container, "[data-testid='daily-solved']")).toContain("3 stars");
    expect(byText(app.container, "button", "Replay today")).not.toBeNull();
  });

  it("lists the mechanics of a Saturday", async () => {
    const saturday = new Date(2026, 9, 24, 12);
    const { app } = await open("fresh", { name: "daily" }, { now: saturday });
    expect(text(app.container, "[data-testid='mechanics-strip']")).toBe(
      "LanternsStonesMirrorsGates and colours",
    );
  });
});

describe("archive", () => {
  it("lists the 30 previous dates and an empty completed tab", async () => {
    const { app, test } = await open("fresh", { name: "archive" });
    const root = app.container;
    const rows = root.querySelectorAll<HTMLElement>(".ll-archive-row");
    expect(rows).toHaveLength(30);
    expect(rows[0]?.getAttribute("data-date")).toBe("2026-10-18");
    expect(rows[29]?.getAttribute("data-date")).toBe("2026-09-19");
    await click(rows[0] ?? null);
    expect(test.router.current).toEqual({ name: "puzzle", params: { id: "daily-2026-10-18" } });
    test.router.pop();
    await flush();
    await click(byText(root, "[role='tab']", "Completed"));
    expect(root.querySelector("[data-testid='archive-empty']")).not.toBeNull();
    expect(root.querySelector("[data-art='empty-archive']")).not.toBeNull();
    expect(root.textContent).toContain("Nothing here yet");
  });

  it("moves solved dates to the completed tab", async () => {
    const { app } = await open("mid", { name: "archive" });
    expect(app.container.querySelectorAll(".ll-archive-row")).toHaveLength(28);
    await click(byText(app.container, "[role='tab']", "Completed"));
    const rows = app.container.querySelectorAll(".ll-archive-row");
    expect(rows).toHaveLength(2);
    expect(rows[0]?.getAttribute("data-date")).toBe("2026-10-18");
  });
});

describe("statistics", () => {
  it("shows zeros on a fresh profile", async () => {
    const { app } = await open("fresh", { name: "stats" });
    expect(app.container.textContent).toContain("0 / 120");
    expect(app.container.textContent).toContain("0 / 360");
    expect(app.container.querySelectorAll("[data-bar]")).toHaveLength(11);
    expect(app.container.querySelectorAll("svg[role='img']")).toHaveLength(2);
  });

  it("totals a finished profile and draws the bars", async () => {
    const { app } = await open("finished", { name: "stats" });
    expect(app.container.textContent).toContain("120 / 120");
    expect(app.container.textContent).toContain("360 / 360");
    const chapters = Array.from(app.container.querySelectorAll("[data-bar]")).slice(0, 4);
    expect(chapters.map((bar) => bar.getAttribute("data-value"))).toEqual(["90", "90", "90", "90"]);
  });

  it("counts dailies by weekday", async () => {
    const { app } = await open("mid", { name: "stats" });
    const weekdays = Array.from(app.container.querySelectorAll("[data-bar]")).slice(4);
    expect(weekdays.map((bar) => bar.getAttribute("data-bar"))).toEqual([
      "Mon",
      "Tue",
      "Wed",
      "Thu",
      "Fri",
      "Sat",
      "Sun",
    ]);
    expect(weekdays.map((bar) => bar.getAttribute("data-value"))).toEqual([
      "0",
      "0",
      "0",
      "0",
      "0",
      "1",
      "1",
    ]);
  });
});

describe("settings", () => {
  it("toggles kit settings and profile settings", async () => {
    const { app, test } = await open("mid", { name: "settings" });
    const toggle = (label: string): HTMLElement =>
      byText(app.container, "[role='switch']", label) as HTMLElement;
    expect(toggle("Sound").getAttribute("aria-checked")).toBe("true");
    await click(toggle("Sound"));
    expect(test.env.services.settings.get().sound).toBe(false);
    expect(toggle("Sound").getAttribute("aria-checked")).toBe("false");
    await click(toggle("High contrast"));
    expect(test.env.services.settings.get().highContrast).toBe(true);
    expect(document.documentElement.dataset.contrast).toBe("high");
    expect(test.env.services.progression.current().showTimer).toBe(false);
    await click(toggle("Show timer"));
    expect(test.env.services.progression.current().showTimer).toBe(true);
    await click(toggle("Hide path in shared grid"));
    expect(test.env.services.progression.current().hidePathInShare).toBe(false);
    await click(toggle("Show conflicts"));
    expect(test.env.services.progression.current().showConflicts).toBe(false);
  });

  it("replays the tutorial", async () => {
    const { app, test } = await open("mid", { name: "settings" });
    await click(byText(app.container, "button", "Replay tutorial"));
    expect(test.router.current).toEqual({ name: "puzzle", params: { id: "tutorial-1" } });
  });

  it("resets progress only after two confirmations", async () => {
    const { app, test } = await open("mid", { name: "settings" });
    const progression = test.env.services.progression;
    await click(byText(app.container, "button", "Reset progress"));
    expect(app.container.textContent).toContain("Reset all progress?");
    await click(byText(app.container, "button", "Cancel"));
    expect(Object.keys(progression.current().stars)).toHaveLength(30);
    await click(byText(app.container, "button", "Reset progress"));
    await click(byText(app.container, "button", "Yes, continue"));
    expect(app.container.textContent).toContain("This cannot be undone");
    expect(Object.keys(progression.current().stars)).toHaveLength(30);
    await click(byText(app.container, "button", "Erase everything"));
    await flush(10);
    expect(progression.current().stars).toEqual({});
    expect(progression.current().tokens).toBe(3);
    expect(app.container.textContent).toContain("Progress reset");
  });
});

describe("how to play, about and onboarding", () => {
  it("pages through the six how-to pages", async () => {
    const { app } = await open("mid", { name: "howto", params: { page: "mirrors" } });
    expect(text(app.container, "[data-testid='howto-position']")).toBe("Page 3 of 6");
    expect(app.container.querySelector("[data-page='mirrors']")).not.toBeNull();
    await click(byText(app.container, "button", "Next"));
    expect(app.container.querySelector("[data-page='gates']")).not.toBeNull();
    await click(byText(app.container, "button", "Previous"));
    await click(byText(app.container, "button", "Previous"));
    expect(app.container.querySelector("[data-page='stones']")).not.toBeNull();
  });

  it("lists the licences", async () => {
    const { app } = await open("mid", { name: "about" });
    expect(text(app.container, "[data-testid='version']")).toMatch(/^Version \d+\.\d+\.\d+$/);
    expect(app.container.textContent).toContain("SIL Open Font License");
    expect(app.container.textContent).toContain("CC0");
    expect(app.container.textContent).toContain("collects no data");
  });

  it("boots into onboarding on a fresh profile and into home otherwise", async () => {
    const fresh = await open("fresh", { name: "boot" });
    await flush(8);
    expect(fresh.app.container.querySelector("[data-screen='onboarding']")).not.toBeNull();
    await click(byText(fresh.app.container, "button", "Start practice"));
    expect(fresh.test.router.current).toEqual({ name: "puzzle", params: { id: "tutorial-1" } });
    fresh.app.unmount();
    document.body.replaceChildren();
    const back = await open("fresh", { name: "boot" });
    await flush(8);
    await click(byText(back.app.container, "button", "Skip"));
    expect(back.test.router.current.name).toBe("home");
    expect(back.test.env.services.progression.current().onboardingDone).toBe(true);
    back.app.unmount();
    document.body.replaceChildren();
    const done = await open("mid", { name: "boot" });
    await flush(8);
    expect(done.app.container.querySelector("[data-screen='home']")).not.toBeNull();
  });
});

describe("fonts on every screen", () => {
  const routes: Array<[string, NonNullable<TestEnvOptions["route"]>]> = [
    ["boot", { name: "boot" }],
    ["home", { name: "home" }],
    ["onboarding", { name: "onboarding" }],
    ["chapters", { name: "chapters" }],
    ["puzzleList", { name: "puzzleList", params: { chapter: "harbor" } }],
    ["daily", { name: "daily" }],
    ["archive", { name: "archive" }],
    ["stats", { name: "stats" }],
    ["settings", { name: "settings" }],
    ["howto", { name: "howto", params: { page: "basics" } }],
    ["about", { name: "about" }],
    ["puzzle", { name: "puzzle", params: { id: "harbor-01" } }],
    ["tutorial", { name: "puzzle", params: { id: "tutorial-2" } }],
  ];

  it("renders no text outside Fraunces and Nunito and works without any art file", async () => {
    for (const fixture of ["fresh", "finished"] as const) {
      for (const [name, route] of routes) {
        const { app } = await open(fixture, route);
        await flush(6);
        expect(app.container.querySelector("[data-screen]"), `${fixture} ${name}`).not.toBeNull();
        expect(() =>
          assertNoPlatformFontFallback(app.container, { families: [...FONT_FAMILIES] }),
        ).not.toThrow();
        app.unmount();
        document.body.replaceChildren();
      }
    }
  });
});
