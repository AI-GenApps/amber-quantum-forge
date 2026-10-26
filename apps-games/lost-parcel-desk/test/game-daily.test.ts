import { createMemoryAdapter } from "@web-games/kit";
import { defaultProfile, type Profile, totalStamps } from "@web-games/lost-parcel-desk-core";
import { describe, expect, it } from "vitest";
import { dailyCaseFor } from "../src/state/dailyCase";
import { makeRig, seedProfile, solveActive, storedProfile } from "./fixtures/game";

const TODAY = "2026-10-23";

function profileWith(change: Partial<Profile>): Profile {
  return { ...defaultProfile(), ...change };
}

describe("the Daily Parcel in the game store", () => {
  it("opens today's generated case and saves it as the session", async () => {
    const rig = makeRig();
    await rig.game.load();
    const outcome = await rig.game.startDaily();
    expect(outcome.ok).toBe(true);
    const active = rig.game.getState().active;
    expect(active?.kind).toBe("daily");
    expect(active?.id).toBe(TODAY);
    expect(active?.def).toEqual(dailyCaseFor(TODAY));
    expect(storedProfile(rig.adapter).session?.id).toBe(TODAY);
  });

  it("pays the tier plus the day-one streak bonus and clears the session", async () => {
    const rig = makeRig();
    await rig.game.load();
    await rig.game.startDaily();
    const outcome = await solveActive(rig.game);
    expect(outcome).toMatchObject({ ok: true, closed: true, stamps: 3 });
    if (!outcome.ok) return;
    expect(outcome.events).toContainEqual({
      type: "postage-gained",
      amount: 10,
      reason: "daily-clear",
    });
    expect(outcome.events).toContainEqual({
      type: "postage-gained",
      amount: 2,
      reason: "streak-bonus",
    });
    const profile = rig.game.getState().profile;
    expect(profile.postage).toBe(42);
    expect(profile.daily).toEqual({
      lastKey: TODAY,
      streak: 1,
      bestStreak: 1,
      results: { [TODAY]: { stamps: 3 } },
    });
    expect(profile.stats.dailiesCleared).toBe(1);
    expect(profile.session).toBeNull();
    expect(storedProfile(rig.adapter).postage).toBe(42);
  });

  it("never counts daily stamps towards the campaign", async () => {
    const rig = makeRig();
    await rig.game.load();
    await rig.game.startDaily();
    await solveActive(rig.game);
    const profile = rig.game.getState().profile;
    expect(totalStamps(profile)).toBe(0);
    expect(profile.cases).toEqual({});
    expect(await rig.game.startCase("02")).toEqual({ ok: false, reason: "LOCKED" });
  });

  it("extends the streak on the next day with a bigger bonus", async () => {
    const rig = makeRig();
    await rig.game.load();
    await rig.game.startDaily();
    await solveActive(rig.game);
    rig.setNow(new Date("2026-10-24T08:00:00"));
    await rig.game.startDaily();
    expect(rig.game.getState().active?.id).toBe("2026-10-24");
    await solveActive(rig.game);
    const profile = rig.game.getState().profile;
    expect(profile.daily.streak).toBe(2);
    expect(profile.postage).toBe(42 + 10 + 4);
  });

  it("pays only the difference when the same day is replayed for a better tier", async () => {
    const rig = makeRig();
    await rig.game.load();
    await rig.game.startDaily();
    await solveActive(rig.game, 1);
    expect(rig.game.getState().profile.postage).toBe(30 + 7 + 2);
    await rig.game.startDaily();
    await solveActive(rig.game);
    const profile = rig.game.getState().profile;
    expect(profile.postage).toBe(30 + 10 + 2);
    expect(profile.daily.streak).toBe(1);
    expect(profile.daily.results[TODAY]).toEqual({ stamps: 3 });
    await rig.game.startDaily();
    await solveActive(rig.game, 1);
    expect(rig.game.getState().profile.postage).toBe(42);
  });

  it("covers one missed day with a freeze", async () => {
    const adapter = createMemoryAdapter();
    seedProfile(
      adapter,
      profileWith({
        streakFreezes: 1,
        daily: {
          lastKey: "2026-10-21",
          streak: 3,
          bestStreak: 3,
          results: { "2026-10-21": { stamps: 2 } },
        },
      }),
    );
    const rig = makeRig(adapter);
    await rig.game.load();
    await rig.game.startDaily();
    const outcome = await solveActive(rig.game);
    if (!outcome.ok) throw new Error("rejected");
    expect(outcome.events).toContainEqual({ type: "freeze-used", count: 1 });
    expect(rig.game.getState().profile.daily.streak).toBe(4);
    expect(rig.game.getState().profile.streakFreezes).toBe(0);
  });

  it("restarts the streak after two missed days with one freeze", async () => {
    const adapter = createMemoryAdapter();
    seedProfile(
      adapter,
      profileWith({
        streakFreezes: 1,
        daily: {
          lastKey: "2026-10-20",
          streak: 5,
          bestStreak: 5,
          results: { "2026-10-20": { stamps: 2 } },
        },
      }),
    );
    const rig = makeRig(adapter);
    await rig.game.load();
    await rig.game.startDaily();
    await solveActive(rig.game);
    const profile = rig.game.getState().profile;
    expect(profile.daily.streak).toBe(1);
    expect(profile.daily.bestStreak).toBe(5);
    expect(profile.streakFreezes).toBe(1);
  });

  it("changes nothing when the device clock went back", async () => {
    const adapter = createMemoryAdapter();
    const daily = {
      lastKey: "2026-10-25",
      streak: 2,
      bestStreak: 2,
      results: { "2026-10-25": { stamps: 3 as const } },
    };
    seedProfile(adapter, profileWith({ daily, postage: 80 }));
    const rig = makeRig(adapter);
    await rig.game.load();
    await rig.game.startDaily();
    const outcome = await solveActive(rig.game);
    if (!outcome.ok) throw new Error("rejected");
    expect(outcome.events).toEqual([]);
    const profile = rig.game.getState().profile;
    expect(profile.postage).toBe(80);
    expect(profile.daily).toEqual(daily);
    expect(profile.session).toBeNull();
  });

  it("charges 15 for a daily hint", async () => {
    const rig = makeRig();
    await rig.game.load();
    await rig.game.startDaily();
    expect((await rig.game.buyHint()).ok).toBe(true);
    expect(rig.game.getState().profile.postage).toBe(15);
  });

  it("resumes a daily after a reload with an identical regenerated case", async () => {
    const rig = makeRig();
    await rig.game.load();
    await rig.game.startDaily();
    const first = rig.game.getState().active?.def.objects[0]?.id ?? "";
    await rig.game.inspect(first);
    const next = makeRig(rig.adapter);
    await next.game.load();
    const restored = next.game.getState().active;
    expect(restored?.kind).toBe("daily");
    expect(restored?.def).toEqual(dailyCaseFor(TODAY));
    expect(restored?.state.seenObjectIds).toEqual([first]);
    const resumed = await next.game.startDaily();
    expect(resumed.ok && resumed.resumed).toBe(true);
  });
});
