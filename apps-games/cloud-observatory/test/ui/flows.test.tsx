import { afterEach, describe, expect, it } from "vitest";
import { PROFILE_KEY } from "../../src/save/profile-store";
import { START_MS } from "../session/harness";
import { cleanup, goTab, openScreen, type Rendered, renderApp } from "./harness";

afterEach(cleanup);

const game = (r: Rendered) => r.harness.session.snapshot().profile.game;

async function tapAll(r: Rendered, count: number): Promise<void> {
  for (let index = 0; index < count; index += 1) {
    await r.click(r.q(`[data-star="${index}"]`));
  }
}

describe("Observe and Build", () => {
  it("tapping Gather adds starlight and plays the sound", async () => {
    const r = await renderApp({});
    expect(game(r).starlight).toBe(10);
    await r.click(r.q(".co-gather"));
    await r.click(r.q(".co-gather"));
    expect(game(r).starlight).toBe(12);
    expect(game(r).taps).toBe(2);
    expect(r.q(".co-header .co-num").getAttribute("data-value")).toBe("12");
    expect(r.feedback.sounds).toEqual(["gather", "gather"]);
  });

  it("buying an instrument updates its row, the header and unlocks the next row", async () => {
    const r = await renderApp({ seed: { game: { starlight: 100 } } });
    await goTab(r, "build");
    const lens = r.q("li[data-instrument='lens']");
    expect(lens.getAttribute("data-state")).toBe("locked");
    await r.click(r.q("[data-buy='telescope']"));
    expect(game(r).owned).toEqual({ telescope: 1 });
    expect(game(r).starlight).toBe(85);
    expect(r.q("li[data-instrument='telescope'] .co-row__meta").textContent).toContain("Owned 1");
    expect(r.q("li[data-instrument='lens']").getAttribute("data-state")).toBe("open");
    expect(r.feedback.sounds).toContain("buy");
  });

  it("locked rows and unaffordable rows cannot be bought", async () => {
    const r = await renderApp({ seed: { game: { starlight: 100 } } });
    await goTab(r, "build");
    const lens = r.q<HTMLButtonElement>("[data-buy='lens']");
    expect(lens.disabled).toBe(true);
    await r.click(lens);
    expect(game(r).owned.lens).toBeUndefined();
    const poor = await renderApp({ seed: { game: { starlight: 5 } } });
    await goTab(poor, "build");
    expect(poor.q<HTMLButtonElement>("[data-buy='telescope']").disabled).toBe(true);
  });

  it("the buy amount toggle switches between x1, x10 and Max", async () => {
    const r = await renderApp({ seed: { game: { starlight: 100000, owned: { telescope: 1 } } } });
    await goTab(r, "build");
    await r.click(r.q("[data-mode='10']"));
    await r.click(r.q("[data-buy='telescope']"));
    expect(game(r).owned.telescope).toBe(11);
    await r.click(r.q("[data-mode='max']"));
    const before = game(r).owned.telescope ?? 0;
    await r.click(r.q("[data-buy='telescope']"));
    expect(game(r).owned.telescope ?? 0).toBeGreaterThan(before + 10);
  });

  it("an affordable upgrade chip buys the upgrade, a locked one does nothing", async () => {
    const r = await renderApp({ seed: { game: { starlight: 10000, owned: { telescope: 10 } } } });
    await goTab(r, "build");
    const second = r.q("[data-upgrade='u-telescope-2']");
    expect(second.getAttribute("data-state")).toBe("locked");
    await r.click(second);
    expect(game(r).upgrades).toEqual([]);
    await r.click(r.q("[data-upgrade='u-telescope-1']"));
    expect(game(r).upgrades).toEqual(["u-telescope-1"]);
    expect(r.q("[data-upgrade='u-telescope-1']").getAttribute("data-state")).toBe("bought");
    expect(r.feedback.sounds).toContain("upgrade");
  });

  it("the first purchase shows a lore toast and a chapter card", async () => {
    const r = await renderApp({ seed: { game: { starlight: 100 } } });
    await goTab(r, "build");
    await r.click(r.q("[data-buy='telescope']"));
    expect(r.q(".wg-toast").textContent).toBe("New journal entry: The Key Under the Slate");
    expect(r.q("[data-sheet='chapter-card']").getAttribute("data-chapter")).toBe("1");
    await r.click(r.q("[data-sheet='chapter-card'] button"));
    expect(r.container.querySelector("[data-sheet='chapter-card']")).toBeNull();
    expect(r.feedback.sounds).toContain("lore");
  });
});

