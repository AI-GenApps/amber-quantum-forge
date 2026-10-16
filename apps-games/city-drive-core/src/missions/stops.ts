import type { LanePointRef, MissionDef } from "./types";

export interface MissionStop {
  label: string;
  ref: LanePointRef;
}

/** The lane points a mission asks the player to reach, in order (the start marker is not one). */
export function missionStops(mission: MissionDef): MissionStop[] {
  switch (mission.type) {
    case "delivery":
      return [
        { label: "pickup", ref: mission.params.pickup },
        ...mission.params.drops.map((ref, i) => ({ label: `drops[${i}]`, ref })),
      ];
    case "taxi":
      return [
        { label: "pickup", ref: mission.params.pickup },
        { label: "drop", ref: mission.params.drop },
      ];
    case "time_trial":
      return mission.params.checkpoints.map((c, i) => ({
        label: `checkpoints[${i}]`,
        ref: c.lane_point,
      }));
    case "parking":
      return [{ label: "bay", ref: mission.params.bay.lane_point }];
  }
}
