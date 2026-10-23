export interface Prng {
  readonly seed: number;
  next(): number;
  int(n: number): number;
  pick<T>(items: readonly T[]): T;
  shuffle<T>(items: readonly T[]): T[];
  fork(label: string): Prng;
}

export function hashString(text: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

export function createPrng(seed: number): Prng {
  const origin = seed >>> 0;
  let a = 0x9e3779b9;
  let b = 0x243f6a88;
  let c = 0xb7e15162;
  let d = origin;

  const step = (): number => {
    const t = (((a + b) | 0) + d) | 0;
    d = (d + 1) | 0;
    a = b ^ (b >>> 9);
    b = (c + (c << 3)) | 0;
    c = (c << 21) | (c >>> 11);
    c = (c + t) | 0;
    return t >>> 0;
  };

  for (let i = 0; i < 12; i++) step();

  const next = (): number => step() / 4294967296;

  const int = (n: number): number => {
    if (!Number.isInteger(n) || n < 1) throw new RangeError("int(n) needs an integer n >= 1");
    return Math.floor(next() * n);
  };

  const pick = <T>(items: readonly T[]): T => {
    if (items.length === 0) throw new RangeError("pick needs items");
    return items[int(items.length)] as T;
  };

  const shuffle = <T>(items: readonly T[]): T[] => {
    const out = items.slice();
    for (let i = out.length - 1; i > 0; i--) {
      const j = int(i + 1);
      const held = out[i] as T;
      out[i] = out[j] as T;
      out[j] = held;
    }
    return out;
  };

  const fork = (label: string): Prng =>
    createPrng((origin ^ Math.imul(hashString(label), 0x9e3779b1)) >>> 0);

  return { seed: origin, next, int, pick, shuffle, fork };
}
