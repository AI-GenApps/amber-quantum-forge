import { describe, expect, it } from "vitest";
import { createHarness, toastKinds } from "./harness";

describe("new game", () => {
  it("starts with the opening state and an empty save", async () => {
    const h = await createHarness();
    const { profile, loaded, chart } = h.session.snapshot();
    expect(loaded).toBe(true);
    expect(chart).toBeNull();
    expect(profile.game.starlight).toBe(10);
    expect(profile.createdMs).toBe(h.clock.now());
    expect(h.savedText()).toBeUndefined();
  });

  it("gathers on tap, counts it in the stats and saves after a debounce", async () => {
    const h = await createHarness();
    for (let i = 0; i < 5; i++) expect(h.session.gather().ok).toBe(true);
    const { profile } = h.session.snapshot();
    expect(profile.game.starlight).toBe(15);
    expect(profile.game.taps).toBe(5);
    expect(profile.stats.taps).toBe(5);
    expect(h.savedText()).toBeUndefined();
  });

  it("buying the first Telescope opens chapter 1 and its first entry, then saves", async () => {
    const h = await createHarness();
    for (let i = 0; i < 5; i++) h.session.gather();
    const result = h.session.buyInstrument("telescope", 1);
    expect(result.ok).toBe(true);
    expect(toastKinds(result.toasts)).toEqual(["chapter:1", "lore:lore-01"]);
    const { profile } = h.session.snapshot();
    expect(profile.game.owned).toEqual({ telescope: 1 });
    expect(profile.game.starlight).toBe(0);
    expect(profile.loreUnlocked).toEqual(["lore-01"]);
    expect(h.session.buyInstrument("telescope", 1)).toMatchObject({
      ok: false,
      reason: "insufficient-starlight",
    });
    await h.scheduler.runAll();
    const saved = h.saved();
    expect(saved.game.owned).toEqual({ telescope: 1 });
    expect(saved.loreUnlocked).toEqual(["lore-01"]);
    expect(saved.lastSeenMs).toBe(h.clock.now());
  });

  it("rejects actions with a reason and no toasts", async () => {
    const h = await createHarness();
    expect(h.session.buyInstrument("lens", 1)).toEqual({
      ok: false,
      reason: "not-unlocked",
      toasts: [],
    });
    expect(h.session.buyUpgrade("u-telescope-1")).toMatchObject({ reason: "threshold-not-met" });
    expect(h.session.buyBoon("dark-adapted")).toMatchObject({ reason: "insufficient-shards" });
    expect(h.session.eclipse()).toMatchObject({ reason: "eclipse-unavailable" });
    expect(h.session.dispatch({ type: "buy-boon", id: "nope" })).toMatchObject({
      reason: "unknown-id",
    });
  });
});

describe("tick and upgrades", () => {
  it("adds production, counts active seconds and clamps huge steps", async () => {
    const h = await createHarness({ seed: { game: { owned: { telescope: 10 }, starlight: 0 } } });
    h.session.tick(5);
    const first = h.session.snapshot().profile;
    expect(first.game.starlight).toBeCloseTo(10, 9);
    expect(first.stats.activeSeconds).toBe(5);
    h.session.tick(10_000);
    const clamped = h.session.snapshot().profile;
    expect(clamped.stats.activeSeconds).toBe(35);
    h.session.tick(Number.NaN);
    h.session.tick(-4);
    expect(h.session.snapshot().profile).toBe(clamped);
  });

  it("tracks the best starlight per second", async () => {
    const h = await createHarness({
      seed: { game: { owned: { telescope: 10 }, starlight: 100000 } },
    });
    h.session.tick(1);
    expect(h.session.snapshot().profile.stats.bestStarlightPerSecond).toBeCloseTo(2.02, 9);
    h.session.buyInstrument("telescope", 10);
    h.session.tick(1);
    expect(h.session.snapshot().profile.stats.bestStarlightPerSecond).toBeCloseTo(4.04, 9);
  });

  it("saves after 10 seconds of play", async () => {
    const h = await createHarness({ seed: { game: { owned: { telescope: 10 } } } });
    for (let i = 0; i < 9; i++) h.session.tick(1);
    expect(h.scheduler.pending()).toBe(0);
    h.session.tick(1);
    expect(h.scheduler.pending()).toBe(1);
    await h.scheduler.runAll();
    expect(h.saved().stats.activeSeconds).toBe(10);
  });

  it("buys an upgrade and unlocks Telescope Row at 10 owned", async () => {
    const h = await createHarness({
      seed: { game: { owned: { telescope: 9 }, starlight: 100000 } },
    });
    const bought = h.session.buyInstrument("telescope", 1);
    expect(toastKinds(bought.toasts)).toEqual(["achievement:telescope-row"]);
    expect(h.session.buyUpgrade("u-telescope-1")).toMatchObject({ ok: true, toasts: [] });
    expect(h.session.buyUpgrade("u-telescope-1")).toMatchObject({ reason: "already-owned" });
    const { profile } = h.session.snapshot();
    expect(profile.game.upgrades).toEqual(["u-telescope-1"]);
    expect(profile.game.achievements).toEqual(["telescope-row"]);
    await h.scheduler.runAll();
    expect(h.saved().game.upgrades).toEqual(["u-telescope-1"]);
  });
});

