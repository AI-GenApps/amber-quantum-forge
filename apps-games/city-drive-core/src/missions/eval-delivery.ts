import type { RoadGraph } from "../city/graph";
import { resolveLanePoint } from "./bay";
import { POINT_RADIUS_M } from "./constants";
import { Counters, pickStars, type Stop, StopSequence } from "./counters";
import type { DeliveryMission, EvalStep, Evaluator, MissionSample, Stars } from "./types";

export function stopAt(
  graph: RoadGraph,
  lane: Stop["lane"],
  kind: Stop["kind"],
  label: string,
  radius: number,
): Stop {
  const at = resolveLanePoint(graph, lane);
  return { kind, label, x: at.x, z: at.z, radius, lane };
}

/** Pick up at A, then drop at one to three places, before time runs out and without wrecking the car. */
export class DeliveryEvaluator implements Evaluator {
  private readonly counters: Counters;
  private readonly stops: StopSequence;

  constructor(
    private readonly mission: DeliveryMission,
    graph: RoadGraph,
  ) {
    const p = mission.params;
    const radius = p.radius_m ?? POINT_RADIUS_M;
    this.counters = new Counters(p.time_limit_s);
    this.stops = new StopSequence([
      stopAt(graph, p.pickup, "pickup", "Pick up the parcel", radius),
      ...p.drops.map((drop, i) =>
        stopAt(
          graph,
          drop,
          "dropoff",
          p.drops.length > 1 ? `Deliver ${i + 1} of ${p.drops.length}` : "Deliver the parcel",
          radius,
        ),
      ),
    ]);
  }

  step(sample: MissionSample): EvalStep {
    this.counters.advance(sample);
    this.stops.update(sample);
    if (this.stops.finished) return { status: "success" };
    if (this.counters.damage > this.mission.params.max_damage) {
      return { status: "fail", reason: "damage_limit" };
    }
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

  comfort(): null {
    return null;
  }

  stars(): Stars {
    const { stars } = this.mission;
    return pickStars(
      (level) =>
        this.counters.hasTimeLeft(stars[level].min_time_left_s) &&
        this.counters.damage <= stars[level].max_damage,
    );
  }
}
