import type { MissionHud, ObjectiveKind } from "@city-drive/core";

/** Game moments that make a sound or a buzz. */
export type FeelEvent = "checkpoint" | "pickup" | "success" | "fail";

/**
 * Watches the mission HUD frame by frame and names what just happened: a leg of the mission
 * finished (pickup for a pickup, checkpoint otherwise), or the mission ended in success or
 * failure. Pure: it only compares this frame with the last.
 */
export class EventDeriver {
  private phase: MissionHud["phase"] = "idle";
  private missionId: string | undefined;
  private done = 0;
  private kind: ObjectiveKind | undefined;

  next(hud: MissionHud | undefined): FeelEvent[] {
    if (!hud) {
      this.reset();
      return [];
    }
    const events: FeelEvent[] = [];
    const sameMission = hud.missionId === this.missionId;
    if (sameMission && hud.phase !== this.phase) {
      if (hud.phase === "success") events.push("success");
      else if (hud.phase === "fail") events.push("fail");
    }
    if (
      events.length === 0 &&
      sameMission &&
      hud.phase === "active" &&
      this.phase === "active" &&
      hud.progress.done > this.done
    ) {
      events.push(this.kind === "pickup" ? "pickup" : "checkpoint");
    }
    this.phase = hud.phase;
    this.missionId = hud.missionId;
    this.done = hud.progress.done;
    this.kind = hud.objective?.kind ?? (hud.phase === "active" ? this.kind : undefined);
    return events;
  }

  reset(): void {
    this.phase = "idle";
    this.missionId = undefined;
    this.done = 0;
    this.kind = undefined;
  }
}
