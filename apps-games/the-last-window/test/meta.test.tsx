import { DECOR, defaultProfile, getDay, type Profile } from "@web-games/the-last-window-core";
import { afterEach, describe, expect, it } from "vitest";
import {
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

async function open(route: Parameters<typeof mountApp>[0]) {
  rig = await mountApp(route);
  return rig.container;
}

function item(container: HTMLElement, id: string): HTMLButtonElement {
  return q<HTMLButtonElement>(container, `button[data-decor='${id}']`);
}

describe("decor shop", () => {
  it("lists eight items with price, effect and lock state", async () => {
    const container = await open({ route: ["shop"], profile: { day: 4, coins: 100 } });
    expect(container.querySelectorAll("[data-testid='shop-list'] li")).toHaveLength(8);
    expect(item(container, "decor-1").dataset.state).toBe("open");
    expect(item(container, "decor-1").getAttribute("aria-label")).toBe(
      "Window Seat Cushions, 80 coins",
    );
    expect(item(container, "decor-7").dataset.state).toBe("locked");
    expect(item(container, "decor-7").getAttribute("aria-label")).toBe(
      "Rain Chime, locked until Day 7",
    );
    expect(text(container)).toContain("Every customer waits 4 seconds longer.");
  });

  it("cannot open a locked item", async () => {
    const container = await open({ route: ["shop"], profile: { day: 2, coins: 5000 } });
    await click(item(container, "decor-8"));
    expect(container.querySelector("[role='dialog']")).toBeNull();
    await click(item(container, "decor-3"));
    expect(container.querySelector("[role='dialog']")).toBeNull();
    expect(profileOf(rig as Rig).owned).toEqual([]);
  });

  it("buys an item through the purchase sheet and shows it in the preview", async () => {
    const container = await open({ route: ["shop"], profile: { day: 4, coins: 100 } });
    await click(item(container, "decor-1"));
    const sheet = q(container, "[role='dialog']");
    expect(sheet.textContent).toContain("Buy Window Seat Cushions?");
    expect(sheet.textContent).toContain("You will have 20 left");
    await clickByText(container, "Buy it");
    await rig?.flush();
    expect(profileOf(rig as Rig).owned).toEqual(["decor-1"]);
    expect(profileOf(rig as Rig).coins).toBe(20);
    expect(item(container, "decor-1").dataset.state).toBe("owned");
    expect(container.querySelector(".tlw-preview [data-decor='decor-1']")).not.toBeNull();
    expect(container.textContent).toContain("Window Seat Cushions is now in the shop.");
    await click(item(container, "decor-1"));
    expect(container.querySelector("[role='dialog']")).toBeNull();
  });

  it("explains an unaffordable purchase and disables the buy button", async () => {
    const container = await open({ route: ["shop"], profile: { day: 4, coins: 50 } });
    await click(item(container, "decor-1"));
    expect(q(container, "[role='dialog']").textContent).toContain("You need 30 more coins.");
    const buy = [...container.querySelectorAll<HTMLButtonElement>("[role='dialog'] button")].find(
      (b) => b.textContent === "Buy it",
    );
    expect(buy?.disabled).toBe(true);
    await clickByText(container, "Cancel");
    expect(container.querySelector("[role='dialog']")).toBeNull();
    expect(profileOf(rig as Rig).coins).toBe(50);
  });

  it("previews the shop in the three weathers", async () => {
    const container = await open({ route: ["shop"] });
    for (const [label, slot] of [
      ["Morning", "interior-morning"],
      ["Rain", "interior-rain"],
      ["Evening", "interior-evening"],
    ] as const) {
      await clickByText(container, label);
      expect(q(container, ".tlw-preview .tlw-backdrop").dataset.slot).toBe(slot);
    }
    expect(DECOR).toHaveLength(8);
  });
});

describe("settings", () => {
  it("toggles sound, motion and contrast and writes the theme tokens", async () => {
    const container = await open({ route: ["settings"] });
    const root = document.documentElement;
    expect(root.dataset.contrast).toBe("normal");
    expect(root.style.getPropertyValue("--wg-color-background")).toBe("#1F2F45");
    await clickByText(container, "High contrast");
    expect(root.dataset.contrast).toBe("high");
    expect(root.style.getPropertyValue("--wg-color-background")).toBe("#0F1826");
    expect(root.style.getPropertyValue("--tlw-ink")).toBe("#1B1209");
    await clickByText(container, "Reduce motion");
    expect(root.dataset.motion).toBe("reduced");
    await clickByText(container, "Sound effects");
    expect(rig?.app.settings.get().sound).toBe(false);
    await clickByText(container, "High contrast");
    expect(root.dataset.contrast).toBe("normal");
  });

  it("scales the text with the large text switch and saves relaxed mode and the guide", async () => {
    const container = await open({ route: ["settings"] });
    const root = document.documentElement;
    expect(root.style.getPropertyValue("--tlw-text-scale")).toBe("1");
    await clickByText(container, "Large text (125 percent)");
    await rig?.flush();
    expect(profileOf(rig as Rig).settings.textSize).toBe("large");
    expect(root.style.getPropertyValue("--tlw-text-scale")).toBe("1.25");
    expect(root.dataset.textSize).toBe("large");
    await clickByText(container, "Relaxed mode (customers wait 50 percent longer)");
    await clickByText(container, "Recipe guide (glow on the next step)");
    await rig?.flush();
    expect(profileOf(rig as Rig).settings.relaxed).toBe(true);
    expect(profileOf(rig as Rig).settings.recipeGuide).toBe(false);
  });

  it("resets progress only after a confirmation and keeps the accessibility settings", async () => {
    const container = await open({
      route: ["settings"],
      profile: {
        day: 9,
        coins: 400,
        owned: ["decor-1"],
        settings: { recipeGuide: false, relaxed: true, textSize: "large" },
      },
    });
    await clickByText(container, "Reset progress");
    expect(q(container, "[role='dialog']").textContent).toContain("Reset all progress?");
    await clickByText(container, "Keep my game");
    expect(profileOf(rig as Rig).day).toBe(9);
    await clickByText(container, "Reset progress");
    await clickByText(container, "Erase progress");
    await rig?.flush();
    const after = profileOf(rig as Rig);
    expect(after.day).toBe(1);
    expect(after.owned).toEqual([]);
    expect(after.settings).toEqual({ recipeGuide: false, relaxed: true, textSize: "large" });
    expect(container.textContent).toContain("Progress erased.");
  });
});

describe("late shift lobby", () => {
  it("shows tonight's regulars, the streak, the lamp bonus and the records", async () => {
    const late: Profile["late"] = {
      count: 7,
      todayCount: 0,
      lastKey: "2026-10-20",
      streak: 3,
      bestStreak: 5,
      firstOfDayClaimed: true,
      records: { bestEarnings: 140, bestDelightedRun: 6 },
    };
    const container = await open({ route: ["late"], profile: { day: 15, late } });
    expect(text(q(container, "[data-testid='late-due']"))).toMatch(/^Tonight: \w/);
    expect(q(container, "[data-testid='late-lamp']").textContent).toBe(
      "Lamp Bonus: ready for tonight's first shift",
    );
    expect(q(container, "[data-testid='late-streak']").textContent).toBe("Streak: 3 days (best 5)");
    const records = text(q(container, "[data-testid='late-records']"));
    expect(records).toContain("Best shift: 140 coins");
    expect(records).toContain("Longest run of delighted customers: 6");
    expect(records).toContain("Late Shifts finished: 7");
    await clickByText(container, "Start Late Shift");
    expect(currentScreen(rig as Rig)).toBe("prep");
    expect(rig?.app.router.current.params).toEqual({ kind: "late" });
  });

  it("says the lamp bonus is collected once the first shift of the date was paid", async () => {
    const late: Profile["late"] = {
      ...defaultProfile().late,
      count: 1,
      todayCount: 1,
      lastKey: "2026-10-21",
      streak: 1,
      bestStreak: 1,
      firstOfDayClaimed: true,
    };
    const container = await open({ route: ["late"], profile: { day: 15, late } });
    expect(q(container, "[data-testid='late-lamp']").textContent).toBe(
      "Lamp Bonus: already collected today",
    );
    expect(text(container)).toContain("Late Shifts finished today: 1");
  });

  it("plays a Late Shift from prep to the result and pays the lamp bonus", async () => {
    const container = await open({
      route: ["late"],
      profile: { day: 15, coins: 100, late: { ...defaultProfile().late } },
    });
    await clickByText(container, "Start Late Shift");
    await clickByText(container, "Open shop");
    await rig?.flush();
    expect(currentScreen(rig as Rig)).toBe("shift");
    expect(container.textContent).toContain("Late Shift");
    await (rig as Rig).advance(400000, 100);
    expect(currentScreen(rig as Rig)).toBe("result");
    expect(q(container, "[data-testid='result-title']").textContent).toBe("Late Shift complete");
    expect(container.textContent).toContain("Lamp Bonus");
    expect(profileOf(rig as Rig).late.count).toBe(1);
    expect(profileOf(rig as Rig).late.lastKey).toBe("2026-10-21");
    expect(getDay(14).title).toBe("Lantern Night");
    expect(hasButton(container, "Back to the shop")).toBe(true);
  });
});

describe("journal and recipes", () => {
  it("lists the eight stories, replays finished scenes and fills the diary", async () => {
    const container = await open({
      route: ["journal"],
      profile: {
        day: 3,
        diary: [1, 2],
        regulars: {
          ...defaultProfile().regulars,
          1: { fp: 4, visits: 3, scenesDone: 2, choices: {}, ending: null },
        },
      },
    });
    expect(container.querySelectorAll("[data-testid='stories'] > li")).toHaveLength(8);
    const odile = q(container, "[data-regular='1']");
    expect(odile.textContent).toContain("The Light on Skerry Point");
    expect(odile.textContent).toContain("Scenes read: 2 of 5");
    expect(odile.textContent).toContain("Story in progress");
    expect(odile.querySelectorAll(".tlw-link")).toHaveLength(2);
    await click(q(odile, ".tlw-link"));
    expect(currentScreen(rig as Rig)).toBe("scene");
    expect(rig?.app.router.current.params).toMatchObject({ replay: true, after: "pop" });
    rig?.app.router.pop();
    await rig?.flush();
    await clickByText(container, "Shop Diary");
    expect(container.querySelectorAll("[data-testid='diary'] > li")).toHaveLength(2);
  });

  it("shows the ending title of a finished story", async () => {
    const container = await open({
      route: ["journal"],
      profile: {
        day: 15,
        regulars: {
          ...defaultProfile().regulars,
          1: { fp: 8, visits: 5, scenesDone: 5, choices: {}, ending: "b" },
        },
      },
    });
    expect(q(container, "[data-regular='1'] [data-testid='story-ending']").textContent).toBe(
      "Ending: The Lens on the Shelf",
    );
  });

  it("explains an empty diary", async () => {
    const container = await open({ route: ["journal"] });
    await clickByText(container, "Shop Diary");
    expect(container.textContent).toContain("No entries yet");
  });

  it("lists drinks, pastries, books and moods, hiding what is still locked", async () => {
    const container = await open({ route: ["recipes"], profile: { day: 1 } });
    const list = q(container, "[data-testid='recipe-list']");
    expect(text(list)).toContain("Steps: Cup, Brew (0.8 s), Pour");
    expect(text(list)).toContain("Not unlocked yet");
    expect(list.querySelectorAll("li[data-open='true']").length).toBeGreaterThan(3);
    expect(list.querySelectorAll("li[data-open='false']").length).toBeGreaterThan(5);
    expect(text(list)).toContain("Comforting");
  });
});
