import { MAPS, REGIONS, START_COINS } from "@web-games/floodplain-dispatch-core";
import { afterEach, describe, expect, it } from "vitest";
import { buttonByText, click, mountApp, q, type Rig, starsFor, text, VALLEY_IDS } from "./helpers";

let rig: Rig | null = null;
afterEach(() => {
  rig?.unmount();
  rig = null;
  document.body.replaceChildren();
});

function names(root: ParentNode, selector: string): string[] {
  return Array.from(root.querySelectorAll(selector)).map(
    (el) => el.getAttribute("aria-label") ?? el.textContent ?? "",
  );
}

describe("boot", () => {
  it("shows progress while loading and routes home once the save and fonts are ready", async () => {
    let finish: () => void = () => undefined;
    let report: (fraction: number) => void = () => undefined;
    rig = await mountApp({
      route: ["boot"],
      preload: (onProgress) => {
        report = onProgress;
        return new Promise<void>((resolve) => {
          finish = resolve;
        });
      },
    });
    expect(q(rig.container, "[data-screen='boot']")).toBeTruthy();
    expect(q(rig.container, "h1").textContent).toBe("Floodplain Dispatch");
    const { act } = await import("preact/test-utils");
    await act(() => report(0.5));
    expect(q(rig.container, "[role='progressbar']").getAttribute("aria-valuenow")).toBe("50");
    expect(rig.app.router.current.name).toBe("boot");
    await act(async () => {
      finish();
      await Promise.resolve();
    });
    await rig.settle();
    expect(rig.app.router.current.name).toBe("home");
    expect(q(rig.container, "[data-screen='home']")).toBeTruthy();
  });

  it("still leaves boot when no preload is configured", async () => {
    rig = await mountApp({ route: ["boot"] });
    await rig.settle();
    expect(rig.app.router.current.name).toBe("home");
  });
});

describe("home", () => {
  it("shows stars, coins, the daily streak and every menu entry", async () => {
    rig = await mountApp({
      profile: {
        coins: 130,
        stars: starsFor(["v01", "v02"], 2),
        daily: { lastKey: "2026-10-20", streak: 4, bestStreak: 6, results: {} },
      },
    });
    const home = q(rig.container, "[data-screen='home']");
    expect(names(q(home, "[data-testid='statline']"), "span")).toEqual([
      "4 of 120 stars",
      "130 coins",
    ]);
    expect(text(home)).toContain("Daily Dispatch - Streak 4");
    expect(text(home)).toContain("5 more stars unlock Harvest Ochre");
    for (const label of ["Play", "Themes", "Records", "How to play", "Settings", "Credits"]) {
      expect(buttonByText(home, label)).toBeTruthy();
    }
  });

  it("starts with the default coins and routes every button", async () => {
    rig = await mountApp();
    expect(text(rig.container)).toContain(`${START_COINS} coins`);
    const routes: [string, string][] = [
      ["Play", "regions"],
      ["Themes", "themes"],
      ["Records", "records"],
      ["How to play", "howto"],
      ["Settings", "settings"],
      ["Credits", "credits"],
    ];
    for (const [label, route] of routes) {
      await click(buttonByText(rig.container, label));
      expect(rig.app.router.current.name).toBe(route);
      await click(buttonByText(rig.container, "Back"));
      expect(rig.app.router.current.name).toBe("home");
    }
    await click(buttonByText(rig.container, "Daily Dispatch"));
    expect(rig.app.router.current.name).toBe("daily");
  });
});

describe("regions", () => {
  it("lists four regions and locks Delta, Highland and Estuary on a new save", async () => {
    rig = await mountApp({ route: ["regions"] });
    const cards = Array.from(rig.container.querySelectorAll<HTMLButtonElement>(".fd-card"));
    expect(cards).toHaveLength(4);
    expect(cards.map((c) => c.dataset.region)).toEqual(REGIONS.map((r) => r.id));
    expect(cards.map((c) => c.disabled)).toEqual([false, true, true, true]);
    expect(cards[1]?.getAttribute("aria-label")).toBe("Delta, locked, needs 12 stars");
    await click(cards[1] as HTMLButtonElement);
    expect(rig.app.router.current.name).toBe("regions");
    await click(cards[0] as HTMLButtonElement);
    expect(rig.app.router.current).toMatchObject({ name: "levels", params: { region: "valley" } });
  });

  it("unlocks regions by total stars and shows star counts", async () => {
    rig = await mountApp({
      route: ["regions"],
      profile: { stars: starsFor(VALLEY_IDS, 2) },
    });
    const cards = Array.from(rig.container.querySelectorAll<HTMLButtonElement>(".fd-card"));
    expect(cards.map((c) => c.disabled)).toEqual([false, false, true, true]);
    expect(cards[0]?.getAttribute("aria-label")).toBe("Valley, 20 of 30 stars");
    expect(text(cards[2] as HTMLElement)).toContain("Needs 33 stars");
  });
});

