export interface Prng {
  readonly seed: number;
  next(): number;
  int(n: number): number;
  pick<T>(items: readonly T[]): T;
  shuffle<T>(items: readonly T[]): T[];
  fork(label: string): Prng;
}

const FNV_OFFSET = 0x811c9dc5;
const FNV_PRIME = 0x01000193;
const TWO_POW_32 = 4294967296;
const WARM_UP_ROUNDS = 15;

export function hashString(text: string): number {
  let hash = FNV_OFFSET;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, FNV_PRIME);
  }
  return hash >>> 0;
}

export function createPrng(seed: number): Prng {
  const origin = seed >>> 0;
  let a = 0x9e3779b9 | 0;
  let b = 0x243f6a88 | 0;
  let c = 0xb7e15162 | 0;
  let d = origin | 0;

  function step(): number {
    const t = (((a + b) | 0) + d) | 0;
    d = (d + 1) | 0;
    a = b ^ (b >>> 9);
    b = (c + (c << 3)) | 0;
    c = (c << 21) | (c >>> 11);
    c = (c + t) | 0;
    return t >>> 0;
  }

  for (let i = 0; i < WARM_UP_ROUNDS; i += 1) step();

  function next(): number {
    return step() / TWO_POW_32;
  }

  function int(n: number): number {
    if (!Number.isInteger(n) || n < 1)
      throw new RangeError(`int(n) needs a positive integer, got ${n}`);
    return Math.floor(next() * n);
  }

  function pick<T>(items: readonly T[]): T {
    if (items.length === 0) throw new RangeError("pick() needs a non-empty list");
    return items[int(items.length)] as T;
  }

  function shuffle<T>(items: readonly T[]): T[] {
    const out = items.slice();
    for (let i = out.length - 1; i > 0; i -= 1) {
      const j = int(i + 1);
      const held = out[i] as T;
      out[i] = out[j] as T;
      out[j] = held;
    }
    return out;
  }

  function fork(label: string): Prng {
    return createPrng(hashString(`${origin}:${label}`));
  }

  return { seed: origin, next, int, pick, shuffle, fork };
}
