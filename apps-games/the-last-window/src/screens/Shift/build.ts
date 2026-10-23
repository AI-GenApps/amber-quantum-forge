import {
  allRegularsDue,
  buildCampaignShift,
  buildLateShift,
  ownedEffects,
  type Profile,
  type ShiftDef,
} from "@web-games/the-last-window-core";
import type { ShiftTarget } from "../../nav";
import type { LateToday } from "../../state/game";

/** The shift definition for a target, built from the saved profile (decor, relaxed mode, shelf). */
export function shiftDefFor(target: ShiftTarget, profile: Profile, late: LateToday): ShiftDef {
  const options = {
    decor: ownedEffects(profile),
    relaxed: profile.settings.relaxed,
    shelfEmpty: profile.stock.pastries.length === 0,
  };
  if (target.kind === "day") return buildCampaignShift(target.day, options);
  return buildLateShift(late.seed, late.index, late.count, allRegularsDue(), options);
}
