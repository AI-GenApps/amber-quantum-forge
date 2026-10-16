import d1m01 from "@city-drive/core/missions/d1-m01.json";
import d1m02 from "@city-drive/core/missions/d1-m02.json";
import d1m03 from "@city-drive/core/missions/d1-m03.json";
import d1m04 from "@city-drive/core/missions/d1-m04.json";
import d1m05 from "@city-drive/core/missions/d1-m05.json";
import d1m06 from "@city-drive/core/missions/d1-m06.json";
import d1m07 from "@city-drive/core/missions/d1-m07.json";
import d1m08 from "@city-drive/core/missions/d1-m08.json";
import d2m01 from "@city-drive/core/missions/d2-m01.json";
import d2m02 from "@city-drive/core/missions/d2-m02.json";
import d2m03 from "@city-drive/core/missions/d2-m03.json";
import d2m04 from "@city-drive/core/missions/d2-m04.json";
import d2m05 from "@city-drive/core/missions/d2-m05.json";
import d2m06 from "@city-drive/core/missions/d2-m06.json";
import d2m07 from "@city-drive/core/missions/d2-m07.json";
import d2m08 from "@city-drive/core/missions/d2-m08.json";
import d3m01 from "@city-drive/core/missions/d3-m01.json";
import d3m02 from "@city-drive/core/missions/d3-m02.json";
import d3m03 from "@city-drive/core/missions/d3-m03.json";
import d3m04 from "@city-drive/core/missions/d3-m04.json";
import d3m05 from "@city-drive/core/missions/d3-m05.json";
import d3m06 from "@city-drive/core/missions/d3-m06.json";
import d3m07 from "@city-drive/core/missions/d3-m07.json";
import d3m08 from "@city-drive/core/missions/d3-m08.json";
import progression from "@city-drive/core/progression.json";

export type DistrictId = "district-1" | "district-2" | "district-3";

/** Raw mission files per district. The session parses and validates them against its road graph. */
export const DISTRICT_MISSIONS: Readonly<Record<DistrictId, readonly unknown[]>> = {
  "district-1": [d1m01, d1m02, d1m03, d1m04, d1m05, d1m06, d1m07, d1m08],
  "district-2": [d2m01, d2m02, d2m03, d2m04, d2m05, d2m06, d2m07, d2m08],
  "district-3": [d3m01, d3m02, d3m03, d3m04, d3m05, d3m06, d3m07, d3m08],
};

/** Raw `progression.json`: unlock thresholds, difficulty weights and each district's traffic. */
export const PROGRESSION_RAW: unknown = progression;

/** Raw district-1 mission files (the first district, open from the start). */
export const DISTRICT_1_MISSIONS: readonly unknown[] = DISTRICT_MISSIONS["district-1"];

export function isDistrictId(value: string): value is DistrictId {
  return Object.hasOwn(DISTRICT_MISSIONS, value);
}
