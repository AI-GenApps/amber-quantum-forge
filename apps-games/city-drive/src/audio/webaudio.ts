/** The slice of the Web Audio API the game uses, so tests can pass a recording fake. */
export interface ParamLike {
  value: number;
  setTargetAtTime(target: number, startTime: number, timeConstant: number): unknown;
}

export interface NodeLike {
  connect(destination: NodeLike): unknown;
  disconnect(): unknown;
}

export interface GainLike extends NodeLike {
  gain: ParamLike;
}

export interface BufferLike {
  duration: number;
}

export interface SourceLike extends NodeLike {
  buffer: BufferLike | null;
  loop: boolean;
  playbackRate: ParamLike;
  onended: (() => void) | null;
  start(when?: number): unknown;
  stop(when?: number): unknown;
}

export interface ContextLike {
  readonly state: string;
  readonly currentTime: number;
  readonly destination: NodeLike;
  createGain(): GainLike;
  createBufferSource(): SourceLike;
  decodeAudioData(data: ArrayBuffer): Promise<BufferLike>;
  resume(): Promise<void>;
  suspend(): Promise<void>;
  close(): Promise<void>;
}

/** The browser's context (with the old Safari name as a fallback), or undefined without Web Audio. */
export function createBrowserContext(): ContextLike | undefined {
  const g = globalThis as unknown as {
    AudioContext?: new () => ContextLike;
    webkitAudioContext?: new () => ContextLike;
  };
  const Ctor = g.AudioContext ?? g.webkitAudioContext;
  return Ctor ? new Ctor() : undefined;
}

/** Smoothing time for gain changes, in seconds. Short enough to feel instant, long enough to click-free. */
const GAIN_SMOOTHING_S = 0.06;

export function glide(
  param: ParamLike,
  ctx: ContextLike,
  target: number,
  seconds = GAIN_SMOOTHING_S,
): void {
  param.setTargetAtTime(target, ctx.currentTime, seconds);
}
