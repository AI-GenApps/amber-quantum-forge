import type { MissionDef } from "@city-drive/core";
import { formatClock } from "./format";

export interface StarTarget {
  stars: 1 | 2 | 3;
  /** What the player must do for this star, in plain words. */
  text: string;
  coins: number;
}

type Level = "1" | "2" | "3";

const LEVELS: readonly Level[] = ["1", "2", "3"];

const seconds = (s: number): string => `${Math.round(s)}s`;

/** The rule for one star level, in the words of the mission's type. */
function targetText(mission: MissionDef, level: Level): string {
  switch (mission.type) {
    case "delivery": {
      const s = mission.stars[level];
      return `${seconds(s.min_time_left_s)} left, damage ${s.max_damage} or less`;
    }
    case "taxi": {
      const s = mission.stars[level];
      return `${seconds(s.min_time_left_s)} left, comfort ${s.min_comfort}% or more`;
    }
    case "time_trial":
      return `Finish in ${seconds(mission.stars[level].max_time_s)}`;
    case "parking": {
      const s = mission.stars[level];
      return `Park in ${seconds(s.max_time_s)}, ${s.max_touches} touches or fewer`;
    }
  }
}

/** The three star thresholds of a mission as readable lines, with the coin reward of each. */
export function starTargets(mission: MissionDef): StarTarget[] {
  return LEVELS.map((level, index) => ({
    stars: (index + 1) as 1 | 2 | 3,
    text: targetText(mission, level),
    coins: mission.reward_coins[level],
  }));
}

/** Time limit as a clock, for the briefing. */
export function timeLimitText(mission: MissionDef): string {
  return formatClock(mission.params.time_limit_s);
}
