import { createEvaluator, type EvaluatorContext } from "./evaluator";
import type {
  EvalStep,
  Evaluator,
  FailReason,
  MissionDef,
  MissionPhase,
  MissionProgress,
  MissionResult,
  MissionSample,
  Objective,
} from "./types";

/** What a HUD shows about the running mission. */
export interface MissionHud {
  phase: MissionPhase;
  missionId: string | undefined;
  title: string | undefined;
  objective: Objective | undefined;
  progress: MissionProgress;
  elapsedS: number;
  timeLeftS: number;
  damage: number;
  comfort: number | null;
  paused: boolean;
}

function illegal(action: string, phase: MissionPhase): Error {
  return new Error(`mission: cannot ${action} while the phase is "${phase}"`);
}

/**
 * The mission state machine: idle, briefing, active, then success or fail, then results.
 * Pure and driven by the fixed step: nothing here reads a clock. While paused, `step()` does
 * nothing, so the mission clock stops with the game.
 */
export class MissionRun {
  private current: MissionDef | undefined;
  private evaluator: Evaluator | undefined;
  private lastResult: MissionResult | undefined;
  private phaseValue: MissionPhase = "idle";
  private pausedValue = false;

  constructor(private readonly context: EvaluatorContext) {}

  get phase(): MissionPhase {
    return this.phaseValue;
  }

  get mission(): MissionDef | undefined {
    return this.current;
  }

  get paused(): boolean {
    return this.pausedValue;
  }

  /** Set once the mission has ended (success or fail), until `close()`. */
  get result(): MissionResult | undefined {
    return this.lastResult;
  }

  /** idle to briefing. */
  open(mission: MissionDef): void {
    if (this.phaseValue !== "idle") throw illegal("open a briefing", this.phaseValue);
    this.current = mission;
    this.lastResult = undefined;
    this.phaseValue = "briefing";
  }

  /** briefing to idle: the player drove away or declined. */
  cancel(): void {
    if (this.phaseValue !== "briefing") throw illegal("cancel a briefing", this.phaseValue);
    this.reset();
  }

  /** briefing to active. */
  start(): void {
    if (this.phaseValue !== "briefing" || !this.current) {
      throw illegal("start a mission", this.phaseValue);
    }
    this.evaluator = createEvaluator(this.current, this.context);
    this.pausedValue = false;
    this.phaseValue = "active";
  }

  setPaused(paused: boolean): void {
    this.pausedValue = paused;
  }

  /** active to fail, because the player gave up. */
  quit(): void {
    if (this.phaseValue !== "active") throw illegal("quit", this.phaseValue);
    this.finish({ status: "fail", reason: "quit" });
  }

  /** Advance one fixed step. Does nothing unless the mission is active and not paused. */
  step(sample: MissionSample): void {
    if (this.phaseValue !== "active" || this.pausedValue || !this.evaluator) return;
    const outcome = this.evaluator.step(sample);
    if (outcome.status !== "active") this.finish(outcome);
  }

  /** success or fail to results. */
  showResults(): void {
    if (this.phaseValue !== "success" && this.phaseValue !== "fail") {
      throw illegal("show results", this.phaseValue);
    }
    this.phaseValue = "results";
  }

  /** results to idle. Returns the result so the caller can hand it to the economy. */
  close(): MissionResult {
    if (this.phaseValue !== "results" || !this.lastResult) {
      throw illegal("close the results", this.phaseValue);
    }
    const result = this.lastResult;
    this.reset();
    this.lastResult = undefined;
    return result;
  }

  hud(): MissionHud {
    const ev = this.evaluator;
    return {
      phase: this.phaseValue,
      missionId: this.current?.id,
      title: this.current?.title,
      objective: this.phaseValue === "active" ? ev?.objective() : undefined,
      progress: ev?.progress() ?? { done: 0, total: 0 },
      elapsedS: ev?.elapsedS() ?? 0,
      timeLeftS: ev?.timeLeftS() ?? 0,
      damage: ev?.damage() ?? 0,
      comfort: ev?.comfort() ?? null,
      paused: this.pausedValue,
    };
  }

  /** The evaluator of the running mission (for type-specific readouts such as the parking hold). */
  get activeEvaluator(): Evaluator | undefined {
    return this.evaluator;
  }

  private reset(): void {
    this.current = undefined;
    this.evaluator = undefined;
    this.pausedValue = false;
    this.phaseValue = "idle";
  }

  private finish(outcome: Exclude<EvalStep, { status: "active" }>): void {
    const mission = this.current;
    const ev = this.evaluator;
    if (!mission || !ev) throw new Error("mission: finish called with no running mission");
    const success = outcome.status === "success";
    const stars = success ? ev.stars() : 0;
    const failReason: FailReason | undefined =
      outcome.status === "fail" ? outcome.reason : undefined;
    const result: MissionResult = {
      id: mission.id,
      success,
      stars,
      time: ev.elapsedS(),
      damage: ev.damage(),
      comfort: ev.comfort(),
      coins: stars === 0 ? 0 : mission.reward_coins[String(stars) as "1" | "2" | "3"],
    };
    if (failReason !== undefined) result.failReason = failReason;
    this.lastResult = result;
    this.phaseValue = success ? "success" : "fail";
  }
}
