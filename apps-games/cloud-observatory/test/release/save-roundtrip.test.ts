import type { Profile } from "@web-games/cloud-observatory-core";
import { createMemoryAdapter } from "@web-games/kit";
import { describe, expect, it } from "vitest";
import { PROFILE_KEY } from "../../src/save/profile-store";
import { createHarness, type Harness, START_MS } from "../session/harness";
import { newTally, playFor } from "./bot";

const HOUR_S = 3600;
const SAVE_BUDGET_BYTES = 20 * 1024;

const stable = (profile: Profile): Omit<Profile, "lastSeenMs"> => {
  const { lastSeenMs: _ignored, ...rest } = profile;
  return rest;
};

async function checkpoint(h: Harness, adapter: ReturnType<typeof createMemoryAdapter>) {
  const before = h.session.snapshot().profile;
  await h.session.flush();
  const text = adapter.entries.get(PROFILE_KEY) ?? "";
  const reloaded = await createHarness({ adapter, startMs: h.clock.now() });
  const after = reloaded.session.snapshot().profile;
  expect(stable(after)).toEqual(stable(before));
  expect(after).toEqual(h.saved());
  return { text, reloaded };
}

describe("long session save round trip", () => {
  it("saves, reloads and resumes identically through hours of play, Eclipses, offline gaps and Comet days", async () => {
    const adapter = createMemoryAdapter();
    let h = await createHarness({ adapter });
    const tally = newTally();
    let biggest = 0;
    const sizes: number[] = [];

    for (let leg = 0; leg < 6; leg++) {
      playFor(h, 5 * HOUR_S, tally);
      const { text, reloaded } = await checkpoint(h, adapter);
      biggest = Math.max(biggest, text.length);
      sizes.push(text.length);

      const away = [300, 3 * HOUR_S, 12 * HOUR_S, 26 * HOUR_S, 60, 9 * HOUR_S][leg] ?? 0;
      reloaded.clock.advance(away * 1000);
      const summary = reloaded.session.resume();
      expect(summary?.awaySeconds).toBe(away);
      expect(summary?.secondsCounted).toBe(Math.min(away, 8 * HOUR_S));
      expect(summary?.capped).toBe(away > 8 * HOUR_S);
      expect(Number.isFinite(summary?.gained)).toBe(true);
      if (reloaded.session.claimComet().ok) tally.comets += 1;
      const resumed = await checkpoint(reloaded, adapter);
      biggest = Math.max(biggest, resumed.text.length);
      h = resumed.reloaded;
    }

    console.info(
      `save-roundtrip: ${tally.eclipses} Eclipses, ${tally.charts} charts, ${tally.comets} Comet claims, ` +
        `${tally.boons} boons, ${tally.purchases} purchases; save sizes ${sizes.join(", ")} bytes, largest ${biggest}`,
    );
    expect(tally.eclipses).toBeGreaterThanOrEqual(2);
    expect(tally.charts).toBeGreaterThanOrEqual(12);
    expect(tally.comets).toBe(3);
    const end = h.session.snapshot().profile;
    expect(end.cometDays).toBe(3);
    expect(end.cometStreak).toBe(1);
    expect(end.cometLastKey).toBe("2026-10-26");
    expect(tally.boons).toBeGreaterThanOrEqual(2);
    expect(biggest).toBeGreaterThan(500);
    expect(biggest).toBeLessThan(SAVE_BUDGET_BYTES);
    expect(h.clock.now()).toBeGreaterThan(START_MS + 30 * HOUR_S * 1000);
  });

  it("keeps a fully loaded late-game profile under 20 KB", async () => {
    const adapter = createMemoryAdapter();
    const h = await createHarness({
      adapter,
      seed: {
        game: {
          starlight: 8.8e299,
          cycleStarlight: 9.9e299,
          lifetimeStarlight: 1.1e300,
          shards: 9999,
          shardsEarned: 99999,
          eclipses: 9999,
        },
        profile: { cometStreak: 365, cometDays: 999, cometLastKey: "2027-12-31" },
      },
    });
    await h.session.flush();
    const text = h.savedText() ?? "";
    expect(text.length).toBeLessThan(SAVE_BUDGET_BYTES);
    const reloaded = await createHarness({ adapter });
    expect(stable(reloaded.session.snapshot().profile)).toEqual(
      stable(h.session.snapshot().profile),
    );
  });
});
