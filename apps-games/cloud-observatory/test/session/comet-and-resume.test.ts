import { generateComet } from "@web-games/cloud-observatory-core";
import { createRng, dailySeed } from "@web-games/kit";
import { describe, expect, it } from "vitest";
import { createHarness, START_MS, toastKinds } from "./harness";

const HOUR = 3_600_000;
const CHARTED = { game: { charted: ["lyre"], owned: { telescope: 2 } } };

describe("daily comet", () => {
  it("is locked until the first constellation is charted", async () => {
    const h = await createHarness();
    expect(h.session.cometStatus()).toBe("locked");
    expect(h.session.claimComet()).toEqual({ ok: false, reason: "locked", toasts: [] });
  });

  it("builds the same pattern for the same date on every device, and a new one next day", async () => {
    const a = await createHarness({ seed: CHARTED });
    const b = await createHarness({ seed: CHARTED });
    const key = a.clock.dateKey();
    expect(key).toBe("2026-10-23");
    const expected = generateComet(createRng(dailySeed("cloud-observatory", key)));
    expect(a.session.cometPattern()).toEqual(expected);
    expect(b.session.cometPattern()).toEqual(expected);
    expect(a.session.cometPattern()).toHaveLength(6);
    a.clock.advanceDays(1);
    expect(a.session.cometPattern()).not.toEqual(expected);
  });

  it("claims once per date and refuses a second claim", async () => {
    const h = await createHarness({ seed: CHARTED });
    expect(h.session.cometStatus()).toBe("ready");
    const claim = h.session.claimComet();
    expect(claim).toMatchObject({ ok: true, streak: 1, shards: 0, reward: 1000 });
    expect(h.session.cometStatus()).toBe("claimed");
    expect(h.session.claimComet()).toEqual({ ok: false, reason: "already-claimed", toasts: [] });
    const { profile } = h.session.snapshot();
    expect(profile.game.starlight).toBe(1010);
    expect(profile.cometLastKey).toBe("2026-10-23");
    expect(profile.stats.cometsClaimed).toBe(1);
    await h.scheduler.runAll();
    expect(h.saved().cometLastKey).toBe("2026-10-23");
    expect(h.saved().cometStreak).toBe(1);
  });

  it("grows the streak across a date boundary, resets after a gap and keeps the longest", async () => {
    const h = await createHarness({ seed: CHARTED });
    h.session.claimComet();
    h.clock.advanceDays(1);
    expect(h.session.cometStatus()).toBe("ready");
    const second = h.session.claimComet();
    expect(second).toMatchObject({ ok: true, streak: 2, reward: 1100 });
    h.clock.advanceDays(3);
    const third = h.session.claimComet();
    expect(third).toMatchObject({ ok: true, streak: 1 });
    expect(toastKinds(third.ok ? third.toasts : [])).toEqual(["achievement:comet-chaser"]);
    const { profile } = h.session.snapshot();
    expect(profile.cometStreak).toBe(1);
    expect(profile.cometDays).toBe(3);
    expect(profile.stats.longestStreak).toBe(2);
  });

  it("crosses midnight on the clock itself", async () => {
    const h = await createHarness({ seed: CHARTED });
    h.session.claimComet();
    h.clock.set(Date.UTC(2026, 9, 23, 23, 59, 0));
    expect(h.session.cometStatus()).toBe("claimed");
    h.clock.advance(2 * 60_000);
    expect(h.clock.dateKey()).toBe("2026-10-24");
    expect(h.session.cometStatus()).toBe("ready");
  });

  it("ignores a clock that went back and keeps the streak", async () => {
    const h = await createHarness({ seed: CHARTED });
    h.session.claimComet();
    h.clock.advanceDays(1);
    h.session.claimComet();
    h.clock.setDateKey("2026-10-01");
    expect(h.session.cometStatus()).toBe("clock-went-back");
    expect(h.session.claimComet()).toEqual({ ok: false, reason: "clock-went-back", toasts: [] });
    expect(h.session.snapshot().profile.cometStreak).toBe(2);
    h.clock.setDateKey(null);
    h.clock.advanceDays(1);
    expect(h.session.claimComet()).toMatchObject({ ok: true, streak: 3 });
  });

  it("awards a shard and Seven Nights on the 7th consecutive day", async () => {
    const h = await createHarness({ seed: CHARTED });
    const shards: number[] = [];
    let last: readonly string[] = [];
    for (let day = 0; day < 7; day++) {
      const claim = h.session.claimComet();
      if (!claim.ok) throw new Error("expected a claim");
      shards.push(claim.shards);
      last = toastKinds(claim.toasts);
      h.clock.advanceDays(1);
    }
    expect(shards).toEqual([0, 0, 0, 0, 0, 0, 1]);
    expect(last).toEqual(["achievement:seven-nights"]);
    const { profile } = h.session.snapshot();
    expect(profile.game.shards).toBe(1);
    expect(profile.game.achievements).toEqual(["first-ink", "comet-chaser", "seven-nights"]);
    expect(profile.stats.longestStreak).toBe(7);
  });
});

describe("resume", () => {
  const AWAY = (hours: number) => ({
    game: { owned: { telescope: 100 } },
    profile: { lastSeenMs: START_MS - hours * HOUR },
  });

  it("pays offline progress, reports the summary and saves", async () => {
    const h = await createHarness({ seed: AWAY(3) });
    const summary = h.session.resume();
    expect(summary).toMatchObject({
      awaySeconds: 10800,
      secondsCounted: 10800,
      efficiency: 0.5,
      capped: false,
      worthShowing: true,
    });
    expect(summary?.gained).toBeCloseTo(20 * 10800 * 0.5, 6);
    const { profile } = h.session.snapshot();
    expect(profile.game.starlight).toBeCloseTo(10 + 108000, 6);
    expect(profile.stats.offlineSecondsCollected).toBe(10800);
    expect(profile.lastSeenMs).toBe(START_MS);
    await h.scheduler.runAll();
    expect(h.saved().lastSeenMs).toBe(START_MS);
    expect(h.session.resume()?.gained).toBe(0);
  });

  it("unlocks Long Sleep on a capped collect and caps at 8 hours", async () => {
    const h = await createHarness({ seed: AWAY(30) });
    const summary = h.session.resume();
    expect(summary?.secondsCounted).toBe(28800);
    expect(summary?.capped).toBe(true);
    expect(summary?.gained).toBeCloseTo(20 * 28800 * 0.5, 6);
    const ids = h.session.snapshot().profile.game.achievements;
    expect(ids).toContain("long-sleep");
    expect(h.toasts.map((toast) => (toast.kind === "achievement" ? toast.id : ""))).toContain(
      "long-sleep",
    );
  });

  it("pays nothing when the device clock went back", async () => {
    const h = await createHarness({
      seed: { ...AWAY(0), profile: { lastSeenMs: START_MS + HOUR } },
    });
    const summary = h.session.resume();
    expect(summary?.gained).toBe(0);
    expect(summary?.worthShowing).toBe(false);
    const { profile } = h.session.snapshot();
    expect(profile.game.starlight).toBe(10);
    expect(profile.lastSeenMs).toBe(START_MS);
  });

  it("does nothing before the profile is loaded", async () => {
    const h = await createHarness({ seed: AWAY(3), load: false });
    expect(h.session.resume()).toBeNull();
    expect(h.session.gather()).toEqual({ ok: false, toasts: [] });
    h.session.tick(5);
    expect(h.session.snapshot().loaded).toBe(false);
  });
});
