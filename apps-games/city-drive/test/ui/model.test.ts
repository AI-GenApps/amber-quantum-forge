import {
  BASELINE_CAR,
  defaultSave,
  type MissionDef,
  type MissionHud,
  parseProgression,
  type SaveData,
} from "@city-drive/core";
import { describe, expect, it } from "vitest";
import { DISTRICT_MISSIONS, PROGRESSION_RAW } from "../../src/game/missions";
import { ROSTER } from "../../src/save";
import { starTargets, timeLimitText } from "../../src/ui/model/briefing";
import {
  districtCards,
  type MissionSummary,
  nextMissionId,
  summarizeMission,
} from "../../src/ui/model/districts";
import {
  formatBestTime,
  formatClock,
  formatCoins,
  objectiveLine,
  outcomeTitle,
  starsLabel,
} from "../../src/ui/model/format";
import { carStats, garageCards } from "../../src/ui/model/garage";
import { graphicsProfile } from "../../src/ui/model/quality";
import { MINIMAP_HZ, RateLimiter } from "../../src/ui/model/rate";

const progression = parseProgression(PROGRESSION_RAW);
const missions: Record<string, MissionSummary[]> = Object.fromEntries(
  Object.entries(DISTRICT_MISSIONS).map(([id, files]) => [id, files.map(summarizeMission)]),
);

function save(over: Partial<SaveData> = {}): SaveData {
  return { ...defaultSave(ROSTER.starter), ...over };
}

describe("district cards", () => {
  it("summarizes every shipped mission file", () => {
    expect(Object.values(missions).flat()).toHaveLength(24);
    expect(missions["district-1"]?.[0]).toMatchObject({ id: "d1-m01", type: "delivery" });
  });

  it("rejects a mission file without the fields the map needs", () => {
    expect(() => summarizeMission({ id: "x" })).toThrow(/string id, title and type/);
    expect(() => summarizeMission({ id: "x", title: "t", type: "flying" })).toThrow(/unknown type/);
  });

  it("a new player has district 1 open and the others locked with the stars they still need", () => {
    const cards = districtCards(progression, missions, save());
    expect(cards.map((c) => [c.id, c.locked])).toEqual([
      ["district-1", false],
      ["district-2", true],
      ["district-3", true],
    ]);
    expect(cards[1]).toMatchObject({ unlockStars: 10, starsMissing: 10, stars: 0, maxStars: 24 });
    expect(cards[2]?.starsMissing).toBe(24);
    expect(cards[0]?.missions).toHaveLength(8);
  });

  it("unlocks a district once the total stars reach its threshold and reports progress", () => {
    const records = Object.fromEntries(
      (missions["district-1"] ?? [])
        .slice(0, 5)
        .map((m) => [m.id, { stars: 2, best_time_s: 41.5 }]),
    );
    const cards = districtCards(progression, missions, save({ missions: records as never }));
    expect(cards[1]?.locked).toBe(false);
    expect(cards[1]?.starsMissing).toBe(0);
    expect(cards[2]?.locked).toBe(true);
    expect(cards[2]?.starsMissing).toBe(14);
    expect(cards[0]).toMatchObject({ stars: 10, maxStars: 24 });
    expect(cards[0]?.progress).toBeCloseTo(10 / 24);
    expect(cards[0]?.missions[0]).toMatchObject({ stars: 2, bestTimeS: 41.5 });
    expect(cards[0]?.missions[7]).toMatchObject({ stars: 0, bestTimeS: null });
  });

  it("finds the next mission in a district", () => {
    const list = missions["district-1"] ?? [];
    expect(nextMissionId(list, "d1-m01")).toBe("d1-m02");
    expect(nextMissionId(list, "d1-m08")).toBeUndefined();
    expect(nextMissionId(list, "nope")).toBeUndefined();
  });
});

describe("garage cards", () => {
  it("marks the selected, owned, affordable and locked cars", () => {
    const [starter, a, b, c] = ROSTER.cars;
    if (!starter || !a || !b || !c) throw new Error("roster too small");
    const state = save({
      coins: b.price,
      owned_cars: [starter.id, a.id],
      selected_car: starter.id,
    });
    const cards = garageCards(ROSTER, state);
    const by = (id: string) => cards.find((x) => x.id === id);
    expect(by(starter.id)?.state).toBe("selected");
    expect(by(a.id)?.state).toBe("owned");
    expect(by(b.id)?.state).toBe("affordable");
    const locked = cards.find((x) => x.state === "locked");
    expect(locked?.missing).toBe((locked?.price ?? 0) - b.price);
    expect(by(b.id)?.missing).toBe(0);
  });

  it("exactly enough coins is affordable; one coin short is locked", () => {
    const car = ROSTER.cars[1];
    if (!car) throw new Error("roster too small");
    expect(garageCards(ROSTER, save({ coins: car.price }))[1]?.state).toBe("affordable");
    const short = garageCards(ROSTER, save({ coins: car.price - 1 }))[1];
    expect(short).toMatchObject({ state: "locked", missing: 1 });
  });

  it("stat bars are in 0..1, differ between cars and are derived from the spec", () => {
    const stats = ROSTER.cars.map((c) => carStats(c, ROSTER));
    for (const s of stats) {
      for (const v of Object.values(s)) {
        expect(v).toBeGreaterThan(0);
        expect(v).toBeLessThanOrEqual(1);
      }
    }
    const speeds = stats.map((s) => s.speed);
    expect(Math.max(...speeds)).toBeCloseTo(1);
    expect(new Set(speeds).size).toBeGreaterThan(1);
    const fastest = ROSTER.cars.reduce((a, b) =>
      (b.spec.topSpeedKmh ?? BASELINE_CAR.topSpeedKmh) >
      (a.spec.topSpeedKmh ?? BASELINE_CAR.topSpeedKmh)
        ? b
        : a,
    );
    expect(carStats(fastest, ROSTER).speed).toBeCloseTo(1);
  });

  it("a roster of identical cars gets a neutral bar, not a divide by zero", () => {
    const [only] = ROSTER.cars;
    if (!only) throw new Error("roster is empty");
    expect(carStats(only, { ...ROSTER, cars: [only] }).speed).toBeCloseTo(0.6);
  });
});

