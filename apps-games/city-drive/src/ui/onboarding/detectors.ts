/** The part of a player's input the tutorial cares about. */
export interface InputSample {
  throttle: number;
  steer: number;
  handbrake: boolean;
}

export type StepId = "gas" | "steer" | "brake";

export interface StepDef {
  id: StepId;
  /** Seconds the input must be held without a break. */
  holdS: number;
  active(input: InputSample): boolean;
}

/** Hold gas, steer, then brake or use the handbrake. */
export const STEPS: readonly StepDef[] = [
  { id: "gas", holdS: 1, active: (i) => i.throttle > 0.5 },
  { id: "steer", holdS: 0.6, active: (i) => Math.abs(i.steer) > 0.5 },
  { id: "brake", holdS: 0.5, active: (i) => i.throttle < -0.5 || i.handbrake },
];

/** Fixed steps of 1/60 s add up with rounding error; this keeps "0.5 s of steps" at 0.5 s. */
const TIME_EPSILON_S = 1e-6;

/**
 * Completes once its condition has been true for `holdS` seconds in a row. Fed one fixed step at
 * a time, so it needs no clock and gives the same answer for the same input in tests.
 */
export class SustainedDetector {
  private heldS = 0;

  constructor(private readonly step: StepDef) {}

  update(input: InputSample, dt: number): void {
    this.heldS = this.step.active(input) ? Math.min(this.step.holdS, this.heldS + dt) : 0;
  }

  /** 0 to 1 */
  get progress(): number {
    return Math.min(1, this.heldS / this.step.holdS);
  }

  get done(): boolean {
    return this.heldS >= this.step.holdS - TIME_EPSILON_S;
  }
}

/** The three control steps in order. Each step must be completed with fresh input. */
export class ControlsTutorial {
  private index = 0;
  private detector = new SustainedDetector(STEPS[0] as StepDef);

  get step(): number {
    return this.index;
  }

  get finished(): boolean {
    return this.index >= STEPS.length;
  }

  get progress(): number {
    return this.finished ? 1 : this.detector.progress;
  }

  /** Feed one fixed step. Returns true when the step just completed. */
  update(input: InputSample, dt: number): boolean {
    if (this.finished) return false;
    this.detector.update(input, dt);
    if (!this.detector.done) return false;
    this.index++;
    const next = STEPS[this.index];
    if (next) this.detector = new SustainedDetector(next);
    return true;
  }
}
