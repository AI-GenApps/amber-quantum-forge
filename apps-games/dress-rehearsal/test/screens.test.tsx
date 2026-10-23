import {
  AFFINITY_THRESHOLDS,
  CHALLENGES,
  CHAPTERS,
  CLIENTS,
  FREEZE_PRICE,
  MAX_FREEZES,
  PIECES,
  TOTAL_STARS,
} from "@web-games/dress-rehearsal-core";
import { afterEach, describe, expect, it } from "vitest";
import { createPreload } from "../src/boot/preload";
import { FONT_FACES } from "../src/fonts";
import {
  all,
  buttonByText,
  click,
  currentScreen,
  galleryEntry,
  mountApp,
  q,
  type Rig,
  starsFor,
  text,
} from "./helpers";
import { settle } from "./play";

let rig: Rig | null = null;

afterEach(() => {
  rig?.unmount();
  rig = null;
  document.body.replaceChildren();
  document.documentElement.removeAttribute("data-contrast");
  document.documentElement.removeAttribute("data-motion");
});

const RIVIERA = ["riv-01", "riv-02", "riv-03", "riv-04", "riv-05", "riv-06", "riv-07"];

describe("boot", () => {
  it("shows progress while fonts load and then opens home", async () => {
    const seen: number[] = [];
    rig = await mountApp({
      route: ["boot"],
      preload: async (onProgress) => {
        for (const value of [0, 0.4, 1]) {
          seen.push(value);
          onProgress(value);
        }
      },
    });
    await settle(rig);
    expect(seen).toEqual([0, 0.4, 1]);
    expect(currentScreen(rig)).toBe("home");
  });

  it("stays on the loading screen until the preload finishes", async () => {
    let release: () => void = () => undefined;
    rig = await mountApp({
      route: ["boot"],
      preload: () => new Promise<void>((resolve) => (release = resolve)),
    });
    expect(q(rig.container, "[data-screen='boot']")).toBeTruthy();
    expect(q(rig.container, "[role='progressbar']").getAttribute("aria-valuenow")).toBe("0");
    release();
    await settle(rig);
    expect(currentScreen(rig)).toBe("home");
  });

  it("registers both bundled families and loads nothing when no art is listed", async () => {
    const urls: string[] = [];
    await createPreload({ loader: async (url) => void urls.push(url) })(() => undefined);
    expect(urls).toEqual([]);
    expect(document.getElementById("wg-fonts")?.textContent).toContain('"Playfair Display"');
    expect(document.getElementById("wg-fonts")?.textContent).toContain('"DM Sans"');
    expect(FONT_FACES).toHaveLength(3);
  });
});

describe("home", () => {
  it("shows the title, stars, coins, streak and every menu entry", async () => {
    rig = await mountApp({
      profile: {
        coins: 123,
        stars: starsFor(["riv-01", "riv-02"], 2),
        daily: { lastKey: "2026-10-22", streak: 4, bestStreak: 4, results: {} },
      },
    });
    const home = q(rig.container, "[data-screen='home']");
    expect(text(home)).toContain("Dress Rehearsal");
    expect(text(home)).toContain("Style the look. Meet the brief.");
    expect(text(q(home, "[data-testid='statline']"))).toContain(`4 of ${TOTAL_STARS} stars`);
    expect(text(q(home, "[data-testid='coins']"))).toContain("123");
    expect(text(home)).toContain("8 more stars open Gala Night");
    for (const label of [
      "Play",
      "Closet",
      "Clients",
      "Gallery",
      "How to play",
      "Settings",
      "Credits",
    ]) {
      expect(buttonByText(home, label)).toBeTruthy();
    }
    expect(text(buttonByText(home, "Daily Fitting - Streak 4"))).toBe("Daily Fitting - Streak 4");
  });

  it("opens every destination", async () => {
    const targets: [string, string][] = [
      ["Play", "chapters"],
      ["Daily Fitting", "daily"],
      ["Closet", "closet"],
      ["Clients", "clients"],
      ["Gallery", "gallery"],
      ["How to play", "howto"],
      ["Settings", "settings"],
      ["Credits", "credits"],
    ];
    for (const [label, route] of targets) {
      rig = await mountApp();
      await click(buttonByText(rig.container, label));
      expect(currentScreen(rig)).toBe(route);
      rig.unmount();
    }
    rig = null;
  });
});

