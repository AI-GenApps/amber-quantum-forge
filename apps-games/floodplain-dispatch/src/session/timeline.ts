import {
  createSimState,
  type Evaluation,
  evaluate,
  type MapDef,
  NEED_STEPS,
  type Placement,
  runSeason,
  type SeasonResult,
  STEPS_PER_WEEK,
  stepOnce,
} from "@web-games/floodplain-dispatch-core";
import type { Badge } from "../board/model";

export interface Snapshot {
  depths: Uint8Array;
  houseFlooded: Uint16Array;
  houseSupplied: Uint16Array;
  fieldWet: Uint16Array;
}

export interface Timeline {
  weeks: number;
  steps: number;
  frames: Snapshot[];
  result: SeasonResult;
  evaluation: Evaluation;
}

function snapshotOf(state: ReturnType<typeof createSimState>): Snapshot {
  return {
    depths: state.depths.slice(),
    houseFlooded: state.houseFlooded.slice(),
    houseSupplied: state.houseSupplied.slice(),
    fieldWet: state.fieldWet.slice(),
  };
}

export function buildTimeline(def: MapDef, placements: readonly Placement[]): Timeline {
  const state = createSimState(def, placements);
  const weeks = Math.max(0, Math.floor(def.weeks));
  const steps = weeks * STEPS_PER_WEEK;
  const frames: Snapshot[] = [snapshotOf(state)];
  for (let i = 0; i < steps; i++) {
    stepOnce(state);
    frames.push(snapshotOf(state));
  }
  const result = runSeason(def, placements);
  return { weeks, steps, frames, result, evaluation: evaluate(def, result, placements) };
}

export function weekOfStep(pos: number): number {
  return Math.floor(pos / STEPS_PER_WEEK);
}

export function frameAt(timeline: Timeline, pos: number): Snapshot {
  const index = Math.max(0, Math.min(timeline.steps, Math.floor(pos)));
  return timeline.frames[index] as Snapshot;
}

export function badgesAt(
  timeline: Timeline,
  houses: readonly { x: number; y: number }[],
  fields: readonly { x: number; y: number }[],
  pos: number,
): Badge[] {
  const snap = frameAt(timeline, pos);
  const final = pos >= timeline.steps;
  const out: Badge[] = [];
  houses.forEach((cell, i) => {
    const flooded = (snap.houseFlooded[i] ?? 0) >= 1;
    const supplied = (snap.houseSupplied[i] ?? 0) >= NEED_STEPS;
    if (flooded) out.push({ ...cell, kind: "flooded", target: "house" });
    else if (supplied) out.push({ ...cell, kind: "supplied", target: "house" });
    else if (final) out.push({ ...cell, kind: "dry", target: "house" });
  });
  fields.forEach((cell, i) => {
    const wet = (snap.fieldWet[i] ?? 0) >= NEED_STEPS;
    if (wet) out.push({ ...cell, kind: "irrigated", target: "field" });
    else if (final) out.push({ ...cell, kind: "dry", target: "field" });
  });
  return out;
}

export interface BadgeCounts {
  suppliedHouses: number;
  floodedHouses: number;
  irrigatedFields: number;
}

export function countBadges(badges: readonly Badge[]): BadgeCounts {
  return {
    suppliedHouses: badges.filter((b) => b.kind === "supplied").length,
    floodedHouses: badges.filter((b) => b.kind === "flooded").length,
    irrigatedFields: badges.filter((b) => b.kind === "irrigated").length,
  };
}
