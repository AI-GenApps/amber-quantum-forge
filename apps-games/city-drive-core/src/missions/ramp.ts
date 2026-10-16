import type { MissionDef, MissionType } from "./types";
import { MISSION_TYPES } from "./types";

export interface RampIssue {
  district: string;
  message: string;
}

/** Number of missions whose difficulty is lower than the one before it. */
export function countInversions(difficulties: readonly number[]): number {
  let n = 0;
  for (let i = 1; i < difficulties.length; i++) {
    if ((difficulties[i] as number) < (difficulties[i - 1] as number)) n++;
  }
  return n;
}

function byId(a: MissionDef, b: MissionDef): number {
  return a.id.localeCompare(b.id);
}

/**
 * Check the content rules: per district, difficulty never drops more than `maxInversions` times
 * going through the missions in id order, each district's first mission is easier than the last
 * mission of the district before it, and every district holds `perType` missions of each type.
 */
export function checkRamp(
  districts: readonly { id: string; missions: readonly MissionDef[] }[],
  maxInversions: number,
  perType: number,
): RampIssue[] {
  const issues: RampIssue[] = [];
  let previousLast: MissionDef | undefined;
  for (const district of districts) {
    const missions = [...district.missions].sort(byId);
    const add = (message: string) => issues.push({ district: district.id, message });
    const difficulties = missions.map((m) => m.difficulty);
    if (difficulties.some((d) => d === undefined)) {
      add("a mission has no difficulty; run the validation tool");
      continue;
    }
    const values = difficulties as number[];
    const inversions = countInversions(values);
    if (inversions > maxInversions) {
      add(`difficulty drops ${inversions} times (allowed ${maxInversions}): ${values.join(", ")}`);
    }
    const first = missions[0];
    if (
      first &&
      previousLast &&
      (first.difficulty as number) >= (previousLast.difficulty as number)
    ) {
      add(
        `${first.id} (${first.difficulty}) is not easier than ${previousLast.id} (${previousLast.difficulty})`,
      );
    }
    for (const type of MISSION_TYPES as readonly MissionType[]) {
      const count = missions.filter((m) => m.type === type).length;
      if (count !== perType) add(`has ${count} ${type} missions, expected ${perType}`);
    }
    previousLast = missions[missions.length - 1];
  }
  return issues;
}
