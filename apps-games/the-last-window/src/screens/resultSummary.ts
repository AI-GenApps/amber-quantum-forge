import {
  CAMPAIGN_COMPLETE_DAY,
  levelForFp,
  type Profile,
  type ProgressEvent,
  REGULARS,
  regularOf,
  type SceneRef,
  type ShiftResult,
  sceneIdOf,
} from "@web-games/the-last-window-core";

export interface HeartRow {
  regularId: number;
  level: number;
}

export interface ResultSummary {
  kind: "day" | "late";
  day: number;
  dateKey: string | null;
  result: ShiftResult;
  events: ProgressEvent[];
  scenes: string[];
  waiting: number;
  lamp: number;
  streakBonus: number;
  replay: boolean;
  campaignDone: boolean;
  hearts: HeartRow[];
  coins: number;
}

export interface SummaryInput {
  kind: "day" | "late";
  day: number;
  dateKey?: string | null;
  result: ShiftResult;
  events: ProgressEvent[];
  queue: SceneRef[];
  remainder: SceneRef[];
  lamp?: number;
  streakBonus?: number;
  replay?: boolean;
  profile: Profile;
}

export function buildSummary(input: SummaryInput): ResultSummary {
  return {
    kind: input.kind,
    day: input.day,
    dateKey: input.dateKey ?? null,
    result: input.result,
    events: input.events,
    scenes: input.queue.flatMap((ref) => sceneIdOf(ref) ?? []),
    waiting: input.remainder.length,
    lamp: input.lamp ?? 0,
    streakBonus: input.streakBonus ?? 0,
    replay: input.replay ?? false,
    campaignDone: input.profile.day >= CAMPAIGN_COMPLETE_DAY,
    hearts: REGULARS.map((regular) => ({
      regularId: regular.id,
      level: levelForFp(regularOf(input.profile, regular.id).fp),
    })),
    coins: input.profile.coins,
  };
}
