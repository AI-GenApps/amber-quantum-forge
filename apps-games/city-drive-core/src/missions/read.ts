import type { MissionIssue } from "./errors";
import type { LanePointRef } from "./types";

export type Raw = Record<string, unknown>;

export function isRecord(value: unknown): value is Raw {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Reads fields from untrusted JSON and records a schema issue for each bad one. */
export class Reader {
  constructor(
    readonly issues: MissionIssue[],
    readonly path: string,
  ) {}

  fail(message: string): void {
    this.issues.push({ code: "schema", message: `${this.path}: ${message}` });
  }

  child(raw: Raw, key: string): Reader {
    const reader = new Reader(this.issues, `${this.path}.${key}`);
    if (!isRecord(raw[key])) reader.fail("must be an object");
    return reader;
  }

  record(raw: Raw, key: string): Raw {
    const value = raw[key];
    if (isRecord(value)) return value;
    this.fail(`${key} must be an object`);
    return {};
  }

  string(raw: Raw, key: string): string {
    const value = raw[key];
    if (typeof value === "string" && value.length > 0) return value;
    this.fail(`${key} must be a non-empty string`);
    return "";
  }

  number(raw: Raw, key: string, min = Number.NEGATIVE_INFINITY): number {
    const value = raw[key];
    if (typeof value === "number" && Number.isFinite(value) && value >= min) return value;
    this.fail(`${key} must be a number >= ${min}`);
    return min === Number.NEGATIVE_INFINITY ? 0 : min;
  }

  optionalNumber(raw: Raw, key: string, min: number): number | undefined {
    return raw[key] === undefined ? undefined : this.number(raw, key, min);
  }

  array(raw: Raw, key: string, min: number, max: number): unknown[] {
    const value = raw[key];
    if (Array.isArray(value) && value.length >= min && value.length <= max) return value;
    this.fail(`${key} must be an array of ${min}..${max} items`);
    return [];
  }

  lanePoint(raw: unknown, label: string): LanePointRef {
    if (isRecord(raw) && typeof raw.edgeId === "string" && typeof raw.s === "number") {
      if (Number.isFinite(raw.s)) return { edgeId: raw.edgeId, s: raw.s };
    }
    this.fail(`${label} must be { edgeId: string, s: number }`);
    return { edgeId: "", s: 0 };
  }

  at(label: string): Reader {
    return new Reader(this.issues, `${this.path}.${label}`);
  }
}