describe("Atlas and the Chart Table", () => {
  const ready = { game: { starlight: 100, owned: { telescope: 2 } } };

  it("a ready card opens the board with numbered targets", async () => {
    const r = await renderApp({ seed: ready });
    await goTab(r, "atlas");
    expect(r.q("li[data-constellation='lyre']").getAttribute("data-state")).toBe("ready");
    expect(r.q("li[data-constellation='crown']").getAttribute("data-state")).toBe("locked");
    await r.click(r.q("li[data-constellation='lyre'] .co-card-atlas__action"));
    expect(r.router.current.name).toBe("chart");
    expect(r.qa("[data-star]")).toHaveLength(5);
    expect(r.q("[data-star='0']").getAttribute("aria-label")).toBe("Star 1 of 5, next");
    expect(r.q("[data-star='1']").getAttribute("aria-label")).toBe("Star 2 of 5");
  });

  it("tapping the stars in order completes the chart and shows the summary", async () => {
    const r = await renderApp({ seed: ready });
    await goTab(r, "atlas");
    await r.click(r.q("li[data-constellation='lyre'] .co-card-atlas__action"));
    await tapAll(r, 4);
    expect(r.q("[data-pips]").querySelectorAll("[data-pip='on']")).toHaveLength(4);
    expect(r.container.querySelector("[data-sheet='chart-complete']")).toBeNull();
    await r.click(r.q('[data-star="4"]'));
    const sheet = r.q("[data-sheet='chart-complete']");
    expect(sheet.textContent).toContain("Flawless");
    expect(sheet.textContent).toContain("Starlight spent: 60");
    expect(sheet.textContent).toContain("The atlas bonus is now +5% starlight");
    expect(sheet.textContent).toContain("New journal entry: The Lyre Rises");
    expect(game(r).charted).toEqual(["lyre"]);
    expect(game(r).starlight).toBe(40);
    expect(r.feedback.sounds).toContain("chart-done");
    expect(r.feedback.haptics).toContain("success");
  });

  it("the completion sheet links to the new journal entry and returns to the atlas", async () => {
    const r = await renderApp({ seed: ready });
    await goTab(r, "atlas");
    await r.click(r.q("li[data-constellation='lyre'] .co-card-atlas__action"));
    await tapAll(r, 5);
    const link = Array.from(r.qa("[data-sheet='chart-complete'] button")).find(
      (button) => button.textContent === "Read the entry",
    );
    await r.click(link ?? null);
    expect(r.q("[data-reading='lore-03']").textContent).toContain("hums");
    await r.click(Array.from(r.qa("[data-reading] button")).at(-1) ?? null);
    const back = Array.from(r.qa("[data-sheet='chart-complete'] button")).find(
      (button) => button.textContent === "Back to the atlas",
    );
    await r.click(back ?? null);
    expect(r.router.current.name).toBe("shell");
    expect(r.q("li[data-constellation='lyre']").getAttribute("data-state")).toBe("charted");
  });

  it("a wrong tap shows the miss state, counts a mistake and loses the flawless mark", async () => {
    const r = await renderApp({ seed: ready });
    await goTab(r, "atlas");
    await r.click(r.q("li[data-constellation='lyre'] .co-card-atlas__action"));
    await r.click(r.q('[data-star="3"]'));
    expect(r.q('[data-star="3"]').classList.contains("co-star--miss")).toBe(true);
    expect(r.q('[data-star="3"] .co-shake')).toBeTruthy();
    expect(r.q("[data-mistakes]").textContent).toBe("Mistakes: 1");
    expect(r.q("[data-status]").textContent).toBe("Not that star. Find number 1.");
    expect(r.feedback.sounds).toContain("star-miss");
    expect(r.feedback.haptics).toContain("warning");
    await tapAll(r, 5);
    expect(r.q("[data-sheet='chart-complete']").textContent).toContain("Mistaken taps: 1");
  });

  it("cancelling abandons the chart without paying", async () => {
    const r = await renderApp({ seed: ready });
    await goTab(r, "atlas");
    await r.click(r.q("li[data-constellation='lyre'] .co-card-atlas__action"));
    await tapAll(r, 2);
    await r.click(r.q(".co-chart__cancel"));
    expect(r.router.current.name).toBe("shell");
    expect(game(r).charted).toEqual([]);
    expect(game(r).starlight).toBe(100);
    expect(r.harness.session.snapshot().chart).toBeNull();
  });
});

