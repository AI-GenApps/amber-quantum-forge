// @vitest-environment node
import { districtInfo, parseProgression } from "@city-drive/core";
import { parseCityManifest } from "@city-drive/core/city";
import { afterEach, describe, expect, it } from "vitest";
import {
  DISTRICT_1_MISSIONS,
  DISTRICT_MISSIONS,
  type DistrictId,
  isDistrictId,
  PROGRESSION_RAW,
} from "../../src/game/missions";
import { GameSession } from "../../src/game/session";
import { loadDistrict } from "../../src/render/district";
import { readManifest } from "../assets/helpers";
import { ScriptedInput } from "./helpers";

const IDS: DistrictId[] = ["district-1", "district-2", "district-3"];
let active: GameSession | undefined;

afterEach(() => {
  active?.dispose();
  active = undefined;
});

describe("district registry", () => {
  it("knows the three districts and rejects anything else", () => {
    expect(IDS.every(isDistrictId)).toBe(true);
    expect(isDistrictId("district-4")).toBe(false);
    expect(isDistrictId("constructor")).toBe(false);
    expect(DISTRICT_1_MISSIONS).toBe(DISTRICT_MISSIONS["district-1"]);
  });

  it("lists eight mission files per district", () => {
    for (const id of IDS) expect(DISTRICT_MISSIONS[id], id).toHaveLength(8);
  });

  it("throws on a district that does not exist", () => {
    expect(() => loadDistrict("district-9", readManifest())).toThrow(/unknown district/);
  });

  for (const id of IDS) {
    it(`${id}: the map, its missions and its traffic load into a session`, async () => {
      const manifest = readManifest();
      const info = districtInfo(parseProgression(PROGRESSION_RAW), id);
      const session = await GameSession.create(
        loadDistrict(id, manifest),
        parseCityManifest(manifest),
        new ScriptedInput(),
        undefined,
        { missions: DISTRICT_MISSIONS[id], traffic: { seed: 1, maxAgents: info.traffic_agents } },
      );
      active = session;
      const n = id.replace("district-", "");
      expect(session.missions?.markers().map((m) => m.missionId)).toEqual(
        Array.from({ length: 8 }, (_, i) => `d${n}-m0${i + 1}`),
      );
      for (let i = 0; i < 300; i++) session.step();
      expect(session.traffic?.list.length).toBeGreaterThan(0);
      expect(session.traffic?.list.length).toBeLessThanOrEqual(info.traffic_agents);
    });
  }
});
