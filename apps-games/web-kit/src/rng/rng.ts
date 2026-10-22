export type RngState = readonly [number, number, number, number];

export interface Rng {
  /** Next float in [0, 1). */
  next(): number;
  /** Integer in [0, maxExclusive). */
  int(maxExclusive: number): number;
  /** Integer in [minInclusive, maxInclusive]. */
  range(minInclusive: number, maxInclusive: number): number;
  /** Float in [min, max). */
  float(min: number, max: number): number;
  /** True with probability p (0..1). */
  chance(p: number): boolean;
  /** Uniform element of a non-empty list. */
  pick<T>(items: readonly T[]): T;
  /** Element chosen proportionally to its weight; weights must be non-negative and sum above 0. */
  weighted<T>(items: readonly T[], weights: readonly number[]): T;
  /** New array in random order; the input is not changed. */
  shuffle<T>(items: readonly T[]): T[];
  /** Fisher-Yates in place; returns the same array. */
  shuffleInPlace<T>(items: T[]): T[];
  /** Independent child generator derived from the current state and a label (does not advance this one). */
  fork(label: string): Rng;
  /** Snapshot of the generator, restorable with `createRngFromState`. */
  state(): RngState;
}

const FNV_OFFSET = 0x811c9dc5;
const FNV_PRIME = 0x01000193;

/** 32-bit FNV-1a hash of a string, as an unsigned integer. Stable across platforms. */
export function hashString(input: string): number {
  let hash = FNV_OFFSET;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, FNV_PRIME);
  }
  return hash >>> 0;
}

/** Accepts a number or a string and returns an unsigned 32-bit seed. */
export function toSeed(seed: number | string): number {
  if (typeof seed === "string") return hashString(seed);
  if (!Number.isFinite(seed)) return 0;
  return Math.trunc(seed) >>> 0;
}

function splitmix32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x9e3779b9) | 0;
    let t = a ^ (a >>> 16);
    t = Math.imul(t, 0x21f0aaad);
    t ^= t >>> 15;
    t = Math.imul(t, 0x735a2d97);
    t ^= t >>> 15;
    return t >>> 0;
  };
}

function build(state: [number, number, number, number]): Rng {
  const nextUint32 = (): number => {
    const [a, b, c, d] = state;
    const t = (((a + b) | 0) + d) | 0;
    state[3] = (d + 1) | 0;
    state[0] = b ^ (b >>> 9);
    state[1] = (c + (c << 3)) | 0;
    state[2] = ((c << 21) | (c >>> 11)) + t;
    state[2] = state[2] | 0;
    return t >>> 0;
  };
  const next = (): number => nextUint32() / 4294967296;
  const int = (maxExclusive: number): number => {
    if (!Number.isInteger(maxExclusive) || maxExclusive <= 0) {
      throw new RangeError(`int(max) needs a positive integer, got ${maxExclusive}`);
    }
    return Math.floor(next() * maxExclusive);
  };
  const shuffleInPlace = <T>(items: T[]): T[] => {
    for (let i = items.length - 1; i > 0; i -= 1) {
      const j = int(i + 1);
      const a = items[i] as T;
      items[i] = items[j] as T;
      items[j] = a;
    }
    return items;
  };
  return {
    next,
    int,
    range(minInclusive, maxInclusive) {
      if (maxInclusive < minInclusive) throw new RangeError("range(min, max) needs max >= min");
      return minInclusive + int(maxInclusive - minInclusive + 1);
    },
    float: (min, max) => min + next() * (max - min),
    chance: (p) => next() < p,
    pick<T>(items: readonly T[]): T {
      if (items.length === 0) throw new RangeError("pick() needs a non-empty list");
      return items[int(items.length)] as T;
    },
    weighted<T>(items: readonly T[], weights: readonly number[]): T {
      if (items.length === 0 || items.length !== weights.length) {
        throw new RangeError("weighted() needs equal-length, non-empty lists");
      }
      let total = 0;
      for (const w of weights) {
        if (!(w >= 0)) throw new RangeError("weights must be non-negative");
        total += w;
      }
      if (total <= 0) throw new RangeError("weights must sum above 0");
      let roll = next() * total;
      for (let i = 0; i < items.length; i += 1) {
        roll -= weights[i] as number;
        if (roll < 0) return items[i] as T;
      }
      return items[items.length - 1] as T;
    },
    shuffle: <T>(items: readonly T[]): T[] => shuffleInPlace(items.slice()),
    shuffleInPlace,
    fork(label) {
      return createRng(`${state[0]}.${state[1]}.${state[2]}.${state[3]}/${label}`);
    },
    state: () => [state[0], state[1], state[2], state[3]],
  };
}

/** Seedable sfc32 generator. The same seed always yields the same sequence. */
export function createRng(seed: number | string): Rng {
  const mix = splitmix32(toSeed(seed));
  const state: [number, number, number, number] = [mix() | 0, mix() | 0, mix() | 0, 1];
  const rng = build(state);
  for (let i = 0; i < 12; i += 1) rng.next();
  return rng;
}

export function createRngFromState(snapshot: RngState): Rng {
  return build([snapshot[0] | 0, snapshot[1] | 0, snapshot[2] | 0, snapshot[3] | 0]);
}
