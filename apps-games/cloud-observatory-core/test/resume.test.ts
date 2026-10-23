import { describe, expect, it } from "vitest";
import { evaluateAchievements } from "../src/achievement-eval";
import { applyOffline } from "../src/actions";
import { RULES } from "../src/constants";
import { CATALOG } from "../src/content/catalog";
import { starlightPerSecond } from "../src/economy";
import { markSeen, resume, WELCOME_MIN_SECONDS } from "../src/session-rules";
import { deepFreeze } from "./fixtures/catalog";
import { HOUR_MS, profileWith } from "./fixtures/profile";

const T0 = 1_700_000_000_000;

function producing(boons: string[] = []) {
  return profileWith({
    game: { owned: { telescope: 100 }, boons },
    profile: { lastSeenMs: T0 },
  });
}

describe("resume offline cases", () => {
  it("pays one minute at 50 percent", () => {
    const { profile, summary } = resume(producing(), T0 + 60_000, CATALOG);
    expect(summary.awaySeconds).toBe(60);
    expect(summary.gained).toBeCloseTo(20 * 60 * 0.5, 6);
    expect(summary.capped).toBe(false);
    expect(summary.worthShowing).toBe(true);
    expect(profile.lastSeenMs).toBe(T0 + 60_000);
  });

  it("does not offer the Welcome Back sheet for a few seconds away", () => {
    const { summary } = resume(producing(), T0 + (WELCOME_MIN_SECONDS - 1) * 1000, CATALOG);
    expect(summary.gained).toBeGreaterThan(0);
    expect(summary.worthShowing).toBe(false);
  });

  it("pays three hours", () => {
    const { summary, profile } = resume(producing(), T0 + 3 * HOUR_MS, CATALOG);
    expect(summary.secondsCounted).toBe(10800);
    expect(summary.gained).toBeCloseTo(20 * 10800 * 0.5, 6);
    expect(profile.game.starlight).toBeCloseTo(producing().game.starlight + summary.gained, 6);
    expect(profile.stats.offlineSecondsCollected).toBe(10800);
    expect(profile.stats.fullOfflineCollects).toBe(0);
  });

  it("counts exactly 8 hours as a full, uncapped collect", () => {
    const { summary, profile } = resume(producing(), T0 + 8 * HOUR_MS, CATALOG);
    expect(summary.secondsCounted).toBe(RULES.OFFLINE_CAP_SECONDS);
    expect(summary.capped).toBe(false);
    expect(summary.full).toBe(true);
    expect(profile.stats.fullOfflineCollects).toBe(1);
  });

  it("caps 30 hours at 8 hours", () => {
    const { summary } = resume(producing(), T0 + 30 * HOUR_MS, CATALOG);
    expect(summary.awaySeconds).toBe(30 * 3600);
    expect(summary.secondsCounted).toBe(RULES.OFFLINE_CAP_SECONDS);
    expect(summary.gained).toBeCloseTo(20 * RULES.OFFLINE_CAP_SECONDS * 0.5, 6);
    expect(summary.capped).toBe(true);
    expect(summary.full).toBe(true);
  });

  it("pays nothing when the clock went back and resets the seen time", () => {
    const profile = producing();
    const { summary, profile: next } = resume(profile, T0 - HOUR_MS, CATALOG);
    expect(summary.awaySeconds).toBe(0);
    expect(summary.gained).toBe(0);
    expect(next.game).toEqual(profile.game);
    expect(next.stats).toEqual(profile.stats);
    expect(next.lastSeenMs).toBe(T0 - HOUR_MS);
  });

  it("pays nothing for equal timestamps", () => {
    const profile = producing();
    const { summary, profile: next } = resume(profile, T0, CATALOG);
    expect(summary.gained).toBe(0);
    expect(summary.worthShowing).toBe(false);
    expect(next).toBe(profile);
  });

  it("never produces NaN, negative or infinite gains", () => {
    for (const now of [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, -5]) {
      const { summary, profile } = resume(producing(), now, CATALOG);
      expect(summary.gained).toBe(0);
      expect(Number.isFinite(summary.awaySeconds)).toBe(true);
      expect(profile.game.starlight).toBe(producing().game.starlight);
      expect(profile.lastSeenMs).toBe(T0);
    }
  });

  it("copes with a NaN stored timestamp", () => {
    const profile = { ...producing(), lastSeenMs: Number.NaN };
    const { summary } = resume(profile, T0, CATALOG);
    expect(summary.gained).toBe(0);
  });

  it("pays nothing with no production but still moves the seen time", () => {
    const profile = profileWith({ profile: { lastSeenMs: T0 } });
    const { summary, profile: next } = resume(profile, T0 + 10 * HOUR_MS, CATALOG);
    expect(summary.gained).toBe(0);
    expect(summary.full).toBe(false);
    expect(next.stats.fullOfflineCollects).toBe(0);
    expect(next.lastSeenMs).toBe(T0 + 10 * HOUR_MS);
  });
});

describe("resume efficiency and summary", () => {
  it("is 50, 75 and 100 percent by boon", () => {
    const base = resume(producing(), T0 + 1000_000, CATALOG).summary;
    const night = resume(producing(["night-watch"]), T0 + 1000_000, CATALOG).summary;
    const vigil = resume(producing(["night-watch", "long-vigil"]), T0 + 1000_000, CATALOG).summary;
    expect([base.efficiency, night.efficiency, vigil.efficiency]).toEqual([0.5, 0.75, 1]);
    expect(night.gained / base.gained).toBeCloseTo(1.5, 9);
    expect(vigil.gained / base.gained).toBeCloseTo(2, 9);
  });

  it("matches applyOffline exactly", () => {
    const profile = producing(["night-watch"]);
    const { summary, profile: next } = resume(profile, T0 + 5000_000, CATALOG);
    const direct = applyOffline(profile.game, 5000, CATALOG);
    expect(summary.gained).toBe(direct.gained);
    expect(summary.secondsCounted).toBe(direct.secondsCounted);
    expect(summary.capped).toBe(direct.capped);
    expect(next.game).toEqual(direct.state);
    expect(summary.perSecond).toBe(starlightPerSecond(profile.game, CATALOG));
  });

  it("unlocks long-sleep on a capped collect", () => {
    const { profile } = resume(producing(), T0 + 12 * HOUR_MS, CATALOG);
    expect(evaluateAchievements(profile, CATALOG)).toContain("long-sleep");
    const short = resume(producing(), T0 + 7 * HOUR_MS, CATALOG).profile;
    expect(evaluateAchievements(short, CATALOG)).not.toContain("long-sleep");
  });

  it("does not mutate frozen input", () => {
    const profile = deepFreeze(producing());
    expect(resume(profile, T0 + 60_000, CATALOG).summary.gained).toBeGreaterThan(0);
    expect(profile.lastSeenMs).toBe(T0);
  });
});

describe("markSeen", () => {
  it("records the time and keeps the object when unchanged", () => {
    const profile = producing();
    expect(markSeen(profile, T0 + 5).lastSeenMs).toBe(T0 + 5);
    expect(markSeen(profile, T0)).toBe(profile);
  });

  it("ignores NaN and negative times", () => {
    const profile = producing();
    expect(markSeen(profile, Number.NaN)).toBe(profile);
    expect(markSeen(profile, -1)).toBe(profile);
  });
});
