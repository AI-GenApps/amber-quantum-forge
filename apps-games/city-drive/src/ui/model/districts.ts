import {
  bestStars,
  isDistrictUnlocked,
  type MissionType,
  type Progression,
  type SaveData,
  totalStars,
} from "@city-drive/core";

const MISSION_TYPES: readonly string[] = ["delivery", "taxi", "time_trial", "parking"];

/** What the map needs to list a mission. Read from the raw mission file. */
export interface MissionSummary {
  id: string;
  title: string;
  type: MissionType;
}

interface MissionRow extends MissionSummary {
  /** Best stars earned so far, 0 when never completed. */
  stars: 0 | 1 | 2 | 3;
  bestTimeS: number | null;
}

export interface DistrictCard {
  id: string;
  name: string;
  locked: boolean;
  /** Total stars the player needs before this district opens. */
  unlockStars: number;
  /** Stars still missing (0 when open). */
  starsMissing: number;
  stars: number;
  maxStars: number;
  /** Earned stars over the possible stars, 0 to 1. */
  progress: number;
  missions: MissionRow[];
}

/** Reads the three fields the UI needs from a raw mission file. Throws a descriptive error. */
export function summarizeMission(raw: unknown): MissionSummary {
  const r = (typeof raw === "object" && raw !== null ? raw : {}) as Record<string, unknown>;
  const { id, title, type } = r;
  if (typeof id !== "string" || typeof title !== "string" || typeof type !== "string") {
    throw new Error("mission file needs string id, title and type fields");
  }
  if (!MISSION_TYPES.includes(type)) throw new Error(`mission "${id}" has unknown type "${type}"`);
  return { id, title, type: type as MissionType };
}

/** One card per district, in progression order. Locks follow the player's total stars. */
export function districtCards(
  progression: Progression,
  missionsByDistrict: Readonly<Record<string, readonly MissionSummary[]>>,
  save: SaveData,
): DistrictCard[] {
  const total = totalStars(save);
  return progression.districts.map((district) => {
    const list = missionsByDistrict[district.id] ?? [];
    const missions: MissionRow[] = list.map((m) => ({
      ...m,
      stars: bestStars(save, m.id),
      bestTimeS: save.missions[m.id]?.best_time_s ?? null,
    }));
    const stars = missions.reduce((sum, m) => sum + m.stars, 0);
    const maxStars = missions.length * 3;
    const locked = !isDistrictUnlocked(progression, total, district.id);
    return {
      id: district.id,
      name: district.name,
      locked,
      unlockStars: district.unlock_stars,
      starsMissing: Math.max(0, district.unlock_stars - total),
      stars,
      maxStars,
      progress: maxStars === 0 ? 0 : stars / maxStars,
      missions,
    };
  });
}

/** The mission after `missionId` in the same district, or undefined for the last one. */
export function nextMissionId(
  list: readonly MissionSummary[],
  missionId: string,
): string | undefined {
  const index = list.findIndex((m) => m.id === missionId);
  return index < 0 ? undefined : list[index + 1]?.id;
}
