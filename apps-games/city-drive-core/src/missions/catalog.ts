import { MissionError } from "./errors";
import { parseMission } from "./parse";
import type { MissionDef } from "./types";
import { assertValidMission, type ValidationContext } from "./validate";

export type MissionCatalog = readonly MissionDef[];

/** Parse and validate a set of mission files against their city. Ids must be unique. */
export function loadMissionCatalog(
  raw: readonly unknown[],
  ctx: ValidationContext,
): MissionCatalog {
  const seen = new Set<string>();
  return raw.map((entry) => {
    const mission = parseMission(entry);
    if (seen.has(mission.id)) {
      throw new MissionError(mission.id, [
        { code: "duplicate-id", message: `id "${mission.id}" is used twice` },
      ]);
    }
    seen.add(mission.id);
    assertValidMission(mission, ctx);
    return mission;
  });
}
