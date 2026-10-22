import {
  type DailyChallenge,
  type DailyStatus,
  dailyReward,
  type MissionType,
  streakBonus,
  type Tiers,
} from "@city-drive/core";
import { TYPE_LABELS } from "./format";

/** What the Home daily card shows. */
export interface DailyCard {
  missionId: string;
  title: string;
  type: MissionType;
  typeLabel: string;
  district: string;
  status: DailyStatus;
  /** Streak a claim today would make. */
  streak: number;
  /** Coins per star level for today, streak bonus included. */
  rewards: Tiers<number>;
  bonusPercent: number;
  /** Tighter par times and busier roads, in words, for the briefing line. */
  twist: string;
}

const PAR_WORDS = ["", "tighter par times", "much tighter par times"] as const;
const TRAFFIC_WORDS = ["", "busier roads", "heavy traffic"] as const;

function twistOf(challenge: DailyChallenge): string {
  const { parStep, trafficStep } = challenge.variant;
  const parts = [PAR_WORDS[parStep], TRAFFIC_WORDS[trafficStep]].filter((p) => p !== "");
  return parts.length === 0 ? "Standard rules" : parts.join(", ");
}

export function dailyCard(challenge: DailyChallenge): DailyCard {
  const pay = (stars: 1 | 2 | 3): number => {
    const { base, bonus } = dailyReward(stars, challenge.streak);
    return base + bonus;
  };
  return {
    missionId: challenge.missionId,
    title: challenge.mission.title,
    type: challenge.mission.type,
    typeLabel: TYPE_LABELS[challenge.mission.type],
    district: challenge.mission.district,
    status: challenge.status,
    streak: challenge.streak,
    rewards: { "1": pay(1), "2": pay(2), "3": pay(3) },
    bonusPercent: Math.round(streakBonus(challenge.streak) * 100),
    twist: twistOf(challenge),
  };
}