describe("Eclipse", () => {
  const rich = {
    game: {
      starlight: 5e9,
      cycleStarlight: 4e10,
      lifetimeStarlight: 4e10,
      owned: { telescope: 30 },
    },
  };

  it("the button needs 5 pending shards", async () => {
    const r = await renderApp({ seed: { game: { cycleStarlight: 1e10, starlight: 1e10 } } });
    await goTab(r, "eclipse");
    expect(r.q<HTMLButtonElement>(".co-eclipse-btn").disabled).toBe(true);
    expect(r.q(".co-eclipse-btn").textContent).toContain("need 2 more");
  });

  it("confirming resets the cycle, banks the shards and plays the sequence", async () => {
    const r = await renderApp({ seed: rich });
    await goTab(r, "eclipse");
    await r.click(r.q(".co-eclipse-btn"));
    const confirm = r.q("[data-sheet='eclipse-confirm']");
    expect(confirm.textContent).toContain("You will bank 6 Eclipse shards");
    expect(confirm.textContent).toContain("What resets");
    expect(confirm.textContent).toContain("What stays");
    expect(game(r).eclipses).toBe(0);
    await r.click(r.q(".co-eclipse-confirm"));
    expect(game(r).eclipses).toBe(1);
    expect(game(r).shards).toBe(6);
    expect(game(r).starlight).toBe(0);
    expect(game(r).owned).toEqual({});
    expect(game(r).cycleStarlight).toBe(0);
    expect(r.q("[data-sheet='eclipse-sequence']").textContent).toContain("Shards banked: 6");
    expect(r.feedback.sounds).toContain("eclipse");
    expect(r.feedback.haptics).toContain("medium");
  });

  it("cancelling the confirm changes nothing", async () => {
    const r = await renderApp({ seed: rich });
    await goTab(r, "eclipse");
    await r.click(r.q(".co-eclipse-btn"));
    const cancel = Array.from(r.qa("[data-sheet='eclipse-confirm'] button")).find(
      (button) => button.textContent === "Cancel",
    );
    await r.click(cancel ?? null);
    expect(game(r).eclipses).toBe(0);
    expect(r.container.querySelector("[data-sheet='eclipse-confirm']")).toBeNull();
  });

  it("buying a boon deducts shards and refuses what is out of reach", async () => {
    const r = await renderApp({ seed: { game: { shards: 5 } } });
    await goTab(r, "eclipse");
    expect(r.q<HTMLButtonElement>("[data-buy-boon='totality']").disabled).toBe(true);
    expect(r.q("li[data-boon='totality'] .co-boon__cost").textContent).toContain("need 35 more");
    await r.click(r.q("[data-buy-boon='clear-glass']"));
    expect(game(r).shards).toBe(2);
    expect(game(r).boons).toEqual(["clear-glass"]);
    expect(r.q("li[data-boon='clear-glass']").getAttribute("data-state")).toBe("owned");
    await r.click(r.q("[data-buy-boon='clear-glass']"));
    expect(game(r).shards).toBe(2);
  });
});

