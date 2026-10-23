export interface Prng {
  readonly seed: number;
  next(): number;
  int(n: number): number;
  pick<T>(items: readonly T[]): T;
  shuffle<T>(items: readonly T[]): T[];
  fork(label: string): Prng;
}

const FNV_OFFSET = 2166136261;
const FNV_PRIME = 16777619;

export function hashString(text: string): number {
  let hash = FNV_OFFSET;
  for (let i = 0; i < text.length; i++) {
    hash = Math.imul(hash ^ text.charCodeAt(i), FNV_PRIME) >>> 0;
  }
  return hash >>> 0;
}

export function createPrng(seed: number): Prng {
  const base = seed >>> 0;
  let a = 0x9e3779b9;
  let b = 0x243f6a88;
  let c = 0xb7e15162;
  let d = base;

  const raw = (): number => {
    const t = (((a + b) | 0) + d) | 0;
    d = (d + 1) | 0;
    a = b ^ (b >>> 9);
    b = (c + (c << 3)) | 0;
    c = (c << 21) | (c >>> 11);
    c = (c + t) | 0;
    return t >>> 0;
  };

  for (let i = 0; i < 15; i++) raw();

  const next = (): number => raw() / 4294967296;

  const int = (n: number): number => {
    if (!Number.isInteger(n) || n < 1)
      throw new RangeError(`int needs a positive integer, got ${n}`);
    return Math.floor(next() * n);
  };

  const pick = <T>(items: readonly T[]): T => {
    if (items.length === 0) throw new RangeError("pick needs a non-empty list");
    return items[int(items.length)] as T;
  };

  const shuffle = <T>(items: readonly T[]): T[] => {
    const out = items.slice();
    for (let i = out.length - 1; i > 0; i--) {
      const j = int(i + 1);
      const tmp = out[i] as T;
      out[i] = out[j] as T;
      out[j] = tmp;
    }
    return out;
  };

  const fork = (label: string): Prng =>
    createPrng((hashString(label) ^ Math.imul(base, 0x9e3779b1)) >>> 0);

  return { seed: base, next, int, pick, shuffle, fork };
}
