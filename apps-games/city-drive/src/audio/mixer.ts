import { type ContextLike, type GainLike, glide } from "./webaudio";

/** Which buses are audible. `master` is the player's Sound setting. */
export interface MixerToggles {
  master: boolean;
  sfx: boolean;
  music: boolean;
}

export const ALL_ON: MixerToggles = { master: true, sfx: true, music: true };

/** Time constant for music ducking, in seconds: slower than effects so it breathes. */
const DUCK_SMOOTHING_S = 0.25;

/**
 * Master, effects and music buses. The toggles open and close buses; ducking only moves the
 * music level, so turning music off and on again never loses the duck.
 */
export class Mixer {
  readonly master: GainLike;
  readonly sfx: GainLike;
  readonly music: GainLike;
  private toggles: MixerToggles = ALL_ON;
  private musicLevel = 1;

  constructor(private readonly ctx: ContextLike) {
    this.master = ctx.createGain();
    this.sfx = ctx.createGain();
    this.music = ctx.createGain();
    this.sfx.connect(this.master);
    this.music.connect(this.master);
    this.master.connect(ctx.destination);
    this.apply();
  }

  get state(): MixerToggles {
    return this.toggles;
  }

  setToggles(toggles: MixerToggles): void {
    this.toggles = toggles;
    this.apply();
  }

  /** The level the music bus sits at while it is on (0..1). */
  setMusicLevel(level: number): void {
    this.musicLevel = level;
    glide(this.music.gain, this.ctx, this.toggles.music ? level : 0, DUCK_SMOOTHING_S);
  }

  private apply(): void {
    const { master, sfx, music } = this.toggles;
    glide(this.master.gain, this.ctx, master ? 1 : 0);
    glide(this.sfx.gain, this.ctx, sfx ? 1 : 0);
    glide(this.music.gain, this.ctx, music ? this.musicLevel : 0);
  }
}
