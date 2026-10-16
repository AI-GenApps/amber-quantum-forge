import type { MissionHud } from "@city-drive/core";
import { ControlsTutorial, type InputSample, STEPS, type StepId } from "./detectors";

/** Save flags (in `save.onboarding`) the flow reads and writes. */
export const FLAG_DONE = "first_drive_done";
export const FLAG_CONTROLS = "controls_taught";
export const FLAG_BRIEFING = "first_briefing_seen";
export const FLAG_RESULTS = "results_explained";
export const ALL_FLAGS = [FLAG_DONE, FLAG_CONTROLS, FLAG_BRIEFING, FLAG_RESULTS] as const;

export type OnboardingStage = "off" | "controls" | "briefing" | "mission" | "results";

/** What the overlay draws. Undefined when the tutorial is not showing anything. */
export type OnboardingView =
  | { stage: "controls"; step: number; stepId: StepId; steps: number; progress: number }
  | { stage: "briefing" }
  | { stage: "results" };

export interface OnboardingDeps {
  flag(name: string): boolean;
  setFlag(name: string, value: boolean): void;
  /** Whether the save already holds mission records (a returning player, not a new one). */
  hasProgress(): boolean;
  /** The mission the tutorial drives: opens its briefing. May throw when missions are off. */
  openMission(missionId: string): void;
  firstMissionId: string;
}

/**
 * First-drive tutorial: three control steps on free roam, then the first mission's briefing,
 * then an explanation of coins and the garage on its results. Skippable, and `replay()` runs it
 * again. Pure state: the game and the save reach it only through `OnboardingDeps`.
 */
export class OnboardingFlow {
  private stage: OnboardingStage = "off";
  private controls = new ControlsTutorial();
  private sawBriefing = false;

  constructor(private readonly deps: OnboardingDeps) {}

  get active(): boolean {
    return this.stage !== "off";
  }

  /** A short string that changes whenever `view` would, so a still frame does not re-render. */
  get signature(): string {
    const v = this.view;
    if (!v) return "";
    return v.stage === "controls" ? `c${v.step}:${Math.round(v.progress * 10)}` : v.stage;
  }

  get view(): OnboardingView | undefined {
    switch (this.stage) {
      case "controls":
        return {
          stage: "controls",
          step: this.controls.step,
          stepId: (STEPS[this.controls.step] ?? STEPS[STEPS.length - 1])?.id ?? "gas",
          steps: STEPS.length,
          progress: this.controls.progress,
        };
      case "briefing":
        return this.sawBriefing ? { stage: "briefing" } : undefined;
      case "results":
        return { stage: "results" };
      default:
        return undefined;
    }
  }

  /** The drive screen opened. Starts the tutorial for a new player; true if it started. */
  enter(): boolean {
    if (this.stage !== "off" || this.deps.flag(FLAG_DONE)) return false;
    if (this.deps.hasProgress()) {
      this.deps.setFlag(FLAG_DONE, true);
      return false;
    }
    this.begin();
    return true;
  }

  /** "How to play": clears the flags and starts again from the controls. */
  replay(): void {
    for (const name of ALL_FLAGS) {
      if (this.deps.flag(name)) this.deps.setFlag(name, false);
    }
    this.begin();
  }

  skip(): void {
    this.finish();
  }

  /** Stop without remembering anything (progress was erased, so the tutorial starts over). */
  stop(): void {
    this.stage = "off";
  }

  /** The "Got it" button on the briefing and results tips. */
  dismiss(): void {
    if (this.stage === "results") this.finish();
    else if (this.stage === "briefing") this.stage = "mission";
  }

  /** One fixed step of input. Returns true when what the overlay shows changed. */
  feed(input: InputSample, dt: number): boolean {
    if (this.stage !== "controls") return false;
    const before = this.signature;
    if (this.controls.update(input, dt) && this.controls.finished) this.controlsDone();
    return this.signature !== before;
  }

  /** The mission HUD each frame; moves the tutorial along with the first mission. */
  observe(hud: MissionHud | undefined): void {
    if (!hud || this.stage === "off" || this.stage === "controls") return;
    const first = hud.missionId === this.deps.firstMissionId;
    if (this.stage === "briefing") {
      if (hud.phase === "briefing" && first) {
        this.sawBriefing = true;
        this.deps.setFlag(FLAG_BRIEFING, true);
      } else if (hud.phase === "active" && first) this.stage = "mission";
      else if (this.sawBriefing && hud.phase === "idle") this.finish();
    } else if (this.stage === "mission") {
      if (hud.phase === "success" || hud.phase === "fail" || hud.phase === "results") {
        this.stage = "results";
      } else if (hud.phase === "idle") this.finish();
    } else if (this.stage === "results" && hud.phase === "idle") {
      this.finish();
    }
  }

  private begin(): void {
    this.controls = new ControlsTutorial();
    this.sawBriefing = false;
    this.stage = "controls";
  }

  private controlsDone(): void {
    this.deps.setFlag(FLAG_CONTROLS, true);
    try {
      this.deps.openMission(this.deps.firstMissionId);
      this.stage = "briefing";
    } catch (error) {
      console.warn("first-drive tutorial: the first mission could not be opened", error);
      this.stage = "off";
    }
  }

  private finish(): void {
    if (this.stage === "results") this.deps.setFlag(FLAG_RESULTS, true);
    this.stage = "off";
    this.deps.setFlag(FLAG_DONE, true);
  }
}
