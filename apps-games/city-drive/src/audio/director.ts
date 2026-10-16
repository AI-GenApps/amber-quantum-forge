import type { StepReport } from "../game/stepReport";
import type { HapticsPort } from "../haptics";
import type { PlayState } from "../ui/types";
import { EventDeriver, type FeelEvent } from "./events";
import type { AudioPort, MusicId } from "./manager";
import { COLLISION_COOLDOWN_TICKS, collisionSound, engineParams, skidGain } from "./mapping";

/** Where the player is, as far as sound is concerned. */
export interface FeelContext {
  /** True on the drive and pause screens: the driving music plays. */
  driving: boolean;
  /** True only while the car is live (not in a menu, not paused): the engine is heard. */
  engineOn: boolean;
  /** A mission is running, so the music steps back. */
  missionActive: boolean;
}

/**
 * Turns what the game does into sound and vibration: per fixed step the engine, skid and
 * collisions; per frame the mission events and the music. It owns no audio of its own, only the
 * decisions, so tests drive it with fakes.
 */
export class FeelDirector {
  private readonly events = new EventDeriver();
  private tick = 0;
  private lastImpactTick = Number.NEGATIVE_INFINITY;
  private wasEngineOn = false;

  constructor(
    private readonly audio: AudioPort,
    private readonly haptics: HapticsPort,
  ) {}

  /** One fixed simulation step. */
  onStep(report: StepReport): void {
    this.tick++;
    if (this.wasEngineOn) {
      const engine = engineParams(report.speedKmh, report.input.throttle, report.topSpeedKmh);
      this.audio.setEngine(engine);
      this.audio.setSkid(skidGain(report.slipMps, report.speedKmh));
    }
    const thud = collisionSound(report.impactNs);
    if (thud && this.tick - this.lastImpactTick >= COLLISION_COOLDOWN_TICKS) {
      this.lastImpactTick = this.tick;
      this.audio.play(thud.id, thud.gain);
      this.haptics.trigger("collision");
    }
  }

  /** Once per rendered frame. */
  onFrame(play: PlayState | undefined, context: FeelContext): void {
    if (context.engineOn !== this.wasEngineOn) {
      this.wasEngineOn = context.engineOn;
      if (!context.engineOn) {
        this.audio.setEngine(undefined);
        this.audio.setSkid(0);
      }
    }
    this.music(context);
    for (const event of this.events.next(play?.hud)) this.emit(event);
  }

  /** The horn button. */
  horn(): void {
    this.audio.play("horn");
  }

  /** Any menu or HUD button press. */
  uiTap(): void {
    this.audio.play("ui_tap");
  }

  private music(context: FeelContext): void {
    const id: MusicId = context.driving ? "music_drive" : "music_menu";
    this.audio.playMusic(id);
    this.audio.setDucked(context.driving && context.missionActive);
  }

  private emit(event: FeelEvent): void {
    this.audio.play(event);
    this.haptics.trigger(event);
  }
}
