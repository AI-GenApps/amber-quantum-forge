import {
  CAMPAIGN_DAYS,
  DECOR,
  defaultProfile,
  getDay,
  type Profile,
  sceneFor,
} from "@web-games/the-last-window-core";
import { afterEach, describe, expect, it } from "vitest";
import { ROUTE_NAMES } from "../src/nav";
import { resultParams, sceneIds } from "./fixtures";
import {
  buttonByText,
  click,
  clickByText,
  currentScreen,
  hasButton,
  mountApp,
  profileOf,
  q,
  type Rig,
  text,
} from "./helpers";

let rig: Rig | null = null;

afterEach(() => {
  rig?.unmount();
  rig = null;
  document.body.replaceChildren();
});

async function mountRoute(options: Parameters<typeof mountApp>[0]): Promise<HTMLElement> {
  rig?.unmount();
  rig = await mountApp(options);
  return rig.container;
}

function profileWith(overrides: Partial<Profile>): Partial<Profile> {
  return { ...defaultProfile(), ...overrides };
}

describe("routes", () => {
  it("names the 14 routes of the spec", () => {
    expect([...ROUTE_NAMES].sort()).toEqual(
      [
        "credits",
        "day",
        "home",
        "howto",
        "journal",
        "late",
        "prep",
        "recipes",
        "result",
        "scene",
        "settings",
        "shift",
        "shop",
        "title",
      ].sort(),
    );
  });

  it("title waits for the save, then goes home on tap", async () => {
    const container = await mountRoute({ route: ["title"] });
    expect(q(container, "[data-screen='title']")).toBeTruthy();
    expect(q(container, "h1").textContent).toBe("The Last Window");
    await clickByText(container, "Tap to begin");
    expect(currentScreen(rig as Rig)).toBe("home");
  });

  it("home offers Continue Day N and hides the Late Shift before Day 14", async () => {
    const container = await mountRoute({ route: ["home"], profile: { day: 3, coins: 77 } });
    expect(text(container)).toContain("Day 3 - 77 coins");
    expect(hasButton(container, "Continue: Day 3")).toBe(true);
    for (const label of [
      "Journal",
      "Decor shop",
      "Recipe book",
      "Settings",
      "How to play",
      "Credits",
    ]) {
      expect(hasButton(container, label)).toBe(true);
    }
    expect(hasButton(container, "Late Shift")).toBe(false);
  });

  it("home shows the Late Shift once Day 14 is complete and no Continue button", async () => {
    const container = await mountRoute({ route: ["home"], profile: { day: 15 } });
    expect(hasButton(container, "Late Shift")).toBe(true);
    expect(container.textContent).toContain("Campaign complete");
    expect(container.textContent).toContain("The campaign is complete");
    expect(
      [...container.querySelectorAll("button")].some((b) => b.textContent?.startsWith("Continue")),
    ).toBe(false);
  });

  it("home offers the evening scenes that are still pending", async () => {
    const ids = sceneIds([1, 1]);
    const container = await mountRoute({
      route: ["home"],
      profile: {
        day: 2,
        pendingEvening: ids,
        regulars: {
          ...defaultProfile().regulars,
          1: { fp: 2, visits: 1, scenesDone: 0, choices: {}, ending: null },
        },
      },
    });
    await clickByText(container, "Evening scenes (1)");
    expect(currentScreen(rig as Rig)).toBe("scene");
  });

  it("day intro shows the title, weather, due regulars and new unlocks", async () => {
    const container = await mountRoute({ route: ["day", { day: 3 }] });
    const day = getDay(3);
    expect(text(container)).toContain(day.title);
    expect(text(container)).toContain("Weather: Rain");
    expect(container.querySelectorAll(".tlw-due__item")).toHaveLength(day.regularsDue.length);
    expect(text(container)).toContain("Tide Latte");
    await clickByText(container, "Plan the shelves");
    expect(currentScreen(rig as Rig)).toBe("prep");
    expect(rig?.app.router.current.params).toEqual({ kind: "day", day: 3 });
  });

  it("prep plans the shelves, suggests stock and pays for it", async () => {
    const container = await mountRoute({
      route: ["prep", { kind: "day", day: 4 }],
      profile: { day: 4, coins: 100 },
    });
    expect(text(container)).toContain("You have 100 coins.");
    expect(container.querySelectorAll("[aria-pressed]").length).toBeGreaterThan(0);
    await clickByText(container, "Suggest stock");
    const cost = q(container, "[data-testid='stock-cost']").textContent;
    expect(cost).toMatch(/Stock cost: \d+ coins/);
    await clickByText(container, "Open shop");
    await rig?.flush();
    expect(currentScreen(rig as Rig)).toBe("shift");
    expect(profileOf(rig as Rig).coins).toBeLessThan(100);
  });

  it("prep refuses a plan the player cannot afford", async () => {
    const container = await mountRoute({
      route: ["prep", { kind: "day", day: 5 }],
      profile: { day: 5, coins: 3 },
    });
    expect(container.querySelector("[data-testid='stock-problem']")).toBeNull();
    await click(
      q(
        container,
        "#prep-pastry ~ .tlw-grid [data-pastry], #prep-pastry ~ .tlw-grid button:last-child",
      ),
    );
    expect(q(container, "[data-testid='stock-problem']").textContent).toContain("Not enough coins");
    expect(buttonByText(container, "Open shop").disabled).toBe(true);
  });

  it("prep limits the shelf to its slots", async () => {
    const container = await mountRoute({
      route: ["prep", { kind: "day", day: 11 }],
      profile: { day: 11, coins: 500 },
    });
    const pastries = [
      ...container.querySelectorAll<HTMLButtonElement>("#prep-pastry ~ .tlw-grid button"),
    ];
    expect(pastries.length).toBeGreaterThanOrEqual(4);
    for (const button of pastries)
      if (button.getAttribute("aria-pressed") === "true") await click(button);
    for (const button of pastries.slice(0, 4)) await click(button);
    expect(
      container.querySelectorAll("#prep-pastry ~ .tlw-grid [aria-pressed='true']"),
    ).toHaveLength(3);
    expect(container.textContent).toContain("The shelf is full");
  });

  it("result shows the earnings, stars, hearts and what comes next", async () => {
    const container = await mountRoute({
      route: ["result", resultParams({ scenes: sceneIds([1, 1], [2, 1]) })],
    });
    expect(q(container, "[data-testid='result-title']").textContent).toBe("Day 1 complete");
    expect(q(container, "[role='img'][aria-label='3 of 3 stars']")).toBeTruthy();
    expect(text(q(container, "[data-testid='earnings']"))).toContain("66 coins");
    expect(text(q(container, "[data-testid='counts']"))).toContain("Delighted: 4");
    expect(container.textContent).toContain("Odile reached friendship level 1.");
    expect(q(container, "[data-testid='scene-count']").textContent).toBe(
      "2 story scenes are waiting.",
    );
    await clickByText(container, "Share");
    expect(rig?.shared[0]?.text).toBe(
      "The Last Window, Day 1: 3/3 stars, 6 of 6 customers smiling, 66 coins earned.",
    );
    await clickByText(container, "Read the evening scenes");
    expect(currentScreen(rig as Rig)).toBe("scene");
  });

  it("scene advances beat by beat and returns home", async () => {
    const [first] = sceneIds([1, 1]);
    const container = await mountRoute({
      route: ["scene", { ids: [first], index: 0, after: "home", replay: false }],
      profile: {
        day: 2,
        regulars: {
          ...defaultProfile().regulars,
          1: { fp: 2, visits: 1, scenesDone: 0, choices: {}, ending: null },
        },
        pendingEvening: [first as string],
      },
    });
    const script = sceneFor(1, 1);
    expect(script).not.toBeNull();
    let guard = 0;
    while (container.querySelector("[data-testid='dialogue']") && guard++ < 20) {
      await click(q(container, "[data-testid='dialogue']"));
    }
    expect(q(container, "[data-testid='scene-done']")).toBeTruthy();
    await rig?.flush();
    expect(profileOf(rig as Rig).regulars[1]?.scenesDone).toBe(1);
    await clickByText(container, "Continue");
    expect(currentScreen(rig as Rig)).toBe("home");
  });

  it("shop, journal, recipes, late, settings, how to play and credits render", async () => {
    const expectations: Array<[Parameters<typeof mountApp>[0], string, string]> = [
      [{ route: ["shop"] }, "shop", "Decor shop"],
      [{ route: ["journal"] }, "journal", "Journal"],
      [{ route: ["recipes"] }, "recipes", "Recipe book"],
      [{ route: ["late"], profile: { day: 15 } }, "late", "Late Shift"],
      [{ route: ["settings"] }, "settings", "Settings"],
      [{ route: ["howto"] }, "howto", "How to play"],
      [{ route: ["credits"] }, "credits", "Credits"],
    ];
    for (const [options, screen, title] of expectations) {
      const container = await mountRoute(options);
      expect(q(container, `[data-screen='${screen}']`)).toBeTruthy();
      expect(text(container)).toContain(title);
    }
  });

  it("covers the campaign length in the day intros", () => {
    expect(CAMPAIGN_DAYS).toBe(14);
    expect(DECOR).toHaveLength(8);
    expect(profileWith({}).day).toBe(1);
  });
});
