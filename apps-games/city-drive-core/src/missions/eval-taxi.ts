import type { RoadGraph } from "../city/graph";
import { FIXED_DT } from "../physics/clock";
import {
  COMFORT_DRAIN_PER_G_S,
  COMFORT_HIT_PENALTY,
  COMFORT_LAT_G,
  COMFORT_LONG_G,
  COMFORT_START,
  POINT_RADIUS_M,
} from "./constants";
import { Counters, pickStars, StopSequence } from "./counters";
import { stopAt } from "./eval-delivery";
import type { EvalStep, Evaluator, MissionSample, Stars, TaxiMission } from "./types";

/** Slack for floating-point drift when a drained comfort lands exactly on a star threshold. */
const COMFORT_EPSILON = 1e-6;

/** Comfort lost in one step: harsh acceleration, braking or cornering, plus any hits. */
export function comfortLoss(sample: MissionSample): number {
  const long = Math.max(0, Math.abs(sample.longitudinalG) - COMFORT_LONG_G);
  const lat = Math.max(0, Math.abs(sample.lateralG) - COMFORT_LAT_G);
  return (long + lat) * COMFORT_DRAIN_PER_G_S * FIXED_DT + sample.hits * COMFORT_HIT_PENALTY;
}

/** Like a delivery, plus a passenger who minds harsh driving once on board. */
export class TaxiEvaluator implements Evaluator {
  private readonly counters: Counters;
  private readonly stops: StopSequence;
  private comfortValue = COMFORT_START;

  constructor(
    private readonly mission: TaxiMission,
    graph: RoadGraph,
  ) {
    const p = mission.params;
    const radius = p.radius_m ?? POINT_RADIUS_M;
    this.counters = new Counters(p.time_limit_s);
    this.stops = new StopSequence([
      stopAt(graph, p.pickup, "pickup", "Pick up the passenger", radius),
      stopAt(graph, p.drop, "dropoff", "Drop the passenger off", radius),
    ]);
  }

  step(sample: MissionSample): EvalStep {
    this.counters.advance(sample);
    const onBoard = this.stops.done === 1;
    if (onBoard) this.comfortValue = Math.max(0, this.comfortValue - comfortLoss(sample));
    this.stops.update(sample);
    if (this.stops.finished) return { status: "success" };
    if (this.comfortValue <= 0) return { status: "fail", reason: "comfort_zero" };
    if (this.counters.timedOut) return { status: "fail", reason: "time_out" };
    return { status: "active" };
  }

  objective() {
    return this.stops.current();
  }

  progress() {
    return { done: this.stops.done, total: this.stops.total };
  }

  elapsedS(): number {
    return this.counters.elapsedS;
  }

  timeLeftS(): number {
    return this.counters.timeLeftS;
  }

  damage(): number {
    return this.counters.damage;
  }

  comfort(): number {
    return this.comfortValue;
  }

  stars(): Stars {
    const { stars } = this.mission;
    return pickStars(
      (level) =>
        this.counters.hasTimeLeft(stars[level].min_time_left_s) &&
        this.comfortValue + COMFORT_EPSILON >= stars[level].min_comfort,
    );
  }
}
