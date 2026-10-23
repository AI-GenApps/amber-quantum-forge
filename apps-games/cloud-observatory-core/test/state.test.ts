import { describe, expect, it } from "vitest";
import { createInitialState, sanitizeState } from "../src/state";
import { CATALOG, stateWith } from "./fixtures/catalog";

const VALID = stateWith({
  starlight: 1234.5,
  cycleStarlight: 99999,
  lifetimeStarlight: 123456789,
  shards: 4,
  shardsEarned: 9,
  owned: { telescope: 12, lens: 3 },
  upgrades: ["tel-1"],
  charted: ["lyre"],
  boons: ["brass-polish"],
  achievements: ["first-light"],
  eclipses: 2,
  taps: 77,
  cycleSeconds: 3600.25,
});

function broken(patch: Record<string, unknown>): unknown {
  return { ...VALID, ...patch };
}

describe("createInitialState", () => {
  it("starts with 10 starlight and nothing else", () => {
    expect(createInitialState(CATALOG)).toEqual({
      starlight: 10,
      cycleStarlight: 0,
      lifetimeStarlight: 0,
      shards: 0,
      shardsEarned: 0,
      owned: {},
      upgrades: [],
      charted: [],
      boons: [],
      achievements: [],
      eclipses: 0,
      taps: 0,
      cycleSeconds: 0,
    });
  });

  it("returns a fresh object each time", () => {
    expect(createInitialState(CATALOG)).not.toBe(createInitialState(CATALOG));
  });
});

describe("sanitizeState", () => {
  it("accepts a valid state unchanged", () => {
    expect(sanitizeState(VALID, CATALOG)).toEqual(VALID);
    expect(sanitizeState(createInitialState(CATALOG), CATALOG)).toEqual(
      createInitialState(CATALOG),
    );
  });

  it("survives a JSON round trip", () => {
    const restored = sanitizeState(JSON.parse(JSON.stringify(VALID)), CATALOG);
    expect(restored).toEqual(VALID);
  });

  it("rejects non objects", () => {
    for (const raw of [null, undefined, 5, "x", [], true]) {
      expect(sanitizeState(raw, CATALOG)).toBeNull();
    }
  });

  it("rejects NaN in any numeric field", () => {
    for (const key of [
      "starlight",
      "cycleStarlight",
      "lifetimeStarlight",
      "shards",
      "shardsEarned",
      "eclipses",
      "taps",
      "cycleSeconds",
    ]) {
      expect(sanitizeState(broken({ [key]: Number.NaN }), CATALOG)).toBeNull();
    }
  });

  it("rejects negative numbers", () => {
    for (const key of [
      "starlight",
      "cycleStarlight",
      "lifetimeStarlight",
      "shards",
      "shardsEarned",
      "eclipses",
      "taps",
      "cycleSeconds",
    ]) {
      expect(sanitizeState(broken({ [key]: -1 }), CATALOG)).toBeNull();
    }
    expect(sanitizeState(broken({ owned: { telescope: -2 } }), CATALOG)).toBeNull();
  });

  it("rejects fractional counts", () => {
    expect(sanitizeState(broken({ shards: 1.5 }), CATALOG)).toBeNull();
    expect(sanitizeState(broken({ taps: 0.5 }), CATALOG)).toBeNull();
    expect(sanitizeState(broken({ owned: { telescope: 2.5 } }), CATALOG)).toBeNull();
  });

  it("rejects unknown ids", () => {
    expect(sanitizeState(broken({ owned: { ghost: 1 } }), CATALOG)).toBeNull();
    expect(sanitizeState(broken({ upgrades: ["ghost"] }), CATALOG)).toBeNull();
    expect(sanitizeState(broken({ charted: ["ghost"] }), CATALOG)).toBeNull();
    expect(sanitizeState(broken({ boons: ["ghost"] }), CATALOG)).toBeNull();
  });

  it("rejects wrong types", () => {
    expect(sanitizeState(broken({ starlight: "5" }), CATALOG)).toBeNull();
    expect(sanitizeState(broken({ owned: [] }), CATALOG)).toBeNull();
    expect(sanitizeState(broken({ owned: null }), CATALOG)).toBeNull();
    expect(sanitizeState(broken({ upgrades: "tel-1" }), CATALOG)).toBeNull();
    expect(sanitizeState(broken({ charted: [1] }), CATALOG)).toBeNull();
    expect(sanitizeState(broken({ achievements: [null] }), CATALOG)).toBeNull();
    expect(sanitizeState(broken({ boons: {} }), CATALOG)).toBeNull();
    expect(sanitizeState(broken({ owned: { telescope: "3" } }), CATALOG)).toBeNull();
  });

  it("rejects a missing field", () => {
    const { taps: _taps, ...rest } = VALID;
    expect(sanitizeState(rest, CATALOG)).toBeNull();
  });

  it("clamps oversized numbers to the ceiling", () => {
    const result = sanitizeState(
      broken({
        starlight: 1e305,
        lifetimeStarlight: Number.POSITIVE_INFINITY,
        owned: { telescope: Number.POSITIVE_INFINITY },
      }),
      CATALOG,
    );
    expect(result?.starlight).toBe(1e300);
    expect(result?.lifetimeStarlight).toBe(1e300);
    expect(result?.owned.telescope).toBe(1e300);
  });

  it("drops duplicate ids", () => {
    const result = sanitizeState(broken({ charted: ["lyre", "lyre"] }), CATALOG);
    expect(result?.charted).toEqual(["lyre"]);
  });

  it("does not alias the input arrays", () => {
    const result = sanitizeState(VALID, CATALOG);
    expect(result?.upgrades).not.toBe(VALID.upgrades);
    expect(result?.owned).not.toBe(VALID.owned);
  });
});