describe("levels", () => {
  it("shows ten tiles, opens map 1 and keeps later maps locked until the previous one is cleared", async () => {
    rig = await mountApp({ route: ["levels", { region: "valley" }] });
    const tiles = Array.from(rig.container.querySelectorAll<HTMLButtonElement>(".fd-tile"));
    expect(tiles).toHaveLength(10);
    expect(tiles.map((t) => t.disabled)).toEqual([false, ...Array(9).fill(true)]);
    expect(tiles[0]?.getAttribute("aria-label")).toBe("Map 1, First Trickle, 0 of 3 stars, par 6");
    expect(tiles[1]?.getAttribute("aria-label")).toBe("Map 2, Two Fields Over, locked");
    await click(tiles[1] as HTMLButtonElement);
    expect(rig.app.router.current.name).toBe("levels");
    await click(tiles[0] as HTMLButtonElement);
    expect(rig.app.router.current).toMatchObject({ name: "board", params: { mapId: "v01" } });
  });

  it("opens the next map after a clear and shows stars, par and best", async () => {
    rig = await mountApp({
      route: ["levels", { region: "valley" }],
      profile: {
        stars: { v01: 2 },
        best: { v01: { score: 410, stars: 2, spend: 7 } },
      },
    });
    const tiles = Array.from(rig.container.querySelectorAll<HTMLButtonElement>(".fd-tile"));
    expect(tiles[1]?.disabled).toBe(false);
    expect(tiles[2]?.disabled).toBe(true);
    expect(text(tiles[0] as HTMLElement)).toContain("Par 6 - Best 410");
    expect(tiles[0]?.querySelector("[role='img']")?.getAttribute("aria-label")).toBe(
      "2 of 3 stars",
    );
  });

  it("does not open a region that is still locked", async () => {
    rig = await mountApp({ route: ["levels", { region: "estuary" }] });
    expect(rig.container.querySelectorAll(".fd-tile")).toHaveLength(0);
    expect(text(rig.container)).toContain("Needs 60 stars");
  });
});

describe("board guards", () => {
  it("refuses a locked map and an unknown map", async () => {
    rig = await mountApp({ route: ["board", { mapId: "v05" }] });
    expect(rig.container.querySelector("[data-testid='board-canvas']")).toBeNull();
    expect(text(rig.container)).toContain("This map is locked");
    rig.unmount();
    rig = await mountApp({ route: ["board", { mapId: "zz" }] });
    expect(text(rig.container)).toContain("could not be found");
  });
});

