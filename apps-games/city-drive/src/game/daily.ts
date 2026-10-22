import { dateKeyOf, type MissionDef, parseMission } from "@city-drive/core";
import { DISTRICT_MISSIONS } from "./missions";

/** Every bundled mission, parsed, in district order. The daily picks from the unlocked ones. */
export function allMissionDefs(): MissionDef[] {
  return Object.values(DISTRICT_MISSIONS).flatMap((files) => files.map((f) => parseMission(f)));
}

/** Today's UTC date from the device clock, the only clock the daily uses. */
export function deviceToday(now: () => number = Date.now): string {
  return dateKeyOf(now());
}
