import {
  ACHIEVEMENTS,
  CASES,
  LEDGER,
  PEOPLE,
  THEMES,
  TOTAL_STAMPS,
} from "@web-games/lost-parcel-desk-core";
import { afterEach, describe, expect, it } from "vitest";
import {
  buttonByText,
  buttonStarting,
  click,
  closedRecord,
  mountApp,
  progress,
  q,
  qa,
  type Rig,
  tap,
  tapStarting,
  text,
} from "./helpers";

let rig: Rig | null = null;

afterEach(() => {
  rig?.unmount();
  rig = null;
  document.body.replaceChildren();
});

const ALL = CASES.map((item) => item.id);

describe("home", () => {
  it("shows the desk with the counters and every entry point", async () => {
    rig = await mountApp({ profile: { ...progress(["01", "02"], 3), postage: 77 } });
    const c = rig.container;
    expect(q(c, "[data-screen='home']")).not.toBeNull();
    expect(text(q(c, "[data-testid='postage']"))).toBe("77");
    expect(text(q(c, "[data-testid='stamp-total']"))).toBe(`Stamps 6 of ${TOTAL_STAMPS}`);
    for (const label of [
      "Case files",
      "Town map",
      "Almanac",
      "Ledger",
      "Achievements",
      "Records",
      "Desk themes",
      "How to play",
      "Settings",
      "Credits and licences",
    ]) {
      expect(buttonByText(c, label)).toBeTruthy();
    }
    expect(buttonStarting(c, "Daily Parcel")).toBeTruthy();
    expect(qa(c, "button").some((b) => (b.textContent ?? "").startsWith("Continue"))).toBe(false);
  });

  it("offers Continue when a case is in progress and shows the daily streak", async () => {
    rig = await mountApp({
      profile: { daily: { lastKey: "2026-10-20", streak: 4, bestStreak: 4, results: {} } },
    });
    expect(buttonByText(rig.container, "Daily Parcel - streak 4")).toBeTruthy();
    await tap(rig, "Case files");
    await tapStarting(rig, "Case 01");
    await tap(rig, "Open parcel");
    expect(rig.app.router.current.name).toBe("table");
    rig.app.router.reset("home");
    await rig.flush();
    await tap(rig, "Continue case 01");
    expect(rig.app.router.current.name).toBe("table");
  });
});

describe("case files", () => {
  it("lists 12 folders by chapter and locks what is not open", async () => {
    rig = await mountApp({ route: ["files"] });
    const c = rig.container;
    expect(qa(c, ".lp-folder")).toHaveLength(12);
    expect(qa(c, "section.lp-chapter")).toHaveLength(3);
    const folder = (id: string) => q<HTMLButtonElement>(c, `[data-case='${id}']`);
    expect(folder("01").disabled).toBe(false);
    expect(folder("02").disabled).toBe(true);
    expect(folder("05").disabled).toBe(true);
    expect(text(q(c, "[data-testid='chapter-lock-2']"))).toContain("Needs 7 stamps");
    await click(folder("02"));
    expect(rig.app.router.current.name).toBe("files");
  });

  it("opens the next case when the one before is closed and shows best stamps", async () => {
    rig = await mountApp({ route: ["files"], profile: progress(["01"], 2) });
    const c = rig.container;
    expect(q<HTMLButtonElement>(c, "[data-case='02']").disabled).toBe(false);
    expect(q<HTMLButtonElement>(c, "[data-case='03']").disabled).toBe(true);
    expect(q(c, "[data-case='01'] [role='img']").getAttribute("aria-label")).toBe("2 of 3 stamps");
    expect(text(q(c, "[data-case='01']"))).toContain("Delivered");
    await click(q(c, "[data-case='02']"));
    expect(rig.app.router.current).toMatchObject({ name: "intro", params: { caseId: "02" } });
  });

  it("keeps chapter 2 shut until the stamps and the last case of chapter 1 are in", async () => {
    rig = await mountApp({ route: ["files"], profile: progress(["01", "02", "03", "04"], 1) });
    expect(q<HTMLButtonElement>(rig.container, "[data-case='05']").disabled).toBe(true);
    rig.unmount();
    rig = await mountApp({ route: ["files"], profile: progress(["01", "02", "03"], 3) });
    expect(q<HTMLButtonElement>(rig.container, "[data-case='05']").disabled).toBe(true);
    rig.unmount();
    rig = await mountApp({ route: ["files"], profile: progress(["01", "02", "03", "04"], 2) });
    expect(q<HTMLButtonElement>(rig.container, "[data-case='05']").disabled).toBe(false);
  });

  it("shows the chapter story the first time and remembers it", async () => {
    rig = await mountApp({ route: ["files"], profile: { flags: {} } });
    const dialog = q(rig.container, "[role='dialog']");
    expect(text(dialog)).toContain("The Spring Backlog");
    expect(text(q(dialog, "[data-testid='chapter-text']"))).toContain("river has gone down");
    await tap(rig, "Carry on");
    expect(rig.container.querySelector("[role='dialog']")).toBeNull();
    expect(rig.app.game.getState().profile.flags["chapter-1-intro"]).toBe(true);
    await tap(rig, "Read the chapter story");
    expect(rig.container.querySelector("[role='dialog']")).not.toBeNull();
  });
});