describe("chapters and challenges", () => {
  it("lists six chapters with stars and keeps locked chapters closed", async () => {
    rig = await mountApp({ profile: { stars: starsFor(RIVIERA.slice(0, 2), 3) } });
    await click(buttonByText(rig.container, "Play"));
    const cards = all(rig.container, ".dr-chapter");
    expect(cards).toHaveLength(6);
    expect(cards.map((c) => c.dataset.locked)).toEqual([
      "false",
      "false",
      "true",
      "true",
      "true",
      "true",
    ]);
    expect(cards[0]?.getAttribute("aria-label")).toBe("Riviera Summer, 6 of 21 stars");
    expect(cards[3]?.getAttribute("aria-label")).toBe(
      "Mountain Weekend, locked, needs 27 stars in total",
    );
    expect(text(cards[2] as HTMLElement)).toContain("Gala Night");
    expect(cards[2]?.getAttribute("aria-label")).toBe(
      "Gala Night, locked, needs 12 stars in total",
    );
    for (const locked of cards.slice(2)) {
      expect((locked as HTMLButtonElement).disabled).toBe(true);
      await click(locked);
    }
    expect(currentScreen(rig)).toBe("chapters");
    expect(text(cards[3] as HTMLElement)).toContain("Needs 27 stars in total");
  });

  it("opens the gala chapter once 12 stars are earned", async () => {
    rig = await mountApp({
      route: ["chapters"],
      profile: { stars: starsFor(RIVIERA.slice(0, 4), 3) },
    });
    const gala = q(rig.container, "[data-chapter='gala']") as HTMLButtonElement;
    expect(gala.disabled).toBe(false);
    await click(gala);
    expect(currentScreen(rig)).toBe("challenges");
    expect(text(rig.container)).toContain("Gala Night");
    expect(all(rig.container, ".dr-tile")).toHaveLength(7);
  });

  it("shows tiles with best stars and opens the next only after a clear", async () => {
    rig = await mountApp({
      route: ["challenges", { chapter: 0 }],
      profile: { stars: { "riv-01": 2 } },
    });
    const tiles = all<HTMLButtonElement>(rig.container, ".dr-tile");
    expect(tiles).toHaveLength(7);
    expect(tiles.map((tile) => tile.disabled)).toEqual([
      false,
      false,
      true,
      true,
      true,
      true,
      true,
    ]);
    expect(tiles[0]?.getAttribute("aria-label")).toBe("Challenge 1, Harbour Lunch, 2 of 3 stars");
    expect(tiles[2]?.getAttribute("aria-label")).toBe("Challenge 3, Sunset Terrace, locked");
    expect(all(tiles[0] as HTMLElement, ".wg-star--on")).toHaveLength(2);
    expect(text(tiles[2] as HTMLElement)).toContain("Locked");
    await click(tiles[2] as HTMLElement);
    expect(currentScreen(rig)).toBe("challenges");
    await click(tiles[1] as HTMLElement);
    expect(currentScreen(rig)).toBe("styling");
  });

  it("refuses to open a locked challenge or chapter by route", async () => {
    rig = await mountApp({ route: ["styling", { challengeId: "riv-03" }] });
    expect(text(rig.container)).toContain("Clear the challenge before it first to open this one.");
    expect(document.body.querySelector("[data-testid='brief']")).toBeNull();
    rig.unmount();
    rig = await mountApp({ route: ["challenges", { chapter: 4 }] });
    expect(text(rig.container)).toContain("Needs 45 stars in total");
    expect(all(rig.container, ".dr-tile")).toHaveLength(0);
    rig.unmount();
    rig = await mountApp({ route: ["styling", { challengeId: "nope" }] });
    expect(text(rig.container)).toContain("could not be found");
    await click(buttonByText(rig.container, "Back"));
  });
});

