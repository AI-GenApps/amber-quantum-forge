import { STEPS_PER_WEEK } from "@web-games/floodplain-dispatch-core";

export const SPEEDS = [1, 2, 4] as const;
export type Speed = (typeof SPEEDS)[number];

export const STEP_TICK_MS = 160 as const;
export const WEEK_TICK_MS = 700 as const;

export interface PlaybackState {
  pos: number;
  playing: boolean;
  speed: Speed;
}

export function startPlayback(): PlaybackState {
  return { pos: 0, playing: true, speed: 1 };
}

/** Smooth playback moves one step per tick; reduced motion jumps a whole week per tick. */
export function tickDelay(speed: Speed, reducedMotion: boolean): number {
  return Math.round((reducedMotion ? WEEK_TICK_MS : STEP_TICK_MS) / speed);
}

export function advance(
  state: PlaybackState,
  total: number,
  reducedMotion: boolean,
): PlaybackState {
  if (!state.playing) return state;
  const jump = reducedMotion ? STEPS_PER_WEEK : 1;
  const pos = Math.min(total, state.pos + jump);
  return { ...state, pos, playing: pos < total };
}

export function scrubTo(state: PlaybackState, pos: number, total: number): PlaybackState {
  const clamped = Math.max(0, Math.min(total, Math.round(pos)));
  return { ...state, pos: clamped, playing: false };
}

export function setSpeed(state: PlaybackState, speed: Speed): PlaybackState {
  return { ...state, speed };
}

export function togglePlaying(state: PlaybackState, total: number): PlaybackState {
  if (state.playing) return { ...state, playing: false };
  const pos = state.pos >= total ? 0 : state.pos;
  return { ...state, pos, playing: true };
}

export function finished(state: PlaybackState, total: number): boolean {
  return state.pos >= total;
}

export function weekAt(pos: number): number {
  return Math.floor(pos / STEPS_PER_WEEK);
}