describe("briefing targets", () => {
  it("describes every star level of all 24 missions", () => {
    for (const files of Object.values(DISTRICT_MISSIONS)) {
      for (const raw of files) {
        const targets = starTargets(raw as MissionDef);
        expect(targets.map((t) => t.stars)).toEqual([1, 2, 3]);
        for (const t of targets) {
          expect(t.text.length).toBeGreaterThan(5);
          expect(t.coins).toBeGreaterThan(0);
        }
        expect(timeLimitText(raw as MissionDef)).toMatch(/^\d+:\d\d$/);
      }
    }
  });

  it("uses the type's own rule in the text", () => {
    const find = (type: string) =>
      Object.values(DISTRICT_MISSIONS)
        .flat()
        .find((m) => (m as MissionDef).type === type) as MissionDef;
    expect(starTargets(find("delivery"))[0]?.text).toMatch(/left, damage/);
    expect(starTargets(find("taxi"))[0]?.text).toMatch(/comfort/);
    expect(starTargets(find("time_trial"))[0]?.text).toMatch(/^Finish in/);
    expect(starTargets(find("parking"))[0]?.text).toMatch(/touches/);
  });
});

describe("formatting", () => {
  it("formats clocks, best times and coins", () => {
    expect(formatClock(61.2)).toBe("1:02");
    expect(formatClock(-3)).toBe("0:00");
    expect(formatBestTime(null)).toBe("--");
    expect(formatBestTime(61.54)).toBe("1:01.5");
    expect(formatBestTime(7.04)).toBe("0:07.0");
    expect(formatCoins(12345)).toBe("12,345");
    expect(starsLabel(2)).toBe("2 of 3 stars");
  });

  it("names outcomes and objectives", () => {
    const base = {
      id: "a",
      success: false,
      stars: 0,
      time: 1,
      damage: 0,
      comfort: null,
      coins: 0,
    } as const;
    expect(outcomeTitle({ ...base, success: true, stars: 2 })).toBe("Mission complete");
    expect(outcomeTitle({ ...base, failReason: "time_out" })).toBe("Out of time");
    expect(outcomeTitle(base)).toBe("Mission failed");
    const hud = {
      objective: { label: "Deliver" },
      progress: { done: 1, total: 3 },
    } as unknown as MissionHud;
    expect(objectiveLine(hud)).toBe("Deliver (2/3)");
    expect(objectiveLine({ ...hud, objective: undefined })).toBe("");
  });
});

describe("graphics profile", () => {
  it("lower quality renders fewer pixels and draws less far", () => {
    const low = graphicsProfile("low");
    const medium = graphicsProfile("medium");
    const high = graphicsProfile("high");
    expect(low.hardwareScaling).toBeGreaterThan(medium.hardwareScaling);
    expect(medium.hardwareScaling).toBeGreaterThan(high.hardwareScaling);
    expect(low.fogEnd).toBeLessThan(medium.fogEnd);
    expect(medium.fogEnd).toBeLessThan(high.fogEnd);
    expect(graphicsProfile("auto")).toEqual(high);
  });

  it("the far plane is never inside the fog and scaling stays in the 1 to 2 range", () => {
    for (const q of ["auto", "low", "medium", "high"] as const) {
      const p = graphicsProfile(q);
      expect(p.maxZ).toBeGreaterThanOrEqual(p.fogEnd);
      expect(p.fogStart).toBeLessThan(p.fogEnd);
      expect(p.hardwareScaling).toBeGreaterThanOrEqual(1);
      expect(p.hardwareScaling).toBeLessThanOrEqual(2);
    }
  });
});

describe("RateLimiter", () => {
  it("lets one call through per interval", () => {
    const limiter = new RateLimiter(MINIMAP_HZ);
    expect(limiter.due(0)).toBe(true);
    expect(limiter.due(50)).toBe(false);
    expect(limiter.due(99)).toBe(false);
    expect(limiter.due(100)).toBe(true);
    expect(limiter.due(150)).toBe(false);
    limiter.reset();
    expect(limiter.due(151)).toBe(true);
  });

  it("at 60 frames per second a 10 Hz limiter fires about 10 times a second", () => {
    const limiter = new RateLimiter(10);
    let fired = 0;
    for (let frame = 0; frame < 60; frame++) if (limiter.due((frame * 1000) / 60)) fired++;
    expect(fired).toBe(10);
  });

  it("rejects a non-positive rate", () => {
    expect(() => new RateLimiter(0)).toThrow(/positive/);
  });
});