describe("daily", () => {
  it("shows today's tier, the streak and the last 14 days", async () => {
    rig = await mountApp({
      route: ["daily"],
      profile: {
        coins: 100,
        streakFreezes: 1,
        daily: {
          lastKey: "2026-10-20",
          streak: 3,
          bestStreak: 5,
          results: {
            "2026-10-20": { stars: 3, score: 500 },
            "2026-10-19": { stars: 1, score: 200 },
          },
        },
      },
    });
    expect(text(q(rig.container, "[data-testid='daily-streak']"))).toBe("Streak 3, best 5");
    expect(text(q(rig.container, "[data-testid='daily-freezes']"))).toBe("Streak freezes 1 of 2");
    expect(text(q(rig.container, "[data-testid='daily-details']"))).toMatch(
      /^\d+ by \d+, \d+ weeks, \d+ houses, \d+ fields$/,
    );
    const days = names(rig.container, "[data-testid='daily-days'] li");
    expect(days).toHaveLength(14);
    expect(days[0]).toBe("2026-10-21: not played");
    expect(days[1]).toBe("2026-10-20: 3 of 3 stars");
    expect(days[2]).toBe("2026-10-19: 1 of 3 stars");
    await click(buttonByText(rig.container, "Play today's map"));
    expect(rig.app.router.current).toMatchObject({ name: "board", params: { daily: true } });
  });

  it("buys streak freezes until the limit and refuses when coins run out", async () => {
    rig = await mountApp({ route: ["daily"], profile: { coins: 65 } });
    await click(buttonByText(rig.container, "Buy a freeze, 30 coins"));
    await rig.flush();
    expect(rig.app.game.getState().profile).toMatchObject({ coins: 35, streakFreezes: 1 });
    await click(buttonByText(rig.container, "Buy a freeze, 30 coins"));
    await rig.flush();
    expect(rig.app.game.getState().profile).toMatchObject({ coins: 5, streakFreezes: 2 });
    expect(buttonByText(rig.container, "Freezes are full").disabled).toBe(true);
    expect(text(rig.container)).toContain("Freeze added");
  });

  it("explains a purchase that coins cannot cover", async () => {
    rig = await mountApp({ route: ["daily"], profile: { coins: 10 } });
    await click(buttonByText(rig.container, "Buy a freeze, 30 coins"));
    await rig.flush();
    expect(text(rig.container)).toContain("Not enough coins for a freeze");
    expect(rig.app.game.getState().profile.coins).toBe(10);
  });
});

describe("themes", () => {
  it("lists seven themes with locks and applies an unlocked one", async () => {
    rig = await mountApp({ route: ["themes"], profile: { stars: starsFor(VALLEY_IDS, 1) } });
    const rows = Array.from(rig.container.querySelectorAll<HTMLElement>(".fd-row"));
    expect(rows).toHaveLength(7);
    expect(rows.map((r) => r.dataset.state)).toEqual([
      "applied",
      "ready",
      "locked",
      "locked",
      "locked",
      "locked",
      "locked",
    ]);
    expect(text(rows[2] as HTMLElement)).toContain("Needs 27 stars");
    const lockedApply = rows[2]?.querySelector("button") as HTMLButtonElement;
    expect(lockedApply.disabled).toBe(true);
    await click(rows[1]?.querySelector("button") as HTMLButtonElement);
    await rig.flush();
    expect(rig.app.game.getState().profile.themeSelected).toBe("harvest-ochre");
    expect(
      Array.from(rig.container.querySelectorAll<HTMLElement>(".fd-row")).map(
        (r) => r.dataset.state,
      )[1],
    ).toBe("applied");
    expect(document.documentElement.style.getPropertyValue("--wg-color-background")).toBe(
      "#18231d",
    );
  });

  it("recolours the app background for the selected theme", async () => {
    rig = await mountApp({
      route: ["home"],
      profile: {
        stars: starsFor(
          MAPS.slice(0, 34).map((m) => m.id),
          3,
        ),
        themeSelected: "night-lantern",
      },
    });
    await rig.flush();
    expect(document.documentElement.style.getPropertyValue("--wg-color-background")).toBe(
      "#0f1a22",
    );
  });
});

describe("records", () => {
  it("shows totals, best scores and recent history", async () => {
    rig = await mountApp({
      route: ["records"],
      profile: {
        stars: { v01: 3, v02: 1 },
        best: {
          v01: { score: 520, stars: 3, spend: 6 },
          v02: { score: 300, stars: 1, spend: 9 },
        },
        history: [
          { kind: "campaign", id: "v01", stars: 3, score: 520, spend: 6 },
          { kind: "daily", id: "2026-10-20", stars: 2, score: 400, spend: 7 },
        ],
        daily: {
          lastKey: "2026-10-20",
          streak: 1,
          bestStreak: 4,
          results: { "2026-10-20": { stars: 2, score: 400 } },
        },
        stats: {
          seasons: 5,
          housesSupplied: 0,
          fieldsIrrigated: 0,
          housesFlooded: 0,
          hintsUsed: 0,
        },
      },
    });
    const totals = text(q(rig.container, "[data-testid='totals']"));
    expect(totals).toContain("Stars4");
    expect(totals).toContain("Maps cleared2");
    expect(totals).toContain("Three-star maps1");
    expect(totals).toContain("Daily days1");
    expect(totals).toContain("Best streak4");
    expect(totals).toContain("Seasons run5");
    expect(names(rig.container, "[data-testid='best-list'] li")).toEqual([
      "Valley 1 First Trickle: 520, 3 of 3 stars",
      "Valley 2 Two Fields Over: 300, 1 of 3 stars",
    ]);
    const history = names(rig.container, "[data-testid='history-list'] li");
    expect(history[0]).toBe("Daily 2026-10-20: 2 of 3 stars, score 400, spent 7");
    expect(history[1]).toBe("First Trickle: 3 of 3 stars, score 520, spent 6");
  });

  it("explains an empty record book", async () => {
    rig = await mountApp({ route: ["records"] });
    expect(text(rig.container)).toContain("No seasons yet");
  });
});

