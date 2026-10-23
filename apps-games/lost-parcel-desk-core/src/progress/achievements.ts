import type { AchievementRule } from "../content";
import { ACHIEVEMENTS, CHAPTERS } from "../content";
import type { CaseDef, CaseState } from "../types";
import type { Profile } from "./profile";
import { isClosed, totalStamps } from "./unlocks";

export interface AchievementContext {
  def?: CaseDef;
  state?: CaseState;
  previousStamps?: number;
  kind?: "campaign" | "daily";
}

function finished(context: AchievementContext): CaseState | null {
  const state = context.state;
  return state?.closed === true && state.stamps !== null ? state : null;
}

function holds(rule: AchievementRule, profile: Profile, context: AchievementContext): boolean {
  switch (rule.kind) {
    case "close-case":
      return isClosed(profile, rule.caseId);
    case "close-with-stamps": {
      const state = finished(context);
      if (state === null) return false;
      return (state.stamps ?? 0) >= rule.stamps && (!rule.noHint || state.hintsUsed === 0);
    }
    case "all-faces-inspected": {
      const state = finished(context);
      if (state === null || context.def === undefined) return false;
      const all = context.def.clues.map((clue) => clue.id);
      return all.length > 0 && all.every((id) => state.foundClueIds.includes(id));
    }
    case "close-chapter": {
      const chapter = CHAPTERS.find((item) => item.id === rule.chapter);
      return chapter?.caseIds.every((id) => isClosed(profile, id)) === true;
    }
    case "total-stamps":
      return totalStamps(profile) >= rule.stamps;
    case "daily-streak":
      return profile.daily.bestStreak >= rule.days;
    case "replay-improve": {
      const state = finished(context);
      const previous = context.previousStamps ?? 0;
      return (
        state !== null &&
        context.kind !== "daily" &&
        previous >= 1 &&
        (state.stamps ?? 0) > previous
      );
    }
  }
}

export function evaluateAchievements(profile: Profile, context: AchievementContext = {}): string[] {
  return ACHIEVEMENTS.filter(
    (item) => profile.achievements[item.id] !== true && holds(item.rule, profile, context),
  ).map((item) => item.id);
}

export function grantAchievements(profile: Profile, ids: readonly string[]): Profile {
  if (ids.length === 0) return profile;
  const achievements = { ...profile.achievements };
  for (const id of ids) achievements[id] = true;
  return { ...profile, achievements };
}
