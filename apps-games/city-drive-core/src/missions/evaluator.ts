import type { RoadGraph } from "../city/graph";
import { DeliveryEvaluator } from "./eval-delivery";
import { ParkingEvaluator } from "./eval-parking";
import { TaxiEvaluator } from "./eval-taxi";
import { TrialEvaluator } from "./eval-trial";
import type { CarFootprint, Evaluator, MissionDef } from "./types";

export interface EvaluatorContext {
  graph: RoadGraph;
  car: CarFootprint;
}

/** The evaluator for a mission's type. */
export function createEvaluator(mission: MissionDef, ctx: EvaluatorContext): Evaluator {
  switch (mission.type) {
    case "delivery":
      return new DeliveryEvaluator(mission, ctx.graph);
    case "taxi":
      return new TaxiEvaluator(mission, ctx.graph);
    case "time_trial":
      return new TrialEvaluator(mission, ctx.graph);
    case "parking":
      return new ParkingEvaluator(mission, ctx.graph, ctx.car);
  }
}
