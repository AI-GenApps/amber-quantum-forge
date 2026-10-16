import { BASELINE_CAR, type CarSpec } from "../cars/specs";

export const ROSTER_SCHEMA_VERSION = 1;

/** CarSpec fields a roster entry may change. Wheel layout stays shared so every model fits. */
export const OVERRIDABLE_FIELDS = [
  "mass",
  "comDrop",
  "engineForce",
  "topSpeedKmh",
  "reverseFactor",
  "maxReverseKmh",
  "brakeForce",
  "maxSteerAngle",
  "highSpeedSteerAngle",
  "maxLateralG",
  "steerRate",
  "frictionSlip",
  "sideFrictionStiffness",
  "handbrakeGripFactor",
  "linearDamping",
  "angularDamping",
] as const;

export type SpecOverrides = Partial<Pick<CarSpec, (typeof OVERRIDABLE_FIELDS)[number]>>;

export interface CarEntry {
  id: string;
  /** Asset id of the Kenney model, for example `car-sedan`. */
  model_id: string;
  name: string;
  /** Coins to unlock. 0 only for the starter. */
  price: number;
  spec: SpecOverrides;
}

export interface CarRoster {
  schema_version: number;
  /** The free car every player owns. */
  starter: string;
  cars: CarEntry[];
}

export class RosterError extends Error {
  constructor(readonly problems: readonly string[]) {
    super(
      `car roster has ${problems.length} problem(s)\n${problems.map((p) => `  - ${p}`).join("\n")}`,
    );
    this.name = "RosterError";
  }
}

type Raw = Record<string, unknown>;
const isRecord = (v: unknown): v is Raw => typeof v === "object" && v !== null && !Array.isArray(v);

function parseOverrides(raw: unknown, where: string, problems: string[]): SpecOverrides {
  if (!isRecord(raw)) {
    problems.push(`${where}.spec must be an object`);
    return {};
  }
  const out: Record<string, number> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (!(OVERRIDABLE_FIELDS as readonly string[]).includes(key)) {
      problems.push(`${where}.spec.${key} is not an overridable field`);
    } else if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
      problems.push(`${where}.spec.${key} must be a positive number`);
    } else out[key] = value;
  }
  return out as SpecOverrides;
}

function parseEntry(raw: unknown, index: number, problems: string[]): CarEntry {
  const where = `cars[${index}]`;
  const t = isRecord(raw) ? raw : {};
  if (!isRecord(raw)) problems.push(`${where} must be an object`);
  const text = (key: string): string => {
    const v = t[key];
    if (typeof v === "string" && v.length > 0) return v;
    problems.push(`${where}.${key} must be a non-empty string`);
    return "";
  };
  const price = t.price;
  if (!Number.isSafeInteger(price) || (price as number) < 0) {
    problems.push(`${where}.price must be a non-negative integer`);
  }
  const model = text("model_id");
  if (model !== "" && !/^car-[a-z0-9-]+$/.test(model))
    problems.push(`${where}.model_id must look like car-xyz`);
  return {
    id: text("id"),
    model_id: model,
    name: text("name"),
    price: Number.isSafeInteger(price) ? (price as number) : 0,
    spec: parseOverrides(t.spec, where, problems),
  };
}

/** Parse untrusted `cars.json`. Throws a RosterError that lists every problem. */
export function parseRoster(input: unknown): CarRoster {
  if (!isRecord(input)) throw new RosterError(["roster must be a JSON object"]);
  const problems: string[] = [];
  if (input.schema_version !== ROSTER_SCHEMA_VERSION) {
    problems.push(`schema_version must be ${ROSTER_SCHEMA_VERSION}`);
  }
  const list = Array.isArray(input.cars) ? input.cars : [];
  if (list.length === 0) problems.push("cars must be a non-empty array");
  const cars = list.map((c, i) => parseEntry(c, i, problems));
  const starter = typeof input.starter === "string" ? input.starter : "";
  const ids = cars.map((c) => c.id);
  if (new Set(ids).size !== ids.length) problems.push("car ids must be unique");
  const first = cars.find((c) => c.id === starter);
  if (!first) problems.push(`starter "${starter}" is not in the roster`);
  else if (first.price !== 0) problems.push("the starter car must be free");
  for (const c of cars) {
    if (c.id !== starter && c.price === 0)
      problems.push(`car "${c.id}" is free but is not the starter`);
  }
  if (problems.length > 0) throw new RosterError(problems);
  return { schema_version: ROSTER_SCHEMA_VERSION, starter, cars };
}

/** The full CarSpec for a roster entry: the baseline car with the entry's overrides applied. */
export function carSpecOf(entry: CarEntry): CarSpec {
  return { ...BASELINE_CAR, ...entry.spec, id: entry.id };
}

export function findCar(roster: CarRoster, id: string): CarEntry {
  const found = roster.cars.find((c) => c.id === id);
  if (!found) throw new Error(`car roster: unknown car "${id}"`);
  return found;
}
