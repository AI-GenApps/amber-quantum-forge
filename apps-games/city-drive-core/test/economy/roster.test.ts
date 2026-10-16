import { describe, expect, it } from "vitest";
import {
  BASELINE_CAR,
  carSpecOf,
  OVERRIDABLE_FIELDS,
  parseRoster,
  RosterError,
} from "../../src/index";
import { readRoster } from "./roster-support";

const roster = readRoster();

describe("cars.json", () => {
  it("has the starter plus five paid cars", () => {
    expect(roster.cars).toHaveLength(6);
    expect(roster.cars.filter((c) => c.price === 0).map((c) => c.id)).toEqual([roster.starter]);
  });

  it("prices rise from one paid car to the next", () => {
    const prices = roster.cars.map((c) => c.price);
    expect(prices).toEqual([...prices].sort((a, b) => a - b));
  });

  it("uses a different model for every car", () => {
    const models = roster.cars.map((c) => c.model_id);
    expect(new Set(models).size).toBe(models.length);
  });

  it("builds a full CarSpec from the baseline plus overrides", () => {
    const sedan = carSpecOf(roster.cars[0] as (typeof roster.cars)[number]);
    expect(sedan).toEqual({ ...BASELINE_CAR, id: "sedan" });
    const racer = carSpecOf(
      roster.cars.find((c) => c.id === "racer") as (typeof roster.cars)[number],
    );
    expect(racer.id).toBe("racer");
    expect(racer.mass).toBeLessThan(BASELINE_CAR.mass);
    expect(racer.wheels).toBe(BASELINE_CAR.wheels);
  });

  it("every car differs from the baseline in at least one handling field, except the starter", () => {
    for (const entry of roster.cars.slice(1)) {
      expect(Object.keys(entry.spec).length).toBeGreaterThanOrEqual(3);
    }
  });
});

describe("parseRoster", () => {
  const base = () =>
    JSON.parse(JSON.stringify(roster)) as Record<string, unknown> & {
      cars: Record<string, unknown>[];
    };

  it("rejects bad input and lists every problem", () => {
    const bad = base();
    bad.cars[1] = { ...bad.cars[1], price: -5, spec: { mass: -1, wheelRadius: 1 } };
    bad.cars[2] = { ...bad.cars[2], id: "sedan" };
    const error = (() => {
      try {
        parseRoster(bad);
      } catch (e) {
        return e;
      }
    })();
    expect(error).toBeInstanceOf(RosterError);
    const text = (error as RosterError).problems.join("\n");
    expect(text).toContain("price must be a non-negative integer");
    expect(text).toContain("mass must be a positive number");
    expect(text).toContain("wheelRadius is not an overridable field");
    expect(text).toContain("unique");
  });

  it("requires a free starter that exists", () => {
    expect(() => parseRoster({ ...base(), starter: "missing" })).toThrow(RosterError);
    const priced = base();
    priced.cars[0] = { ...priced.cars[0], price: 10 };
    expect(() => parseRoster(priced)).toThrow(/starter car must be free/);
  });

  it("rejects free cars that are not the starter", () => {
    const free = base();
    free.cars[2] = { ...free.cars[2], price: 0 };
    expect(() => parseRoster(free)).toThrow(/free but is not the starter/);
  });

  it("only allows overriding handling fields, never geometry", () => {
    expect(OVERRIDABLE_FIELDS).not.toContain("wheels");
    expect(OVERRIDABLE_FIELDS).not.toContain("wheelRadius");
    expect(OVERRIDABLE_FIELDS).not.toContain("chassisHalfExtents");
  });

  it("rejects non-objects", () => {
    expect(() => parseRoster(null)).toThrow(RosterError);
    expect(() => parseRoster({ schema_version: 2, cars: [], starter: "" })).toThrow(RosterError);
  });
});
