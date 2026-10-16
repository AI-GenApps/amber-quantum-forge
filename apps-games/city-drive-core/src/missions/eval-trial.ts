import type { RoadGraph } from "../city/graph";
import { CHECKPOINT_RADIUS_M } from "./constants";
import { Counters, pickStars, StopSequence } from "./counters";
import { stopAt } from "./eval-delivery";
import type { EvalStep, Evaluator, MissionSample, Stars, TrialMission } from "./types";

/** Drive through the checkpoints in order; the last one is the finish. Stars come from the time. */
export class TrialEvaluator implements Evaluator {
  private readonly counters: Counters;
  private readonly stops: StopSequence;

  constructor(
    private readonly mission: TrialMission,
    graph: RoadGraph,
  ) {
    const points = mission.params.checkpoints;
    this.counters = new Counters(mission.params.time_limit_s);
    this.stops = new StopSequence(
      points.map((cp, i) => {
        const last = i === points.length - 1;
        return stopAt(
          graph,
          cp.lane_point,
          last ? "finish" : "checkpoint",
          last ? "Finish" : `Checkpoint ${i + 1} of ${points.length - 1}`,
          cp.radius_m ?? CHECKPOINT_RADIUS_M,
        );
      }),
    );
  }

  step(sample: MissionSample): EvalStep {
    this.counters.advance(sample);
    this.stops.update(sample);
    if (this.stops.finished) return { status: "success" };
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
    return pickStars((level) => this.counters.tookAtMost(stars[level].max_time_s));
  }
}
