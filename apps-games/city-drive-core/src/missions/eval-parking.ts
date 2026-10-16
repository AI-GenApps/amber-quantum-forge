import type { RoadGraph } from "../city/graph";
import { type BayGeometry, bayAlignment, bayGeometry, carInsideBay } from "./bay";
import { PARK_ALIGN_COS, PARK_HOLD_TICKS, PARK_MAX_SPEED_KMH } from "./constants";
import { Counters, pickStars } from "./counters";
import type {
  CarFootprint,
  EvalStep,
  Evaluator,
  MissionSample,
  Objective,
  ParkingMission,
  Stars,
} from "./types";

/** Park in the bay: inside it, within 15 degrees of its axis and stopped, for one second. */
export class ParkingEvaluator implements Evaluator {
  private readonly counters: Counters;
  readonly bay: BayGeometry;
  private held = 0;
  private parked = false;

  constructor(
    private readonly mission: ParkingMission,
    graph: RoadGraph,
    private readonly car: CarFootprint,
  ) {
    this.counters = new Counters(mission.params.time_limit_s);
    this.bay = bayGeometry(graph, mission.params.bay);
  }

  /** The car meets every parking condition on this step. */
  private settled(sample: MissionSample): boolean {
    return (
      Math.abs(sample.speedKmh) < PARK_MAX_SPEED_KMH &&
      bayAlignment(this.bay, sample.forward) >= PARK_ALIGN_COS &&
      carInsideBay(this.bay, sample.position, sample.forward, this.car)
    );
  }

  step(sample: MissionSample): EvalStep {
    this.counters.advance(sample);
    this.held = this.settled(sample) ? this.held + 1 : 0;
    if (this.held >= PARK_HOLD_TICKS) {
      this.parked = true;
      return { status: "success" };
    }
    if (this.counters.damage > this.mission.params.max_touches) {
      return { status: "fail", reason: "damage_limit" };
    }
    if (this.counters.timedOut) return { status: "fail", reason: "time_out" };
    return { status: "active" };
  }

  /** Seconds of the one-second hold completed so far, 0..1. */
  holdProgress(): number {
    return Math.min(1, this.held / PARK_HOLD_TICKS);
  }

  objective(): Objective | undefined {
    if (this.parked) return undefined;
    const lane = this.mission.params.bay.lane_point;
    return {
      kind: "bay",
      label: "Park in the bay",
      x: this.bay.centre.x,
      z: this.bay.centre.z,
      radius: this.bay.halfLength,
      lane,
    };
  }

  progress() {
    return { done: this.parked ? 1 : 0, total: 1 };
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
        this.counters.tookAtMost(stars[level].max_time_s) &&
        this.counters.damage <= stars[level].max_touches,
    );
  }
}
