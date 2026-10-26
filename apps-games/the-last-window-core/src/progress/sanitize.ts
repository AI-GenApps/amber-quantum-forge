export type Reader<T> = (value: unknown, fallback: T) => T | null;

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function count(value: unknown, max: number): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return Math.max(0, Math.min(max, Math.floor(value)));
}

export function flag(value: unknown): boolean | null {
  return typeof value === "boolean" ? value : null;
}

export function read<T>(
  source: Record<string, unknown>,
  key: string,
  fallback: T,
  reader: Reader<T>,
): T | null {
  if (!(key in source) || source[key] === undefined) return fallback;
  return reader(source[key], fallback);
}

export function readCount(
  source: Record<string, unknown>,
  key: string,
  fallback: number,
  max: number,
): number | null {
  return read(source, key, fallback, (value) => count(value, max));
}

export function readFlag(
  source: Record<string, unknown>,
  key: string,
  fallback: boolean,
): boolean | null {
  return read(source, key, fallback, flag);
}
