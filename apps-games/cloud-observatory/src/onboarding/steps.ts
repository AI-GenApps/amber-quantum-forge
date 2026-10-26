import {
  type Profile,
  pendingShards,
  RULES,
  type Tutorial,
} from "@web-games/cloud-observatory-core";
import { atlasCards } from "../screens/derive";
import type { SessionSnapshot } from "../session/types";

export type StepId = "observe" | "build" | "atlas" | "chart";
export type StepFlag = keyof Tutorial;

export const STEP_ORDER: readonly StepId[] = ["observe", "build", "atlas", "chart"];
export const OBSERVE_TAPS = 3;
export const BUILD_AT_STARLIGHT = 15;

/** Which screen shows each hint. */
export const STEP_SCREEN: Readonly<Record<StepId, "shell" | "chart">> = {
  observe: "shell",
  build: "shell",
  atlas: "shell",
  chart: "chart",
};

/** What the coach has seen since this pass began (taps are counted from zero on a replay). */
export interface Machine {
  readonly taps: number;
}

export const initialMachine: Machine = { taps: 0 };

export type TutorialEvent =
  | { readonly type: "gather"; readonly count: number }
  | { readonly type: "buy" }
  | { readonly type: "chart-open" }
  | { readonly type: "star" }
  | { readonly type: "reset" };

export interface Outcome {
  readonly machine: Machine;
  readonly set: readonly StepFlag[];
}

export interface Situation {
  readonly chartOpen: boolean;
}

/** The hint to show now, or null. Steps run in order and each waits for what it teaches. */
export function activeStep(profile: Profile, situation: Situation): StepId | null {
  const flags = profile.tutorial;
  if (flags.skipped) return null;
  if (!flags.observe) return "observe";
  if (!flags.build) return profile.game.starlight >= BUILD_AT_STARLIGHT ? "build" : null;
  if (!flags.atlas)
    return atlasCards(profile).some((card) => card.state === "ready") ? "atlas" : null;
  if (!flags.chart) return situation.chartOpen ? "chart" : null;
  return null;
}

/** What one game event changes: the flags to persist and the next machine state. */
export function advance(profile: Profile, machine: Machine, event: TutorialEvent): Outcome {
  const flags = profile.tutorial;
  switch (event.type) {
    case "reset":
      return { machine: initialMachine, set: [] };
    case "gather": {
      const taps = machine.taps + Math.max(0, event.count);
      const done = !flags.observe && taps >= OBSERVE_TAPS;
      return { machine: { taps }, set: done ? ["observe"] : [] };
    }
    case "buy":
      return { machine, set: flags.build ? [] : ["build"] };
    case "chart-open":
      return { machine, set: flags.atlas ? [] : ["atlas"] };
    case "star":
      return { machine, set: flags.chart ? [] : ["chart"] };
  }
}

/**
 * Flags that a save already satisfies, so a returning player is not taught what they know.
 * Applied once when a save loads; a replay does not use it.
 */
export function impliedFlags(profile: Profile): StepFlag[] {
  const flags = profile.tutorial;
  const { game } = profile;
  const bought = Object.values(game.owned).some((count) => count > 0);
  const charted = game.charted.length > 0;
  const out: StepFlag[] = [];
  const want = (flag: StepFlag, implied: boolean) => {
    if (implied && !flags[flag]) out.push(flag);
  };
  want("observe", bought || charted || game.taps >= OBSERVE_TAPS);
  want("build", bought || charted);
  want("atlas", charted);
  want("chart", charted);
  return [...new Set(out)];
}

/** The one-time Eclipse explainer: shown when pending shards first reach the minimum. */
export function shouldShowEclipseIntro(profile: Profile): boolean {
  if (profile.eclipseIntroSeen) return false;
  return pendingShards(profile.game.cycleStarlight) >= RULES.ECLIPSE_MIN_SHARDS;
}

function ownedTotal(snapshot: SessionSnapshot): number {
  return Object.values(snapshot.profile.game.owned).reduce((sum, count) => sum + count, 0);
}

/** The events that turned one snapshot into the next. */
export function eventsBetween(before: SessionSnapshot, after: SessionSnapshot): TutorialEvent[] {
  const events: TutorialEvent[] = [];
  const taps = after.profile.game.taps - before.profile.game.taps;
  if (taps < 0 || after.profile.createdMs !== before.profile.createdMs) {
    events.push({ type: "reset" });
  } else if (taps > 0) events.push({ type: "gather", count: taps });
  if (ownedTotal(after) > ownedTotal(before)) events.push({ type: "buy" });
  if (before.chart === null && after.chart !== null) events.push({ type: "chart-open" });
  if (before.chart && after.chart && after.chart.next > before.chart.next) {
    events.push({ type: "star" });
  }
  return events;
}