describe("closet", () => {
  it("shows the 16 starting pieces and silhouettes for locked themes", async () => {
    rig = await mountApp({ route: ["closet"] });
    const themes = all(rig.container, ".dr-closet-theme");
    expect(themes).toHaveLength(6);
    expect(themes.map((el) => el.dataset.locked)).toEqual([
      "false",
      "false",
      "true",
      "true",
      "true",
      "true",
    ]);
    expect(all(rig.container, ".dr-closet-piece:not(.dr-closet-piece--locked)")).toHaveLength(16);
    expect(all(rig.container, ".dr-closet-piece--locked")).toHaveLength(32);
    const silhouette = q(rig.container, ".dr-closet-piece--locked");
    expect(silhouette.getAttribute("aria-label")).toMatch(/^Locked \w+, opens at 12 stars$/);
    expect(q(silhouette, ".dr-silhouette svg")).toBeTruthy();
    expect(text(rig.container)).not.toContain("Red Satin Column Gown");
    expect(text(rig.container)).toContain("Opens at 12 stars in total");
    const first = q(rig.container, ".dr-closet-piece[data-piece-id='item-riviera-1']");
    expect(text(first)).toContain("Breton Stripe Tee");
    expect(text(first)).toContain("White");
    expect(all(first, ".dr-tag")).toHaveLength(4);
    const hat = q(rig.container, ".dr-closet-piece[data-piece-id='item-riviera-7']");
    expect(all(hat, ".dr-tag")).toHaveLength(5);
  });

  it("shows a whole theme once its chapter opens", async () => {
    rig = await mountApp({
      route: ["closet"],
      profile: { stars: starsFor(RIVIERA.slice(0, 4), 3) },
    });
    expect(all(rig.container, ".dr-closet-piece:not(.dr-closet-piece--locked)")).toHaveLength(24);
    expect(text(rig.container)).toContain("Red Satin Column Gown");
    expect(PIECES).toHaveLength(48);
  });
});

describe("clients", () => {
  it("shows affinity, progress and the lines unlocked so far", async () => {
    const own = CHALLENGES.filter((def) => def.clientId === "mireille").slice(0, 3);
    rig = await mountApp({
      route: ["clients"],
      profile: {
        stars: starsFor(
          own.map((def) => def.id),
          3,
        ),
      },
    });
    const cards = all(rig.container, ".dr-client");
    expect(cards).toHaveLength(6);
    const mireille = q(rig.container, "[data-client='mireille']");
    expect(mireille.dataset.level).toBe("2");
    expect(text(q(mireille, "[data-testid='affinity-mireille']"))).toBe(
      "Affinity level 2 of 3 - 9 stars, next level at 15",
    );
    const lines = text(mireille);
    expect(lines).toContain(CLIENTS[0]?.lines.intro);
    expect(lines).toContain(CLIENTS[0]?.lines.level1);
    expect(lines).toContain(CLIENTS[0]?.lines.level2);
    expect(lines).not.toContain(CLIENTS[0]?.lines.level3);
    expect(lines).toContain(`Reach level 3 (${AFFINITY_THRESHOLDS[2]} stars) to hear more.`);
    const jun = q(rig.container, "[data-client='jun']");
    expect(jun.dataset.level).toBe("0");
    expect(all(jun, ".dr-lines__locked")).toHaveLength(3);
    expect(q(mireille, "[role='progressbar']").getAttribute("aria-valuemax")).toBe("15");
  });
});

