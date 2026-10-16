import {
  createEvaluator,
  type EvalStep,
  type Evaluator,
  type MissionDef,
  type MissionSample,
  type RoadGraph,
  resolveLanePoint,
} from "../../src/index";
import { CAR_FOOTPRINT, type MissionWorld } from "./helpers";

export const NEAR_ZERO = { x: 0, z: 1 };

export function sample(
  x: number,
  z: number,
  extra: Partial<Omit<MissionSample, "position">> = {},
): MissionSample {
  return {
    position: { x, y: 0.5, z },
    speedKmh: 20,
    longitudinalG: 0,
    lateralG: 0,
    forward: { ...NEAR_ZERO },
    hits: 0,
    ...extra,
  };
}

export function mission(world: MissionWorld, id: string): MissionDef {
  const found = world.catalog.find((m) => m.id === id);
  if (!found) throw new Error(`mission ${id} missing`);
  return found;
}

export function evaluator(world: MissionWorld, def: MissionDef): Evaluator {
  return createEvaluator(def, { graph: world.graph, car: CAR_FOOTPRINT });
}

export function at(graph: RoadGraph, def: MissionDef["start"]["lane_point"]) {
  return resolveLanePoint(graph, def);
}

/** Feed `count` identical samples. Returns the last step result. */
export function feed(ev: Evaluator, count: number, make: () => MissionSample): EvalStep {
  let last: EvalStep = { status: "active" };
  for (let i = 0; i < count; i++) {
    last = ev.step(make());
    if (last.status !== "active") return last;
  }
  return last;
}
