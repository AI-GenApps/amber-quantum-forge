import { createMemoryAdapter } from "@web-games/kit";
import { describe, expect, it } from "vitest";
import { PROFILE_KEY } from "../../src/save/profile-store";
import { createHarness, type Harness, START_MS, toastKinds } from "./harness";

function playUntil(h: Harness, starlight: number): void {
  for (let i = 0; i < 200 && h.session.snapshot().profile.game.starlight < starlight; i++) {
    h.session.tick(20);
  }
}

describe("a scripted journey across three launches", () => {
  it("plays from the first tap to the first Eclipse with the save intact at every step", async () => {
    const adapter = createMemoryAdapter();

    const first = await createHarness({ adapter });
    for (let i = 0; i < 5; i++) first.session.gather();
    const firstBuy = first.session.buyInstrument("telescope", 1);
    expect(toastKinds(firstBuy.toasts)).toEqual(["chapter:1", "lore:lore-01"]);
    playUntil(first, 17);
    expect(first.session.buyInstrument("telescope", 1).ok).toBe(true);
    playUntil(first, 60);
    expect(first.session.startChart("lyre").ok).toBe(true);
    for (let i = 0; i < 5; i++) first.session.tapStar(i);
    const charted = first.session.finishChart();
    expect(charted).toMatchObject({ ok: true, flawless: true });
    expect(toastKinds(charted.toasts)).toEqual(
      expect.arrayContaining(["lore:lore-03", "achievement:first-ink", "achievement:steady-hand"]),
    );
    expect(first.session.claimComet()).toMatchObject({ ok: true, streak: 1 });
    await first.session.flush();
    const afterFirst = first.saved();
    expect(afterFirst.game.owned).toEqual({ telescope: 2 });
    expect(afterFirst.game.charted).toEqual(["lyre"]);
    expect(afterFirst.game.achievements).toEqual(["first-ink", "steady-hand"]);
    expect(afterFirst.cometLastKey).toBe("2026-10-23");
    expect(afterFirst.stats.flawlessCharts).toBe(1);
    expect(afterFirst.loreUnlocked).toEqual(["lore-01", "lore-03"]);

    const secondStart = START_MS + 30 * 3_600_000;
    const second = await createHarness({ adapter, startMs: secondStart });
    expect(second.session.snapshot().profile.game).toEqual(afterFirst.game);
    const summary = second.session.resume();
    expect(summary?.capped).toBe(true);
    expect(summary?.awaySeconds).toBe(30 * 3600);
    expect(summary?.secondsCounted).toBe(28800);
    expect(summary?.gained).toBeGreaterThan(0);
    expect(second.session.cometStatus()).toBe("ready");
    expect(second.session.claimComet()).toMatchObject({ ok: true, streak: 2, reward: 1100 });
    await second.session.flush();
    expect(second.saved().cometStreak).toBe(2);
    expect(second.saved().cometDays).toBe(2);

    const stored = JSON.parse(adapter.entries.get(PROFILE_KEY) ?? "{}");
    stored.data.game.cycleStarlight = 3e10;
    stored.data.game.lifetimeStarlight = 3e10;
    adapter.entries.set(PROFILE_KEY, JSON.stringify(stored));

    const third = await createHarness({ adapter, startMs: secondStart });
    const eclipse = third.session.eclipse();
    expect(toastKinds(eclipse.toasts)).toContain("achievement:first-shadow");
    expect(third.session.buyBoon("dark-adapted").ok).toBe(true);
    await third.session.flush();
    const end = third.saved();
    expect(end.game.shards).toBe(4);
    expect(end.game.boons).toEqual(["dark-adapted"]);
    expect(end.game.owned).toEqual({});
    expect(end.game.charted).toEqual(["lyre"]);
    expect(end.cometStreak).toBe(2);
    expect(end.stats.eclipses).toBe(1);
    expect(end.stats.shardsSpent).toBe(1);
  });
});
