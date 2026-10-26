import { getCase } from "../content";
import type { CaseDef, CaseState } from "../types";
import { evaluateAchievements, grantAchievements } from "./achievements";
import { applyDailyResult, type DailyStep } from "./daily";
import { applyCaseResult, type EconomyEvent, resultOf } from "./economy";
import type { Profile } from "./profile";

export interface Closed {
  profile: Profile;
  events: EconomyEvent[];
  achievements: string[];
  counted: boolean;
}

function earn(profile: Profile, events: EconomyEvent[], ids: string[]): Closed {
  return {
    profile: grantAchievements(profile, ids),
    events: [...events, ...ids.map((id): EconomyEvent => ({ type: "achievement-earned", id }))],
    achievements: ids,
    counted: true,
  };
}

/** Records a finished campaign case, clears the saved session and awards achievements. */
export function closeCampaignCase(profile: Profile, def: CaseDef, state: CaseState): Closed {
  if (!state.closed || getCase(def.id) === undefined) {
    return { profile, events: [], achievements: [], counted: false };
  }
  const previousStamps = profile.cases[def.id]?.stamps ?? 0;
  const applied = applyCaseResult(profile, def.id, resultOf(state));
  const cleared = { ...applied.profile, session: null };
  const ids = evaluateAchievements(cleared, {
    def,
    state,
    previousStamps,
    kind: "campaign",
  });
  return earn(cleared, applied.events, ids);
}

export interface DailyClose {
  dateKey: string;
  step: DailyStep;
  missedDays?: number;
}

/** Records a finished Daily Parcel; a clock that went back changes nothing but the session. */
export function closeDailyCase(
  profile: Profile,
  def: CaseDef,
  state: CaseState,
  close: DailyClose,
): Closed {
  const applied = applyDailyResult(profile, {
    dateKey: close.dateKey,
    step: close.step,
    stamps: state.stamps ?? 0,
    hints: state.hintsUsed,
    ...(close.missedDays === undefined ? {} : { missedDays: close.missedDays }),
  });
  const cleared = { ...applied.profile, session: null };
  if (!applied.counted) return { profile: cleared, events: [], achievements: [], counted: false };
  const ids = evaluateAchievements(cleared, { def, state, kind: "daily" });
  return earn(cleared, applied.events, ids);
}