describe("daily", () => {
  const profile = {
    coins: 100,
    streakFreezes: 0,
    daily: {
      lastKey: "2026-10-22",
      streak: 5,
      bestStreak: 7,
      results: {
        "2026-10-22": { stars: 2 as const, harmony: 75 },
        "2026-10-20": { stars: 3 as const, harmony: 90 },
      },
    },
  };

  it("shows today's challenge, the streak and the last 14 days", async () => {
    rig = await mountApp({ route: ["daily"], profile });
    expect(text(q(rig.container, "[data-testid='daily-tier']"))).toBe("Friday: 8 slots, 3 rules");
    expect(q(rig.container, "[data-testid='daily-brief']").textContent?.length).toBeGreaterThan(20);
    expect(all(rig.container, "[data-testid='daily-rules'] li")).toHaveLength(3);
    expect(text(q(rig.container, "[data-testid='daily-streak']"))).toBe("Streak 5 (best 7)");
    expect(text(q(rig.container, "[data-testid='daily-freezes']"))).toBe("Streak freezes 0 of 2");
    const days = all(rig.container, "[data-testid='daily-days'] li");
    expect(days).toHaveLength(14);
    expect(days[0]?.getAttribute("aria-label")).toBe("2026-10-23: not played");
    expect(days[1]?.getAttribute("aria-label")).toBe("2026-10-22: 2 of 3 stars");
    expect(days[3]?.getAttribute("aria-label")).toBe("2026-10-20: 3 of 3 stars");
    expect(text(days[0] as HTMLElement)).toContain("Today");
    expect(buttonByText(rig.container, "Play today's fitting")).toBeTruthy();
    await click(buttonByText(rig.container, "Play today's fitting"));
    expect(rig.app.router.current).toMatchObject({ name: "styling", params: { daily: true } });
  });

  it("buys streak freezes until the limit", async () => {
    rig = await mountApp({ route: ["daily"], profile });
    await click(buttonByText(rig.container, `Buy a freeze for ${FREEZE_PRICE} coins`));
    await settle(rig);
    expect(rig.app.game.getState().profile.coins).toBe(100 - FREEZE_PRICE);
    expect(rig.app.game.getState().profile.streakFreezes).toBe(1);
    expect(text(q(rig.container, "[data-testid='daily-freezes']"))).toBe("Streak freezes 1 of 2");
    await click(buttonByText(rig.container, `Buy a freeze for ${FREEZE_PRICE} coins`));
    await settle(rig);
    expect(rig.app.game.getState().profile.streakFreezes).toBe(MAX_FREEZES);
    const full = buttonByText(rig.container, "You hold the most freezes allowed.");
    expect(full.disabled).toBe(true);
  });

  it("explains a freeze that cannot be afforded", async () => {
    rig = await mountApp({ route: ["daily"], profile: { ...profile, coins: 5 } });
    await click(buttonByText(rig.container, `Buy a freeze for ${FREEZE_PRICE} coins`));
    await settle(rig);
    expect(text(q(rig.container, "[role='status']"))).toBe("Not enough coins for a freeze.");
    expect(rig.app.game.getState().profile.streakFreezes).toBe(0);
  });

  it("offers a replay once today is done", async () => {
    rig = await mountApp({
      route: ["daily"],
      profile: {
        daily: { ...profile.daily, results: { "2026-10-23": { stars: 1, harmony: 60 } } },
      },
    });
    expect(text(q(rig.container, "[data-testid='daily-today']"))).toBe(
      "Today's best: 1 of 3 stars, harmony 60",
    );
    expect(buttonByText(rig.container, "Play again")).toBeTruthy();
  });
});

describe("gallery", () => {
  it("shows 24 slots with saved boards, text, share and delete", async () => {
    rig = await mountApp({
      route: ["gallery"],
      profile: { gallery: [galleryEntry(1), { ...galleryEntry(2, "riv-02"), stars: 2 }] },
    });
    expect(text(q(rig.container, "[data-testid='gallery-count']"))).toBe("2 of 24 boards saved");
    expect(all(rig.container, ".dr-gallery__entry")).toHaveLength(2);
    expect(all(rig.container, "[data-empty='true']")).toHaveLength(22);
    const first = q(rig.container, ".dr-gallery__entry");
    expect(text(first)).toContain('Riviera Summer "Harbour Lunch": 3/3 stars, harmony 80');
    expect(all(first, ".dr-thumb__cell svg")).toHaveLength(6);
    expect(all(first, ".wg-star--on")).toHaveLength(3);
  });

  it("deletes a board after a confirm", async () => {
    rig = await mountApp({
      route: ["gallery"],
      profile: { gallery: [galleryEntry(1), galleryEntry(2)] },
    });
    const first = q(rig.container, ".dr-gallery__entry");
    await click(buttonByText(first, "Delete"));
    expect(text(q(document.body, ".dr-sheet"))).toContain("Delete this board?");
    await click(buttonByText(document.body, "Cancel"));
    expect(rig.app.game.getState().profile.gallery).toHaveLength(2);
    await click(buttonByText(first, "Delete"));
    await click(q(document.body, ".dr-sheet .wg-btn--danger"));
    await settle(rig);
    expect(rig.app.game.getState().profile.gallery).toHaveLength(1);
    expect(text(q(rig.container, "[data-testid='gallery-count']"))).toBe("1 of 24 boards saved");
  });

  it("opens the export sheet for a saved board", async () => {
    rig = await mountApp({ route: ["gallery"], profile: { gallery: [galleryEntry(1)] } });
    await click(buttonByText(q(rig.container, ".dr-gallery__entry"), "Share"));
    expect(q(document.body, "[data-testid='export']")).toBeTruthy();
    expect(rig.exporter.previewContext.count("fillText")).toBeGreaterThan(5);
    await click(buttonByText(document.body, "Done"));
    expect(document.body.querySelector("[data-testid='export']")).toBeNull();
  });

  it("exports a daily board whose challenge is no longer known", async () => {
    rig = await mountApp({
      route: ["gallery"],
      profile: {
        gallery: [
          {
            ...galleryEntry(1),
            kind: "daily",
            ref: "2026-10-20",
            look: { top: "item-riviera-1", shoes: "item-riviera-5" },
          },
        ],
      },
    });
    expect(text(q(rig.container, ".dr-gallery__text"))).toBe(
      "Dress Rehearsal Daily 2026-10-20: 3/3 stars, harmony 80",
    );
    await click(buttonByText(q(rig.container, ".dr-gallery__entry"), "Share"));
    const names = rig.exporter.previewContext.calls("fillText").map((call) => call[0]);
    expect(names).toContain("Daily Fitting");
    expect(names).toContain("Breton Stripe Tee");
  });
});

