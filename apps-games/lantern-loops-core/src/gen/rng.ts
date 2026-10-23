export interface Rng {
  /** A uniform 32-bit unsigned integer. */
  next32(): number;
  /** A uniform integer in [0, maxExclusive). */
  int(maxExclusive: number): number;
  /** A uniform integer in [min, max]. */
  between(min: number, max: number): number;
  /** True with probability percent / 100. */
  chance(percent: number): boolean;
  pick<T>(items: readonly T[]): T;
  /** A new array in random order (Fisher-Yates); the input is not changed. */
  shuffle<T>(items: readonly T[]): T[];
}

/** Mulberry32 over a 32-bit integer seed. Pure integer arithmetic, identical on every machine. */
export function createRng(seed: number): Rng {
  let state = seed >>> 0;
  const next32 = (): number => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return (t ^ (t >>> 14)) >>> 0;
  };
  const int = (maxExclusive: number): number => {
    if (!Number.isInteger(maxExclusive) || maxExclusive < 1) {
      throw new RangeError(`int needs a positive integer, got ${maxExclusive}`);
    }
    const limit = 4294967296 - (4294967296 % maxExclusive);
    let value = next32();
    while (value >= limit) value = next32();
    return value % maxExclusive;
  };
  return {
    next32,
    int,
    between: (min, max) => min + int(max - min + 1),
    chance: (percent) => int(100) < percent,
    pick: (items) => {
      if (items.length === 0) throw new RangeError("pick needs a non-empty list");
      return items[int(items.length)] as (typeof items)[number];
    },
    shuffle: (items) => {
      const out = items.slice();
      for (let i = out.length - 1; i > 0; i--) {
        const j = int(i + 1);
        const swap = out[i] as (typeof items)[number];
        out[i] = out[j] as (typeof items)[number];
        out[j] = swap;
      }
      return out;
    },
  };
}

/** FNV-1a over the UTF-16 code units, a 32-bit unsigned integer. */
export function hashText(text: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

/** Derives a new seed from a seed and a salt (attempt number, stage). */
export function mixSeed(seed: number, salt: number): number {
  return hashText(`${seed >>> 0}:${salt}`);
}