describe("Journal", () => {
  it("opens an unlocked entry, marks it read, and ignores a locked one", async () => {
    const r = await renderApp({ seed: { game: { owned: { telescope: 1 } } } });
    await goTab(r, "journal");
    const entry = r.q("[data-entry='lore-01']");
    expect(entry.getAttribute("data-state")).toBe("unread");
    await r.click(entry);
    expect(r.q("[data-reading='lore-01']").textContent).toContain("iron key");
    expect(r.harness.session.snapshot().profile.loreSeen).toEqual(["lore-01"]);
    await r.click(Array.from(r.qa("[data-reading] button")).at(-1) ?? null);
    expect(r.q("[data-entry='lore-01']").getAttribute("data-state")).toBe("read");
    await r.click(r.q("[data-entry='lore-30']"));
    expect(r.container.querySelector("[data-reading]")).toBeNull();
    expect(r.q("[data-entry='lore-30'] .co-entry__sub").textContent).toBe(
      "Unlocks with the boon Totality",
    );
  });
});

describe("Comet", () => {
  const charted = { game: { charted: ["lyre"] } };

  it("tracing the six stars claims the reward once per date", async () => {
    const r = await renderApp({ seed: charted });
    await openScreen(r, "comet");
    expect(r.q("[data-streak]").textContent).toContain("Comet streak: 0");
    await tapAll(r, 6);
    const result = r.q("[data-comet-result='claimed']");
    expect(result.textContent).toBe("Comet traced");
    expect(r.q(".co-comet__result").textContent).toContain("Starlight gained: 1.00K");
    expect(r.q(".co-comet__result").textContent).toContain("Streak: 1");
    expect(r.harness.session.snapshot().profile.cometLastKey).toBe(r.harness.clock.dateKey());
    expect(r.feedback.sounds).toContain("comet");
    expect(r.harness.session.claimComet()).toMatchObject({ ok: false, reason: "already-claimed" });
    r.router.pop();
    await r.flush();
    await openScreen(r, "comet");
    expect(r.q("[data-comet-result]").getAttribute("data-comet-result")).toBe("claimed");
    expect(r.container.querySelector("[data-star]")).toBeNull();
  });

  it("a new date makes the comet ready again and extends the streak", async () => {
    const r = await renderApp({ seed: charted });
    await openScreen(r, "comet");
    await tapAll(r, 6);
    r.harness.clock.advanceDays(1);
    r.router.pop();
    await r.flush();
    await openScreen(r, "comet");
    expect(r.qa("[data-star]")).toHaveLength(6);
    await tapAll(r, 6);
    expect(r.q(".co-comet__result").textContent).toContain("Streak: 2");
  });
});

