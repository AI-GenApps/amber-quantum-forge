import type { BufferLike, ContextLike, GainLike, NodeLike, SourceLike } from "./webaudio";
import { glide } from "./webaudio";

const CHANGE_EPSILON = 0.004;

/** A looping buffer that plays from creation until `stop()`, with its own gain and pitch. */
export class LoopVoice {
  readonly gain: GainLike;
  private readonly source: SourceLike;
  private lastGain = Number.NaN;
  private lastRate = Number.NaN;

  constructor(ctx: ContextLike, buffer: BufferLike, output: NodeLike, startGain = 0) {
    this.gain = ctx.createGain();
    this.gain.gain.value = startGain;
    this.source = ctx.createBufferSource();
    this.source.buffer = buffer;
    this.source.loop = true;
    this.source.connect(this.gain);
    this.gain.connect(output);
    this.source.start();
  }

  /** Moves toward a gain (and pitch). Changes smaller than a hair are skipped: this runs per step. */
  set(ctx: ContextLike, gain: number, rate?: number): void {
    const gainChanged =
      gain === 0 ? this.lastGain !== 0 : !(Math.abs(gain - this.lastGain) < CHANGE_EPSILON);
    if (gainChanged) {
      this.lastGain = gain;
      glide(this.gain.gain, ctx, gain);
    }
    if (rate !== undefined && !(Math.abs(rate - this.lastRate) < CHANGE_EPSILON)) {
      this.lastRate = rate;
      glide(this.source.playbackRate, ctx, rate);
    }
  }

  stop(): void {
    this.source.stop();
    this.source.disconnect();
    this.gain.disconnect();
  }
}

/** Plays a buffer once at `gain`; resolves nothing, cleans itself up when it ends. */
export function playOnce(
  ctx: ContextLike,
  buffer: BufferLike,
  output: NodeLike,
  gain: number,
): void {
  const source = ctx.createBufferSource();
  const level = ctx.createGain();
  level.gain.value = gain;
  source.buffer = buffer;
  source.connect(level);
  level.connect(output);
  source.onended = () => {
    source.disconnect();
    level.disconnect();
  };
  source.start();
}
