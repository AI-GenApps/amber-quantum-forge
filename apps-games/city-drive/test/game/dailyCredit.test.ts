// @vitest-environment node
import { MemorySaveStore, type MissionResult, SaveManager } from "@city-drive/core";
import { describe, expect, it } from "vitest";
import { allMissionDefs, deviceToday } from "../../src/game/daily";
import { MissionCredit } from "../../src/game/sessionCredit";
import { Profile, ROSTER } from "../../src/save";

const catalog = allMissionDefs().filter((m) => m.district === "district-1");
const MISSION = catalog[0] as (typeof catalog)[number];

function res(stars: 0 | 1 | 2 | 3, id = MISSION.id): MissionResult {
  return {
    id,
    success: stars > 0,
    stars,
    time: 30,
    damage: 0,
    comfort: null,
    coins: 0,
    ...(stars === 0 ? { failReason: "time_out" as const } : {}),
  };
}

async function setup() {
  const manager = new SaveManager(new MemorySaveStore(), {
    starterCarId: ROSTER.starter,
    debounceMs: 1,
  });
  const profile = await Profile.load(manager, ROSTER);
  return { profile, credit: new MissionCredit(profile, catalog) };
}

describe("daily credit", () => {
  it("parses every bundled mission and reads the clock as a UTC date", () => {
    expect(allMissionDefs()).toHaveLength(24);
    expect(deviceToday(() => Date.UTC(2026, 9, 15, 23, 59))).toBe("2026-10-15");
    expect(deviceToday(() => Date.UTC(2026, 9, 16, 0, 0))).toBe("2026-10-16");
  });

  it("pays the daily reward by stars, not the mission reward, and leaves records alone", async () => {
    const { profile, credit } = await setup();
    credit.beginDaily({ date: "2026-10-15", missionId: MISSION.id });
    credit.check(res(3));
    expect(profile.coins).toBe(150);
    expect(credit.lastDaily).toMatchObject({ claimed: true, coins: 150, streak: 1, stars: 3 });
    expect(credit.lastPayout).toBeUndefined();
    expect(profile.save.missions).toEqual({});
    expect(profile.save.daily).toEqual({ last_claim_date: "2026-10-15", streak: 1 });
  });

  it("pays a result once even if it is checked every step", async () => {
    const { profile, credit } = await setup();
    credit.beginDaily({ date: "2026-10-15", missionId: MISSION.id });
    const r = res(2);
    for (let i = 0; i < 5; i++) credit.check(r);
    expect(profile.coins).toBe(80);
  });

  it("a failed run pays nothing, keeps the day open, and a retry can still earn it", async () => {
    const { profile, credit } = await setup();
    credit.beginDaily({ date: "2026-10-15", missionId: MISSION.id });
    credit.check(res(0));
    expect(credit.lastDaily).toMatchObject({ claimed: false, reason: "no-stars", coins: 0 });
    expect(profile.coins).toBe(0);
    expect(profile.save.daily.last_claim_date).toBeNull();
    credit.beginDaily({ date: "2026-10-15", missionId: MISSION.id });
    expect(credit.lastDaily).toBeUndefined();
    credit.check(res(1));
    expect(profile.coins).toBe(40);
  });

  it("a second win on a paid date pays nothing", async () => {
    const { profile, credit } = await setup();
    credit.beginDaily({ date: "2026-10-15", missionId: MISSION.id });
    credit.check(res(1));
    credit.beginDaily({ date: "2026-10-15", missionId: MISSION.id });
    credit.check(res(3));
    expect(credit.lastDaily).toMatchObject({ claimed: false, reason: "already-claimed" });
    expect(profile.coins).toBe(40);
  });

  it("a clock set backwards pays nothing", async () => {
    const { profile, credit } = await setup();
    credit.beginDaily({ date: "2026-10-15", missionId: MISSION.id });
    credit.check(res(1));
    credit.beginDaily({ date: "2026-10-14", missionId: MISSION.id });
    credit.check(res(3));
    expect(credit.lastDaily).toMatchObject({ claimed: false, reason: "clock-backwards" });
    expect(profile.coins).toBe(40);
  });

  it("after endDaily the same mission pays as a normal mission again", async () => {
    const { profile, credit } = await setup();
    credit.beginDaily({ date: "2026-10-15", missionId: MISSION.id });
    credit.endDaily();
    expect(credit.dailyRun).toBeUndefined();
    credit.check(res(1));
    expect(credit.lastPayout).toMatchObject({ missionId: MISSION.id, firstClear: true });
    expect(profile.save.missions[MISSION.id]?.stars).toBe(1);
    expect(profile.save.daily.last_claim_date).toBeNull();
  });

  it("a different mission during a daily run is paid normally", async () => {
    const { profile, credit } = await setup();
    const other = catalog[1] as (typeof catalog)[number];
    credit.beginDaily({ date: "2026-10-15", missionId: MISSION.id });
    credit.check(res(1, other.id));
    expect(profile.save.missions[other.id]?.stars).toBe(1);
    expect(profile.save.daily.last_claim_date).toBeNull();
  });

  it("builds a streak over consecutive days", async () => {
    const { profile, credit } = await setup();
    for (const [i, date] of ["2026-10-15", "2026-10-16", "2026-10-17"].entries()) {
      credit.beginDaily({ date, missionId: MISSION.id });
      credit.check(res(2));
      expect(credit.lastDaily?.streak).toBe(i + 1);
    }
    expect(profile.coins).toBe(80 + 88 + 96);
  });
});
