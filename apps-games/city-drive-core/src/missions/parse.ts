import { MissionError, type MissionIssue } from "./errors";
import { isRecord, type Raw, Reader } from "./read";
import {
  type BayDef,
  type CheckpointDef,
  type DeliveryParams,
  type DeliveryStar,
  MISSION_SCHEMA_VERSION,
  MISSION_TYPES,
  type MissionDef,
  type MissionType,
  type ParkingParams,
  type ParkingStar,
  STAR_KEYS,
  type TaxiParams,
  type TaxiStar,
  type Tiers,
  type TrialParams,
  type TrialStar,
} from "./types";

function tiers<T>(
  reader: Reader,
  raw: Raw,
  key: string,
  parseOne: (r: Reader, tier: unknown) => T,
): Tiers<T> {
  const holder = reader.record(raw, key);
  const out = {} as Record<string, T>;
  for (const star of STAR_KEYS) out[star] = parseOne(reader.at(`${key}.${star}`), holder[star]);
  return out as unknown as Tiers<T>;
}

function parseBay(r: Reader, raw: Raw): BayDef {
  const bay: BayDef = {
    lane_point: r.lanePoint(raw.lane_point, "lane_point"),
    lateral_offset_m: r.number(raw, "lateral_offset_m", 0),
    length_m: r.number(raw, "length_m", 0.1),
    width_m: r.number(raw, "width_m", 0.1),
  };
  const gap = r.optionalNumber(raw, "flank_gap_m", 0);
  return gap === undefined ? bay : { ...bay, flank_gap_m: gap };
}

function parseCheckpoint(r: Reader, raw: unknown, index: number): CheckpointDef {
  const sub = r.at(`checkpoints[${index}]`);
  if (!isRecord(raw)) {
    sub.fail("must be an object");
    return { lane_point: { edgeId: "", s: 0 } };
  }
  const radius = sub.optionalNumber(raw, "radius_m", 0.5);
  const lane_point = sub.lanePoint(raw.lane_point, "lane_point");
  return radius === undefined ? { lane_point } : { lane_point, radius_m: radius };
}

function withRadius<T extends object>(
  base: T,
  radius: number | undefined,
): T & { radius_m?: number } {
  return radius === undefined ? base : { ...base, radius_m: radius };
}

function parseDelivery(r: Reader, raw: Raw): DeliveryParams {
  const drops = r.array(raw, "drops", 1, 3).map((d, i) => r.lanePoint(d, `drops[${i}]`));
  const base = {
    pickup: r.lanePoint(raw.pickup, "pickup"),
    drops,
    time_limit_s: r.number(raw, "time_limit_s", 1),
    max_damage: r.number(raw, "max_damage", 0),
  };
  return withRadius(base, r.optionalNumber(raw, "radius_m", 0.5));
}

function parseTaxi(r: Reader, raw: Raw): TaxiParams {
  const base = {
    pickup: r.lanePoint(raw.pickup, "pickup"),
    drop: r.lanePoint(raw.drop, "drop"),
    time_limit_s: r.number(raw, "time_limit_s", 1),
  };
  return withRadius(base, r.optionalNumber(raw, "radius_m", 0.5));
}

function parseTrial(r: Reader, raw: Raw): TrialParams {
  return {
    checkpoints: r.array(raw, "checkpoints", 2, 12).map((c, i) => parseCheckpoint(r, c, i)),
    time_limit_s: r.number(raw, "time_limit_s", 1),
  };
}

function parseParking(r: Reader, raw: Raw): ParkingParams {
  return {
    bay: parseBay(r.at("bay"), r.record(raw, "bay")),
    time_limit_s: r.number(raw, "time_limit_s", 1),
    max_touches: r.number(raw, "max_touches", 0),
  };
}

function obj(r: Reader, value: unknown): Raw {
  if (isRecord(value)) return value;
  r.fail("must be an object");
  return {};
}

const deliveryStar = (r: Reader, v: unknown): DeliveryStar => {
  const t = obj(r, v);
  return {
    min_time_left_s: r.number(t, "min_time_left_s", 0),
    max_damage: r.number(t, "max_damage", 0),
  };
};
const taxiStar = (r: Reader, v: unknown): TaxiStar => {
  const t = obj(r, v);
  return {
    min_time_left_s: r.number(t, "min_time_left_s", 0),
    min_comfort: r.number(t, "min_comfort", 0),
  };
};
const trialStar = (r: Reader, v: unknown): TrialStar => ({
  max_time_s: r.number(obj(r, v), "max_time_s", 0),
});
const parkingStar = (r: Reader, v: unknown): ParkingStar => {
  const t = obj(r, v);
  return { max_time_s: r.number(t, "max_time_s", 0), max_touches: r.number(t, "max_touches", 0) };
};
const coins = (r: Reader, v: unknown): number => r.number({ coins: v }, "coins", 0);

function isMissionType(value: unknown): value is MissionType {
  return typeof value === "string" && (MISSION_TYPES as readonly string[]).includes(value);
}

function parseBody(r: Reader, raw: Raw, type: MissionType, base: Raw): MissionDef {
  const params = r.record(raw, "params");
  const pr = r.at("params");
  switch (type) {
    case "delivery":
      return {
        ...base,
        type,
        params: parseDelivery(pr, params),
        stars: tiers(r, raw, "stars", deliveryStar),
      } as MissionDef;
    case "taxi":
      return {
        ...base,
        type,
        params: parseTaxi(pr, params),
        stars: tiers(r, raw, "stars", taxiStar),
      } as MissionDef;
    case "time_trial":
      return {
        ...base,
        type,
        params: parseTrial(pr, params),
        stars: tiers(r, raw, "stars", trialStar),
      } as MissionDef;
    case "parking":
      return {
        ...base,
        type,
        params: parseParking(pr, params),
        stars: tiers(r, raw, "stars", parkingStar),
      } as MissionDef;
  }
}

/** Parse untrusted JSON into a MissionDef. Structure only; use validateMission for the rules. */
export function parseMission(input: unknown): MissionDef {
  const issues: MissionIssue[] = [];
  if (!isRecord(input)) {
    throw new MissionError("?", [{ code: "schema", message: "mission must be a JSON object" }]);
  }
  const r = new Reader(issues, "mission");
  const id = r.string(input, "id");
  if (input.schema_version !== MISSION_SCHEMA_VERSION) {
    r.fail(
      `schema_version must be ${MISSION_SCHEMA_VERSION} (got ${String(input.schema_version)})`,
    );
  }
  const type = input.type;
  if (!isMissionType(type)) {
    r.fail(`type must be one of ${MISSION_TYPES.join("|")}`);
    throw new MissionError(id, issues);
  }
  const start = r.record(input, "start");
  const base = {
    schema_version: MISSION_SCHEMA_VERSION,
    id,
    district: r.string(input, "district"),
    title: r.string(input, "title"),
    brief: r.string(input, "brief"),
    start: { lane_point: r.lanePoint(start.lane_point, "start.lane_point") },
    reward_coins: tiers(r, input, "reward_coins", coins),
  };
  const mission = parseBody(r, input, type, base);
  if (issues.length > 0) throw new MissionError(id, issues);
  return mission;
}
