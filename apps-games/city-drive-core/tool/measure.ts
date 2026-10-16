import {
  BASELINE_CAR,
  bayMarginM,
  type CarFootprint,
  type MissionDef,
  type MissionResult,
  type MissionValidation,
  missionDifficulty,
  missionRouteMetrics,
  timeLimitOf,
} from "../src/index";
import { createMissionRig, driveMission } from "../test/support/harness";
import type { Content, DistrictContent } from "./content";

export const CAR: CarFootprint = {
  halfLength: BASELINE_CAR.chassisHalfExtents.z,
  halfWidth: BASELINE_CAR.chassisHalfExtents.x,
};

export interface Measured {
  difficulty: number;
  validation: MissionValidation;
  result: MissionResult;
}

const round = (v: number, places: number): number => {
  const f = 10 ** places;
  return Math.round(v * f) / f;
};

/** The difficulty scalar of one mission in its district (rounded to 4 places). */
export function difficultyOf(content: Content, district: DistrictContent, m: MissionDef): number {
  const metrics = missionRouteMetrics(district.graph, district.laneIndex, m);
  return round(
    missionDifficulty(
      {
        routeLengthM: metrics.routeLengthM,
        timeLimitS: timeLimitOf(m),
        intersections: metrics.intersections,
        trafficAgents: district.info.traffic_agents,
        parkingMarginM: m.type === "parking" ? bayMarginM(m.params.bay, CAR) : undefined,
      },
      content.progression.difficulty,
    ),
    4,
  );
}

/**
 * Drive one mission with the test autopilot in the real simulation, with the district's traffic
 * running under the progression's fixed seed. Deterministic: same inputs, same numbers.
 */
export async function measureMission(
  content: Content,
  district: DistrictContent,
  mission: MissionDef,
): Promise<Measured> {
  const traffic = {
    seed: content.progression.validation.traffic_seed,
    maxAgents: district.info.traffic_agents,
  };
  const rig = await createMissionRig({
    missions: district.missions,
    at: mission,
    map: district.map,
    traffic,
  });
  const { result } = driveMission(rig, mission);
  rig.physics.dispose();
  const route = missionRouteMetrics(district.graph, district.laneIndex, mission);
  return {
    difficulty: difficultyOf(content, district, mission),
    result,
    validation: {
      traffic_seed: traffic.seed,
      traffic_agents: traffic.maxAgents,
      autopilot_stars: result.stars,
      autopilot_time_s: round(result.time, 3),
      autopilot_damage: result.damage,
      route_length_m: round(route.routeLengthM, 1),
      intersections: route.intersections,
      ticks: rig.ticks,
    },
  };
}

/** The mission file content with fresh metrics appended (key order is fixed: metrics last). */
export function withMetrics(
  raw: Record<string, unknown>,
  measured: Pick<Measured, "difficulty" | "validation">,
): Record<string, unknown> {
  const { difficulty: _d, validation: _v, ...rest } = raw;
  return { ...rest, difficulty: measured.difficulty, validation: measured.validation };
}
