import type { DifficultyConfig } from "./difficulty";
import { isRecord, type Raw, Reader } from "./read";

export const PROGRESSION_SCHEMA_VERSION = 1;

export interface DistrictInfo {
  /** `district-N`: also the map file name and the mission `district` field. */
  id: string;
  /** Placeholder display name until the naming task. */
  name: string;
  /** Agents the traffic manager runs in this district. */
  traffic_agents: number;
  /** Total stars needed before the district opens. */
  unlock_stars: number;
}

export interface ValidationRules {
  traffic_seed: number;
  /** The 3-star time may not be below this fraction of the autopilot's time. */
  three_star_min_ratio: number;
  /** At least this fraction of missions must be stricter than the autopilot at 3 stars. */
  strict_fraction: number;
  /** Largest number of times difficulty may drop from one mission to the next in a district. */
  max_inversions: number;
}

export interface Progression {
  schema_version: number;
  difficulty: DifficultyConfig;
  validation: ValidationRules;
  districts: DistrictInfo[];
}

export class ProgressionError extends Error {
  constructor(issues: readonly string[]) {
    super(
      `progression has ${issues.length} problem(s)\n${issues.map((i) => `  - ${i}`).join("\n")}`,
    );
    this.name = "ProgressionError";
  }
}

function parseDistrict(r: Reader, raw: unknown, index: number): DistrictInfo {
  const sub = r.at(`districts[${index}]`);
  const t: Raw = isRecord(raw) ? raw : {};
  if (!isRecord(raw)) sub.fail("must be an object");
  return {
    id: sub.string(t, "id"),
    name: sub.string(t, "name"),
    traffic_agents: sub.number(t, "traffic_agents", 0),
    unlock_stars: sub.number(t, "unlock_stars", 0),
  };
}

function parseDifficulty(r: Reader, raw: Raw): DifficultyConfig {
  const d = r.record(raw, "difficulty");
  const dr = r.at("difficulty");
  const w = dr.record(d, "weights");
  const wr = dr.at("weights");
  return {
    weights: {
      route_ratio: wr.number(w, "route_ratio", 0),
      intersections: wr.number(w, "intersections", 0),
      traffic: wr.number(w, "traffic", 0),
      parking: wr.number(w, "parking", 0),
    },
    reference_speed_mps: dr.number(d, "reference_speed_mps", 0.1),
    max_intersections: dr.number(d, "max_intersections", 1),
    max_traffic_agents: dr.number(d, "max_traffic_agents", 1),
    parking_margin_tight_m: dr.number(d, "parking_margin_tight_m", 0),
    parking_margin_loose_m: dr.number(d, "parking_margin_loose_m", 0.1),
  };
}

/** Parse untrusted `progression.json`. Throws a ProgressionError listing every problem. */
export function parseProgression(input: unknown): Progression {
  const issues: { code: "schema"; message: string }[] = [];
  const r = new Reader(issues, "progression");
  if (!isRecord(input)) throw new ProgressionError(["progression must be a JSON object"]);
  if (input.schema_version !== PROGRESSION_SCHEMA_VERSION) {
    r.fail(`schema_version must be ${PROGRESSION_SCHEMA_VERSION}`);
  }
  const v = r.record(input, "validation");
  const vr = r.at("validation");
  const progression: Progression = {
    schema_version: PROGRESSION_SCHEMA_VERSION,
    difficulty: parseDifficulty(r, input),
    validation: {
      traffic_seed: vr.number(v, "traffic_seed", 0),
      three_star_min_ratio: vr.number(v, "three_star_min_ratio", 0),
      strict_fraction: vr.number(v, "strict_fraction", 0),
      max_inversions: vr.number(v, "max_inversions", 0),
    },
    districts: r.array(input, "districts", 1, 16).map((d, i) => parseDistrict(r, d, i)),
  };
  const first = progression.districts[0];
  if (first && first.unlock_stars !== 0) r.fail("the first district must be open from the start");
  let prev = -1;
  for (const d of progression.districts) {
    if (d.unlock_stars < prev)
      r.fail("unlock_stars must not decrease from one district to the next");
    prev = d.unlock_stars;
  }
  if (issues.length > 0) throw new ProgressionError(issues.map((i) => i.message));
  return progression;
}

export function districtInfo(progression: Progression, id: string): DistrictInfo {
  const found = progression.districts.find((d) => d.id === id);
  if (!found) throw new Error(`progression: unknown district "${id}"`);
  return found;
}

/** Districts the player has opened with `totalStars` stars. The first is always open. */
export function unlockedDistricts(progression: Progression, totalStars: number): string[] {
  return progression.districts.filter((d) => totalStars >= d.unlock_stars).map((d) => d.id);
}

export function isDistrictUnlocked(
  progression: Progression,
  totalStars: number,
  districtId: string,
): boolean {
  return totalStars >= districtInfo(progression, districtId).unlock_stars;
}
