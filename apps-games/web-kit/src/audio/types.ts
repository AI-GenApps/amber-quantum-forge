/** Structural slices of the WebAudio API, so tests can pass fakes and a missing API is explicit. */
export interface AudioParamLike {
  value: number;
  setValueAtTime(value: number, time: number): unknown;
  linearRampToValueAtTime(value: number, time: number): unknown;
  cancelScheduledValues(time: number): unknown;
}

export interface AudioNodeLike {
  connect(destination: unknown): unknown;
  disconnect(): void;
}

export interface GainNodeLike extends AudioNodeLike {
  readonly gain: AudioParamLike;
}

export interface BufferSourceLike extends AudioNodeLike {
  buffer: unknown;
  loop: boolean;
  readonly playbackRate: { value: number };
  onended: (() => void) | null;
  start(when?: number): void;
  stop(when?: number): void;
}

export interface AudioContextLike {
  readonly state: string;
  readonly currentTime: number;
  readonly destination: unknown;
  resume(): Promise<void>;
  suspend?(): Promise<void>;
  createGain(): GainNodeLike;
  createBufferSource(): BufferSourceLike;
  decodeAudioData(data: ArrayBuffer): Promise<unknown>;
}

export type VolumeKind = "master" | "sfx" | "music";

export interface Volumes {
  master: number;
  sfx: number;
  music: number;
}

export interface PlayOptions {
  /** Per-play gain, 0..1 (default 1). */
  volume?: number;
  /** Playback rate (default 1). */
  rate?: number;
}

export interface MusicOptions {
  /** Cross-fade length in milliseconds (default 800). */
  fadeMs?: number;
}

export interface AudioManager {
  /** False when the platform has no WebAudio; every other call is then a safe no-op. */
  readonly available: boolean;
  /** True once the context is running (after a user gesture). */
  readonly unlocked: boolean;
  unlock(): Promise<boolean>;
  /** Unlocks on the first user gesture on `target`. Returns a function that removes the listeners. */
  installUnlock(target?: EventTarget, events?: readonly string[]): () => void;
  addBuffer(id: string, buffer: unknown): void;
  load(id: string, url: string): Promise<boolean>;
  has(id: string): boolean;
  play(id: string, options?: PlayOptions): boolean;
  playMusic(id: string, options?: MusicOptions): void;
  stopMusic(options?: MusicOptions): void;
  readonly currentMusic: string | null;
  setVolume(kind: VolumeKind, value: number): void;
  getVolume(kind: VolumeKind): number;
  /** Applies the player's sound and music switches (from settings). */
  syncSettings(enabled: { sound: boolean; music: boolean }): void;
  /** Pauses audio while the app is in the background. */
  suspend(): Promise<void>;
  resume(): Promise<void>;
}