describe("case intro", () => {
  it("shows the torn label and where the parcel was found, then opens it", async () => {
    rig = await mountApp({ route: ["intro", { caseId: "01" }] });
    const c = rig.container;
    expect(text(q(c, "[data-testid='label-text']"))).toContain("Addressee torn away");
    expect(text(q(c, "[data-testid='found-at']"))).toBe("Found at: The dead-letter shelf");
    expect(q(c, "[data-slot='parcel-closed']")).not.toBeNull();
    await tap(rig, "Open parcel");
    expect(rig.app.router.current).toMatchObject({ name: "table", params: { caseId: "01" } });
    expect(rig.app.game.getState().active?.id).toBe("01");
  });

  it("will not open a locked case", async () => {
    rig = await mountApp({ route: ["intro", { caseId: "05" }] });
    expect(text(rig.container)).toContain("not open yet");
    expect(rig.container.querySelector("[data-screen='intro'] .wg-btn--large")).toBeNull();
    await rig.app.game.startCase("05");
    expect(rig.app.game.getState().active).toBeNull();
  });

  it("offers the Daily Parcel from the daily screen", async () => {
    rig = await mountApp({ route: ["daily"] });
    await tap(rig, "Open today's parcel");
    expect(rig.app.router.current).toMatchObject({ name: "intro", params: { daily: true } });
    expect(text(q(rig.container, "[data-testid='found-at']"))).toContain("sorting-room floor");
    await tap(rig, "Open parcel");
    expect(rig.app.router.current.name).toBe("table");
    expect(rig.app.game.getState().active?.kind).toBe("daily");
  });
});

describe("evidence table", () => {
  it("lays out the 4 objects of case 01 and 5 of case 12", async () => {
    rig = await mountApp({ route: ["table", { caseId: "01" }] });
    await rig.flush();
    expect(qa(rig.container, "[data-object]")).toHaveLength(4);
    expect(text(q(rig.container, "[data-testid='tray-count']"))).toBe(
      "Clue tray: 0 of 5 found, 0 pinned",
    );
    rig.unmount();
    rig = await mountApp({
      route: ["table", { caseId: "12" }],
      profile: progress(ALL.slice(0, 11), 3),
    });
    await rig.flush();
    expect(qa(rig.container, "[data-object]")).toHaveLength(5);
  });

  it("pins and unpins from the tray", async () => {
    rig = await mountApp({ route: ["table", { caseId: "01" }] });
    await rig.flush();
    await click(q(rig.container, "[data-object='01-3']"));
    await rig.flush();
    expect(rig.app.router.current.name).toBe("viewer");
    rig.app.router.pop();
    await rig.flush();
    expect(text(q(rig.container, "[data-testid='tray-count']"))).toContain("1 of 5 found");
    const chip = q(rig.container, ".lp-chip");
    expect(chip.getAttribute("aria-pressed")).toBe("false");
    await click(chip);
    await rig.flush();
    expect(q(rig.container, ".lp-chip").getAttribute("aria-pressed")).toBe("true");
    expect(rig.app.game.getState().active?.state.pinnedClueIds).toEqual(["01-c2"]);
    await click(q(rig.container, ".lp-chip"));
    await rig.flush();
    expect(rig.app.game.getState().active?.state.pinnedClueIds).toEqual([]);
  });
});

