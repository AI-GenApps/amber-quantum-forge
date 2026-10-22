export type { FakeContext, FakeGain, FakeParam, FakeSource } from "./fake-context";
export { createFakeContext as createFakeAudioContext } from "./fake-context";
export type { AudioManagerOptions } from "./manager";
export { createAudioManager, defaultCreateContext } from "./manager";
export type {
  AudioContextLike,
  AudioManager,
  AudioNodeLike,
  AudioParamLike,
  BufferSourceLike,
  GainNodeLike,
  MusicOptions,
  PlayOptions,
  VolumeKind,
  Volumes,
} from "./types";
