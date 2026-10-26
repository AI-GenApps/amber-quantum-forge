import {
  FINALE_DAY,
  MAX_SCENES_FINALE_EVENING,
  MAX_SCENES_PER_EVENING,
  SCENES_PER_REGULAR,
} from "../constants";
import { levelForFp } from "./friendship";
import type { RegularProgress, SceneRef } from "./types";

export function eligibleScenes(progress: readonly RegularProgress[]): SceneRef[] {
  const out: SceneRef[] = [];
  for (const entry of progress) {
    const index = entry.scenesDone + 1;
    if (index > SCENES_PER_REGULAR) continue;
    if (levelForFp(entry.fp) >= index && entry.visits >= index) {
      out.push({ regularId: entry.regularId, index });
    }
  }
  return out;
}

export function eveningLimit(day: number, cap: number = MAX_SCENES_PER_EVENING): number {
  return day === FINALE_DAY ? MAX_SCENES_FINALE_EVENING : cap;
}

export function eveningQueue(
  eligible: readonly SceneRef[],
  cap: number = MAX_SCENES_PER_EVENING,
  day = 0,
): SceneRef[] {
  const sorted = eligible.slice().sort((a, b) => a.regularId - b.regularId || a.index - b.index);
  return sorted.slice(0, eveningLimit(day, cap));
}