describe("town map", () => {
  it("fills in the places of delivered cases and opens a case from a place", async () => {
    rig = await mountApp({ route: ["map"], profile: progress(["01", "02"], 3) });
    const c = rig.container;
    expect(qa(c, "[data-place]")).toHaveLength(12);
    expect(q(c, "[data-place='01']").getAttribute("data-state")).toBe("delivered");
    expect(q(c, "[data-place='03']").getAttribute("data-state")).toBe("open");
    expect(q(c, "[data-place='05']").getAttribute("data-state")).toBe("locked");
    expect(text(q(c, "[data-testid='map-count']"))).toContain("2 of 12");
    await click(q(c, "[data-place-button='05']"));
    expect(text(q(c, "[data-testid='map-note']"))).toBe("Case 05 is still locked.");
    await click(q(c, "[data-place-button='03']"));
    expect(rig.app.router.current).toMatchObject({ name: "intro", params: { caseId: "03" } });
  });

  it("opens a case from the drawn place", async () => {
    rig = await mountApp({ route: ["map"] });
    await click(q(rig.container, "g[data-place='01']"));
    expect(rig.app.router.current).toMatchObject({ name: "intro", params: { caseId: "01" } });
  });
});

describe("almanac", () => {
  it("lists the 24 clue entries and unlocks townsfolk when they are met", async () => {
    rig = await mountApp({ route: ["almanac", { tab: "clues" }], profile: progress(["01"], 3) });
    const c = rig.container;
    expect(qa(c, "[data-entry]")).toHaveLength(24);
    await click(buttonStarting(c, "Townsfolk"));
    expect(qa(c, ".lp-person")).toHaveLength(12);
    expect(qa(c, "[data-testid='unmet']")).toHaveLength(9);
    expect(text(c)).toContain("Odalie Fenn");
    expect(text(c)).not.toContain("Marguerite Oake");
  });

  it("highlights the entry it was opened for", async () => {
    rig = await mountApp({ route: ["almanac", { tab: "clues", entry: "look:red hair" }] });
    expect(q(rig.container, "[data-entry='look:red hair']").getAttribute("data-focused")).toBe(
      "true",
    );
    expect(qa(rig.container, "[data-focused='true']")).toHaveLength(1);
  });

  it("starts on the townsfolk tab when asked", async () => {
    rig = await mountApp({ route: ["almanac", { tab: "townsfolk" }] });
    expect(qa(rig.container, ".lp-person")).toHaveLength(PEOPLE.length);
  });
});

describe("ledger, achievements, records", () => {
  it("shows unlocked ledger fragments and seals the rest", async () => {
    rig = await mountApp({ route: ["ledger"], profile: progress(["01", "02", "03"], 3) });
    const c = rig.container;
    expect(text(q(c, "[data-testid='ledger-count']"))).toBe("3 of 12 fragments found.");
    expect(text(c)).toContain(LEDGER[0]?.text ?? "");
    expect(text(c)).toContain("Fragment 4 is sealed until case 04 is delivered.");
    await rig.flush();
    expect(rig.app.game.getState().profile.ledgerSeen["01"]).toBe(true);
  });

  it("lists the 12 achievements with earned and locked states", async () => {
    rig = await mountApp({
      route: ["achievements"],
      profile: { achievements: { "first-delivery": true } },
    });
    const c = rig.container;
    expect(qa(c, ".lp-badge")).toHaveLength(ACHIEVEMENTS.length);
    expect(text(q(c, "[data-testid='achievement-count']"))).toBe(
      `1 of ${ACHIEVEMENTS.length} earned.`,
    );
    expect(qa(c, "[data-state='earned']")).toHaveLength(1);
    expect(qa(c, "[data-state='locked']")).toHaveLength(ACHIEVEMENTS.length - 1);
  });

  it("shows best stamps, fastest time and hints per case and the totals", async () => {
    rig = await mountApp({
      route: ["records"],
      profile: {
        cases: { "01": { stamps: 3, bestTimeMs: 125_000, hintsOnBest: 1, closedCount: 2 } },
        stats: {
          accusations: 3,
          wrongAccusations: 0,
          hintsUsed: 1,
          cluesFound: 5,
          casesClosed: 1,
          dailiesCleared: 0,
        },
      },
    });
    const row = q(rig.container, "[data-case-row='01']");
    expect(text(row)).toContain("2:05");
    expect(text(row)).toContain("1");
    expect(qa(rig.container, "[data-case-row]")).toHaveLength(12);
    expect(text(q(rig.container, "[data-testid='totals']"))).toContain(`3 / ${TOTAL_STAMPS}`);
  });
});