describe("charting", () => {
  const LYRE = { game: { owned: { telescope: 2 }, starlight: 100 } };

  it("walks the Lyre with a mistake and completes it", async () => {
    const h = await createHarness({ seed: LYRE });
    const started = h.session.startChart("lyre");
    expect(started.ok).toBe(true);
    expect(h.session.snapshot().chart?.constellationId).toBe("lyre");
    expect(h.session.finishChart()).toMatchObject({ ok: false, reason: "session-incomplete" });
    expect(h.session.tapStar(2)).toBe("wrong");
    expect(h.session.tapStar(0)).toBe("correct");
    expect(h.session.tapStar(0)).toBe("repeat");
    expect(h.session.tapStar(99)).toBe("invalid");
    for (const index of [1, 2, 3]) expect(h.session.tapStar(index)).toBe("correct");
    expect(h.session.tapStar(4)).toBe("complete");
    const result = h.session.finishChart();
    expect(result).toMatchObject({ ok: true, flawless: false, mistakes: 1 });
    expect(toastKinds(result.toasts)).toContain("achievement:first-ink");
    expect(toastKinds(result.toasts)).not.toContain("achievement:steady-hand");
    const { profile, chart } = h.session.snapshot();
    expect(chart).toBeNull();
    expect(profile.game.charted).toEqual(["lyre"]);
    expect(profile.game.starlight).toBe(40);
    expect(profile.stats.charts).toBe(1);
    expect(profile.stats.flawlessCharts).toBe(0);
    await h.scheduler.runAll();
    expect(h.saved().game.charted).toEqual(["lyre"]);
  });

  it("awards Steady Hand for a flawless chart", async () => {
    const h = await createHarness({ seed: LYRE });
    h.session.startChart("lyre");
    for (let i = 0; i < 5; i++) h.session.tapStar(i);
    const result = h.session.finishChart();
    expect(result).toMatchObject({ ok: true, flawless: true, mistakes: 0 });
    expect(toastKinds(result.toasts)).toEqual(
      expect.arrayContaining(["achievement:steady-hand", "achievement:first-ink"]),
    );
    expect(h.session.snapshot().profile.stats.flawlessCharts).toBe(1);
  });

  it("refuses to start without the instrument or the starlight, and abandoning is free", async () => {
    const h = await createHarness({ seed: { game: { owned: { telescope: 1 }, starlight: 500 } } });
    expect(h.session.startChart("lyre")).toEqual({ ok: false, reason: "prerequisite-not-met" });
    expect(h.session.startChart("nope")).toEqual({ ok: false, reason: "unknown-id" });
    const poor = await createHarness({
      seed: { game: { owned: { telescope: 2 }, starlight: 59 } },
    });
    expect(poor.session.startChart("lyre")).toEqual({
      ok: false,
      reason: "insufficient-starlight",
    });
    const ok = await createHarness({ seed: LYRE });
    ok.session.startChart("lyre");
    ok.session.tapStar(0);
    ok.session.abandonChart();
    expect(ok.session.snapshot().chart).toBeNull();
    expect(ok.session.snapshot().profile.game.starlight).toBe(100);
    expect(ok.session.tapStar(0)).toBe("invalid");
  });

  it("keeps the chart open when the starlight was spent meanwhile", async () => {
    const h = await createHarness({ seed: LYRE });
    h.session.startChart("lyre");
    for (let i = 0; i < 5; i++) h.session.tapStar(i);
    h.session.buyInstrument("telescope", 3);
    expect(h.session.finishChart()).toMatchObject({ ok: false, reason: "insufficient-starlight" });
    expect(h.session.snapshot().chart).not.toBeNull();
  });
});

describe("eclipse and boons", () => {
  const READY = {
    game: {
      owned: { telescope: 40, lens: 20 },
      upgrades: ["u-telescope-1"],
      starlight: 5e9,
      cycleStarlight: 3e10,
      lifetimeStarlight: 3e10,
      charted: ["lyre"],
    },
  };

  it("eclipses, banks shards, resets the cycle and keeps the permanent progress", async () => {
    const h = await createHarness({ seed: READY });
    const result = h.session.eclipse();
    expect(result.ok).toBe(true);
    expect(toastKinds(result.toasts)).toContain("achievement:first-shadow");
    const { profile } = h.session.snapshot();
    expect(profile.game.shards).toBe(5);
    expect(profile.game.shardsEarned).toBe(5);
    expect(profile.game.eclipses).toBe(1);
    expect(profile.game.owned).toEqual({});
    expect(profile.game.upgrades).toEqual([]);
    expect(profile.game.cycleStarlight).toBe(0);
    expect(profile.game.charted).toEqual(["lyre"]);
    expect(profile.stats.eclipses).toBe(1);
    expect(profile.loreUnlocked).toEqual(expect.arrayContaining(["lore-01", "lore-02"]));
    await h.scheduler.runAll();
    expect(h.saved().game.shards).toBe(5);
  });

  it("spends shards on boons, records the lore and the stat", async () => {
    const h = await createHarness({ seed: { game: { shards: 3, shardsEarned: 3 } } });
    const result = h.session.buyBoon("dark-adapted");
    expect(result.ok).toBe(true);
    expect(result.toasts.some((toast) => toast.kind === "lore")).toBe(true);
    const { profile } = h.session.snapshot();
    expect(profile.game.shards).toBe(2);
    expect(profile.game.boons).toEqual(["dark-adapted"]);
    expect(profile.stats.shardsSpent).toBe(1);
    expect(h.session.buyBoon("dark-adapted")).toMatchObject({ reason: "already-owned" });
    expect(h.session.buyBoon("brass-polish").ok).toBe(true);
    expect(h.session.buyBoon("clear-glass")).toMatchObject({ reason: "insufficient-shards" });
    expect(h.session.snapshot().profile.stats.shardsSpent).toBe(3);
  });

  it("applies start-of-cycle boons on the next Eclipse", async () => {
    const h = await createHarness({
      seed: { game: { ...READY.game, boons: ["dark-adapted"], shards: 0 } },
    });
    h.session.eclipse();
    expect(h.session.snapshot().profile.game.starlight).toBe(1000);
  });
});
