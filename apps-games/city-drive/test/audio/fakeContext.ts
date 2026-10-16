import type {
  BufferLike,
  ContextLike,
  GainLike,
  ParamLike,
  SourceLike,
} from "../../src/audio/webaudio";

export class FakeParam implements ParamLike {
  value = 1;
  targets: number[] = [];
  setTargetAtTime(target: number): void {
    this.targets.push(target);
  }
  get last(): number | undefined {
    return this.targets[this.targets.length - 1];
  }
}

export class FakeNode {
  connected: FakeNode[] = [];
  disconnected = false;
  connect(to: FakeNode): void {
    this.connected.push(to);
  }
  disconnect(): void {
    this.disconnected = true;
  }
}

export class FakeGain extends FakeNode implements GainLike {
  gain = new FakeParam();
}

export class FakeSource extends FakeNode implements SourceLike {
  buffer: BufferLike | null = null;
  loop = false;
  playbackRate = new FakeParam();
  onended: (() => void) | null = null;
  started = 0;
  stopped = 0;
  start(): void {
    this.started++;
  }
  stop(): void {
    this.stopped++;
  }
}

/** A recording stand-in for AudioContext. Decoding returns a buffer named after its first byte. */
export class FakeContext implements ContextLike {
  state = "suspended";
  currentTime = 0;
  destination = new FakeNode();
  gains: FakeGain[] = [];
  sources: FakeSource[] = [];
  resumed = 0;
  closed = 0;
  failDecode = new Set<number>();

  createGain(): GainLike {
    const gain = new FakeGain();
    this.gains.push(gain);
    return gain;
  }

  createBufferSource(): SourceLike {
    const source = new FakeSource();
    this.sources.push(source);
    return source;
  }

  async decodeAudioData(data: ArrayBuffer): Promise<BufferLike> {
    const first = new Uint8Array(data)[0] ?? 0;
    if (this.failDecode.has(first)) throw new Error(`cannot decode ${first}`);
    return { duration: 1 + first };
  }

  async resume(): Promise<void> {
    this.resumed++;
    this.state = "running";
  }

  async close(): Promise<void> {
    this.closed++;
  }
}