describe("daily parcel", () => {
  it("shows today, the streak, the freezes and the last 14 days", async () => {
    rig = await mountApp({
      route: ["daily"],
      profile: {
        postage: 100,
        daily: {
          lastKey: "2026-10-20",
          streak: 3,
          bestStreak: 5,
          results: { "2026-10-20": { stamps: 2 }, "2026-10-19": { stamps: 3 } },
        },
      },
    });
    const c = rig.container;
    expect(text(q(c, "[data-testid='daily-date']"))).toBe("Wed 21 Oct");
    expect(text(q(c, "[data-testid='daily-streak']"))).toBe("Streak 3 days. Best 5.");
    expect(qa(c, "[data-day]")).toHaveLength(14);
    expect(text(q(c, "[data-day='2026-10-20']"))).toContain("2 stamps");
    await tap(rig, "Buy a streak freeze (30 postage)");
    expect(text(q(c, "[data-testid='daily-note']"))).toBe("Streak freeze added.");
    expect(rig.app.game.getState().profile.streakFreezes).toBe(1);
    expect(rig.app.game.getState().profile.postage).toBe(70);
    await tap(rig, "Buy a streak freeze (30 postage)");
    await tap(rig, "Buy a streak freeze (30 postage)");
    expect(text(q(c, "[data-testid='daily-note']"))).toBe("You already hold 2 freezes.");
  });

  it("explains a short purse", async () => {
    rig = await mountApp({ route: ["daily"], profile: { postage: 5 } });
    await tap(rig, "Buy a streak freeze (30 postage)");
    expect(text(q(rig.container, "[data-testid='daily-note']"))).toBe("A freeze costs 30 postage.");
  });
});

describe("desk themes", () => {
  it("shows 5 themes, locks what needs more stamps and applies an unlocked one", async () => {
    rig = await mountApp({ route: ["themes"], profile: progress(["01", "02"], 3) });
    const c = rig.container;
    expect(qa(c, "[data-theme-card]")).toHaveLength(THEMES.length);
    expect(text(q(c, "[data-theme-card='midnight-sorting-room']"))).toContain("Needs 24 stamps");
    const apply = (id: string) => q<HTMLButtonElement>(c, `[data-theme-card='${id}'] button`);
    expect(apply("mustard-riso").disabled).toBe(true);
    expect(apply("brick-ledger").disabled).toBe(true);
    expect(apply("teal-blotter").disabled).toBe(false);
    await click(apply("teal-blotter"));
    await rig.flush();
    expect(rig.app.game.getState().profile.themeSelected).toBe("teal-blotter");
    expect(document.documentElement.dataset.desk).toBe("teal-blotter");
    expect(apply("teal-blotter").disabled).toBe(true);
  });
});

describe("settings", () => {
  it("toggles the five switches and resets progress after a confirmation", async () => {
    rig = await mountApp({ route: ["settings"], profile: { ...progress(["01"], 3), postage: 99 } });
    const c = rig.container;
    expect(qa(c, "[role='switch']")).toHaveLength(5);
    const contrast = buttonByText(c, "High contrast");
    expect(contrast.getAttribute("aria-checked")).toBe("false");
    await click(contrast);
    await rig.flush();
    expect(rig.app.settings.get().highContrast).toBe(true);
    expect(document.documentElement.dataset.contrast).toBe("high");
    await tap(rig, "Reset progress");
    expect(text(q(c, "[role='dialog']"))).toContain("Reset all progress?");
    await tap(rig, "Cancel");
    expect(rig.app.game.getState().profile.postage).toBe(99);
    await tap(rig, "Reset progress");
    await tap(rig, "Erase everything");
    await rig.flush();
    expect(rig.app.game.getState().profile.postage).toBe(30);
    expect(rig.app.router.current.name).toBe("home");
  });
});

describe("how to play and credits", () => {
  it("pages through six pages", async () => {
    rig = await mountApp({ route: ["howto"] });
    const c = rig.container;
    expect(text(q(c, "[data-testid='howto-page']"))).toBe("Page 1 of 6");
    for (let i = 0; i < 5; i++) await tap(rig, "Next");
    expect(text(q(c, "[data-testid='howto-page']"))).toBe("Page 6 of 6");
    expect(buttonByText(c, "Next").disabled).toBe(true);
    await tap(rig, "Previous");
    expect(text(q(c, "[data-testid='howto-page']"))).toBe("Page 5 of 6");
  });

  it("lists the bundled fonts and their licence", async () => {
    rig = await mountApp({ route: ["credits"] });
    const c = rig.container;
    expect(text(c)).toContain("Courier Prime");
    expect(text(c)).toContain("IBM Plex Sans");
    expect(text(c)).toContain("SIL Open Font License 1.1");
    expect(text(c)).toContain("ui-tap.ogg");
    expect(text(c)).toContain("music-case.ogg");
  });
});

describe("fixtures", () => {
  it("builds closed records the core accepts", () => {
    expect(closedRecord(2).stamps).toBe(2);
  });
});