describe("Settings", () => {
  it("toggles persist through the kit settings store and drive the theme", async () => {
    const r = await renderApp({});
    await openScreen(r, "settings");
    const toggles = r.qa<HTMLButtonElement>("[role='switch']");
    const byName = (name: string) => toggles.find((toggle) => toggle.textContent === name);
    expect(byName("Sound")?.getAttribute("aria-checked")).toBe("true");
    await r.click(byName("Sound") ?? null);
    expect(byName("Sound")?.getAttribute("aria-checked")).toBe("false");
    await r.click(byName("High contrast") ?? null);
    await r.click(byName("Reduced motion") ?? null);
    await r.flush();
    const saved = JSON.parse(r.harness.adapter.entries.get("cloud-observatory.settings") ?? "{}");
    expect(saved.data).toMatchObject({ sound: false, highContrast: true, reducedMotion: true });
    expect(r.q(".co-app").getAttribute("data-contrast")).toBe("high");
    expect(r.q(".co-app").classList.contains("co-reduced")).toBe(true);
    expect(document.documentElement.dataset.contrast).toBe("high");
  });

  it("reset progress needs two confirmations, then returns to the title with a fresh game", async () => {
    const r = await renderApp({ seed: "mid" });
    await openScreen(r, "settings");
    const reset = Array.from(r.qa("button")).find((b) => b.textContent === "Reset progress");
    await r.click(reset ?? null);
    expect(r.q("[data-reset-step]").getAttribute("data-reset-step")).toBe("1");
    expect(game(r).charted).toHaveLength(2);
    await r.click(
      Array.from(r.qa("[data-reset-step] button")).find((b) => b.textContent === "Continue") ??
        null,
    );
    expect(r.q("[data-reset-step]").getAttribute("data-reset-step")).toBe("2");
    expect(game(r).charted).toHaveLength(2);
    await r.click(
      Array.from(r.qa("[data-reset-step] button")).find(
        (b) => b.textContent === "Yes, erase everything",
      ) ?? null,
    );
    await r.flush();
    expect(game(r).charted).toEqual([]);
    expect(game(r).starlight).toBe(10);
    expect(r.router.current.name).toBe("title");
  });

  it("cancelling the first step keeps everything", async () => {
    const r = await renderApp({ seed: "mid" });
    await openScreen(r, "settings");
    await r.click(
      Array.from(r.qa("button")).find((b) => b.textContent === "Reset progress") ?? null,
    );
    await r.click(
      Array.from(r.qa("[data-reset-step] button")).find((b) => b.textContent === "Cancel") ?? null,
    );
    expect(r.container.querySelector("[data-reset-step]")).toBeNull();
    expect(game(r).charted).toHaveLength(2);
  });
});

describe("Title and boot", () => {
  it("Begin enters the observatory", async () => {
    const r = await renderApp({ start: "title" });
    await r.click(
      Array.from(r.qa("button")).find((b) => b.textContent === "Begin Journey") ?? null,
    );
    expect(r.router.current.name).toBe("shell");
  });

  it("New Journey asks first, then erases and enters", async () => {
    const r = await renderApp({ seed: "mid", start: "title" });
    await r.click(Array.from(r.qa("button")).find((b) => b.textContent === "New Journey") ?? null);
    expect(game(r).charted).toHaveLength(2);
    await r.click(
      Array.from(r.qa("button")).find((b) => b.textContent === "Erase and begin again") ?? null,
    );
    await r.flush();
    expect(game(r).charted).toEqual([]);
    expect(r.router.current.name).toBe("shell");
  });

  it("the Welcome Back sheet shows what the instruments gathered while away", async () => {
    const r = await renderApp({
      seed: {
        game: { owned: { telescope: 10 }, starlight: 0 },
        profile: { lastSeenMs: START_MS - 2 * 3600 * 1000 },
      },
    });
    const sheet = r.q("[data-sheet='welcome-back']");
    expect(sheet.textContent).toContain("You were away for 2h 00m");
    expect(sheet.textContent).toContain("50% efficiency");
    expect(
      Number(sheet.querySelector("[data-gained]")?.getAttribute("data-gained")),
    ).toBeGreaterThan(0);
    await r.click(Array.from(sheet.querySelectorAll("button")).at(-1) ?? null);
    expect(r.container.querySelector("[data-sheet='welcome-back']")).toBeNull();
    expect(JSON.parse(r.harness.adapter.entries.get(PROFILE_KEY) ?? "{}")).toBeTruthy();
  });

  it("no Welcome Back sheet for a short absence", async () => {
    const r = await renderApp({
      seed: { game: { owned: { telescope: 10 } }, profile: { lastSeenMs: START_MS - 20_000 } },
    });
    expect(r.container.querySelector("[data-sheet='welcome-back']")).toBeNull();
  });
});
