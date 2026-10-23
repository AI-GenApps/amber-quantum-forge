import type { AudioContextLike, AudioParamLike, BufferSourceLike, GainNodeLike } from "./types";

export interface FakeParam extends AudioParamLike {
  ramps: Array<{ value: number; time: number }>;
}

export interface FakeGain extends GainNodeLike {
  gain: FakeParam;
  connectedTo: unknown[];
  disconnected: boolean;
}

export interface FakeSource extends BufferSourceLike {
  started: number[];
  stopped: Array<number | undefined>;
  connectedTo: unknown[];
  disconnected: boolean;
}

export interface FakeContext extends AudioContextLike {
  state: string;
  currentTime: number;
  gains: FakeGain[];
  sources: FakeSource[];
  resumeCalls: number;
  suspendCalls: number;
  failResume: boolean;
  decoded: ArrayBuffer[];
}

/** Deterministic WebAudio stand-in for tests (in-memory, no sound). Starts suspended. */
export function createFakeContext(initialState = "suspended"): FakeContext {
  const ctx: FakeContext = {
    state: initialState,
    currentTime: 10,
    destination: { name: "destination" },
    gains: [],
    sources: [],
    resumeCalls: 0,
    suspendCalls: 0,
    failResume: false,
    decoded: [],
    async resume() {
      ctx.resumeCalls += 1;
      if (ctx.failResume) throw new Error("blocked");
      ctx.state = "running";
    },
    async suspend() {
      ctx.suspendCalls += 1;
      ctx.state = "suspended";
    },
    createGain() {
      const param: FakeParam = {
        value: 1,
        ramps: [],
        setValueAtTime: () => undefined,
        linearRampToValueAtTime(value, time) {
          param.ramps.push({ value, time });
        },
        cancelScheduledValues: () => undefined,
      };
      const gain: FakeGain = {
        gain: param,
        connectedTo: [],
        disconnected: false,
        connect(destination) {
          gain.connectedTo.push(destination);
        },
        disconnect() {
          gain.disconnected = true;
        },
      };
      ctx.gains.push(gain);
      return gain;
    },
    createBufferSource() {
      const source: FakeSource = {
        buffer: null,
        loop: false,
        playbackRate: { value: 1 },
        onended: null,
        started: [],
        stopped: [],
        connectedTo: [],
        disconnected: false,
        connect(destination) {
          source.connectedTo.push(destination);
        },
        disconnect() {
          source.disconnected = true;
        },
        start(when = 0) {
          source.started.push(when);
        },
        stop(when) {
          source.stopped.push(when);
        },
      };
      ctx.sources.push(source);
      return source;
    },
    async decodeAudioData(data) {
      ctx.decoded.push(data);
      return { decoded: data.byteLength };
    },
  };
  return ctx;
}
