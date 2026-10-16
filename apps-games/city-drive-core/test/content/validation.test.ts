import { describe, expect, it } from "vitest";
import { measureMission } from "../../tool/measure";
import { content } from "./support";

describe("stored metrics match a fresh autopilot run", () => {
  for (const [index, name] of ["district-1", "district-2", "district-3"].entries()) {
    it(`${name}: every mission replays to the stored numbers`, async () => {
      const c = content();
      const district = c.districts[index];
      if (!district) throw new Error(`${name} missing`);
      for (const mission of district.missions) {
        const fresh = await measureMission(c, district, mission);
        expect(fresh.result.success, mission.id).toBe(true);
        expect(fresh.validation, mission.id).toEqual(mission.validation);
        expect(fresh.difficulty, mission.id).toBe(mission.difficulty);
      }
    });
  }

  it("is deterministic: the same mission measured twice gives identical numbers", async () => {
    const c = content();
    const district = c.districts[2];
    const mission = district?.missions[7];
    if (!district || !mission) throw new Error("district-3 m08 missing");
    const a = await measureMission(c, district, mission);
    const b = await measureMission(c, district, mission);
    expect(b).toEqual(a);
  });

  it("the autopilot does not complete a mission it cannot reach in time", async () => {
    const c = content();
    const district = c.districts[0];
    const mission = district?.missions[0];
    if (!district || mission?.type !== "delivery") throw new Error("district-1 m01 missing");
    const impossible = {
      ...mission,
      params: { ...mission.params, time_limit_s: 3 },
      stars: {
        "1": { ...mission.stars["1"], min_time_left_s: 0 },
        "2": { ...mission.stars["2"], min_time_left_s: 1 },
        "3": { ...mission.stars["3"], min_time_left_s: 2 },
      },
    };
    const fresh = await measureMission(c, { ...district, missions: [impossible] }, impossible);
    expect(fresh.result.success).toBe(false);
    expect(fresh.result.failReason).toBe("time_out");
  });
});