describe("settings", () => {
  it("toggles every switch, saves it and flips the contrast flag on the page", async () => {
    rig = await mountApp({ route: ["settings"] });
    const switches = Array.from(
      rig.container.querySelectorAll<HTMLButtonElement>("[role='switch']"),
    );
    expect(names(rig.container, "[role='switch']").map((n) => n.trim())).toEqual([
      "Sound effects",
      "Music",
      "Haptic feedback",
      "Reduce motion",
      "High contrast",
    ]);
    expect(switches.map((s) => s.getAttribute("aria-checked"))).toEqual([
      "true",
      "true",
      "true",
      "false",
      "false",
    ]);
    await click(switches[4] as HTMLButtonElement);
    await rig.flush();
    expect(rig.app.settings.get().highContrast).toBe(true);
    expect(document.documentElement.dataset.contrast).toBe("high");
    await click(switches[3] as HTMLButtonElement);
    await rig.flush();
    expect(document.documentElement.dataset.motion).toBe("reduced");
    await click(switches[0] as HTMLButtonElement);
    await rig.flush();
    expect(rig.app.settings.get()).toMatchObject({
      sound: false,
      reducedMotion: true,
      highContrast: true,
    });
  });

  it("resets progress only after confirmation", async () => {
    rig = await mountApp({ route: ["settings"], profile: { coins: 400, stars: { v01: 3 } } });
    await click(buttonByText(rig.container, "Reset progress"));
    expect(text(rig.container)).toContain("Reset all progress?");
    await click(buttonByText(rig.container, "Cancel"));
    expect(rig.app.game.getState().profile.coins).toBe(400);
    expect(rig.container.querySelector("[role='dialog']")).toBeNull();
    await click(buttonByText(rig.container, "Reset progress"));
    await click(buttonByText(rig.container, "Erase everything"));
    await rig.flush();
    await rig.flush();
    expect(rig.app.game.getState().profile).toMatchObject({ coins: START_COINS, stars: {} });
    expect(rig.app.router.current.name).toBe("home");
  });
});

describe("how to play and credits", () => {
  it("pages through six how-to pages", async () => {
    rig = await mountApp({ route: ["howto"] });
    expect(text(q(rig.container, "[data-testid='howto-count']"))).toBe("Page 1 of 6");
    expect(buttonByText(rig.container, "Previous page").disabled).toBe(true);
    for (let page = 2; page <= 6; page++) {
      await click(buttonByText(rig.container, "Next page"));
      expect(text(q(rig.container, "[data-testid='howto-count']"))).toBe(`Page ${page} of 6`);
    }
    expect(buttonByText(rig.container, "Next page").disabled).toBe(true);
    await click(buttonByText(rig.container, "Previous page"));
    expect(text(q(rig.container, "[data-testid='howto-count']"))).toBe("Page 5 of 6");
  });

  it("lists the fonts and audio with their licences and leaves art empty for now", async () => {
    rig = await mountApp({ route: ["credits"] });
    const body = text(rig.container);
    expect(body).toContain("Bricolage Grotesque, SIL Open Font License 1.1");
    expect(body).toContain("Atkinson Hyperlegible, SIL Open Font License 1.1");
    expect(body).toContain("place-canal.ogg, CC0 1.0");
    expect(body).toContain("music-menu.ogg, CC0");
    expect(body.match(/Nothing to list yet/g)).toHaveLength(1);
  });
});