describe("settings", () => {
  it("toggles every setting and persists it", async () => {
    rig = await mountApp({ route: ["settings"] });
    const switches = all(rig.container, "[role='switch']");
    expect(switches).toHaveLength(5);
    expect(switches.map((el) => el.getAttribute("aria-checked"))).toEqual([
      "true",
      "true",
      "true",
      "false",
      "false",
    ]);
    for (const label of ["Sound effects", "Music", "Haptics", "Reduce motion", "High contrast"]) {
      await click(buttonByText(rig.container, label));
    }
    expect(rig.app.settings.get()).toMatchObject({
      sound: false,
      music: false,
      haptics: false,
      reducedMotion: true,
      highContrast: true,
    });
  });

  it("changes the theme flags for high contrast and reduced motion", async () => {
    rig = await mountApp({ route: ["settings"] });
    expect(document.documentElement.dataset.contrast).toBe("normal");
    expect(document.documentElement.dataset.motion).toBe("full");
    const normal = document.documentElement.style.getPropertyValue("--wg-color-border");
    await click(buttonByText(rig.container, "High contrast"));
    await click(buttonByText(rig.container, "Reduce motion"));
    expect(document.documentElement.dataset.contrast).toBe("high");
    expect(document.documentElement.dataset.motion).toBe("reduced");
    expect(document.documentElement.style.getPropertyValue("--wg-color-border")).not.toBe(normal);
    expect(document.documentElement.style.getPropertyValue("--wg-color-border")).toBe("#f6efe4");
  });

  it("resets progress only after a confirm", async () => {
    rig = await mountApp({ route: ["home"], profile: { coins: 500, stars: { "riv-01": 3 } } });
    await click(buttonByText(rig.container, "Settings"));
    await click(buttonByText(rig.container, "Reset progress"));
    expect(text(q(document.body, ".dr-sheet"))).toContain("Reset all progress?");
    await click(buttonByText(document.body, "Cancel"));
    expect(rig.app.game.getState().profile.coins).toBe(500);
    await click(buttonByText(rig.container, "Reset progress"));
    await click(buttonByText(document.body, "Reset"));
    await settle(rig);
    expect(rig.app.game.getState().profile.coins).toBe(40);
    expect(rig.app.game.getState().profile.stars).toEqual({});
    expect(currentScreen(rig)).toBe("home");
  });
});

describe("how to play and credits", () => {
  it("pages through six titled pages", async () => {
    rig = await mountApp({ route: ["howto"] });
    const titles: string[] = [];
    for (let page = 1; page <= 6; page++) {
      const section = q(rig.container, "[data-testid='howto-page']");
      expect(text(section)).toContain(`Page ${page} of 6`);
      titles.push(text(q(section, "h2")));
      if (page < 6) await click(buttonByText(rig.container, "Next"));
    }
    expect(titles).toEqual([
      "The brief",
      "Pieces and slots",
      "Rules",
      "Harmony",
      "Stars and scoring",
      "Daily Fitting and Gallery",
    ]);
    expect(buttonByText(rig.container, "Next").disabled).toBe(true);
    await click(buttonByText(rig.container, "Previous"));
    expect(text(q(rig.container, "h2.dr-panel__title"))).toBe("Stars and scoring");
  });

  it("lists both fonts with their licence and says no audio or designer art ships yet", async () => {
    rig = await mountApp({ route: ["credits"] });
    const page = text(rig.container);
    expect(page).toContain("Playfair Display");
    expect(page).toContain("DM Sans");
    expect(page).toContain("SIL Open Font License 1.1");
    expect(page).toContain("No sound files are bundled yet.");
    expect(page).toContain("All art in this build is drawn in code.");
    expect(CHAPTERS).toHaveLength(6);
  });
});
