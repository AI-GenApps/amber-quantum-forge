import { describe, expect, it } from "vitest";
import { applyOffline } from "../src/actions";
import { RULES } from "../src/constants";
import { CATALOG } from "../src/content/catalog";
import { offlineEfficiency, starlightPerSecond } from "../src/economy";
import { reduce } from "../src/reducer";
import { createInitialState } from "../src/state";
import type { Catalog, GameState } from "../src/types";

/** Offline time buys nothing, so the rate is constant and the closed form must equal stepping. */
const EARLY: GameState = {
  ...createInitialState(CATALOG),
  starlight: 50,
  owned: { telescope: 100 },
};

const MID: GameState = {
  ...createInitialState(CATALOG),
  starlight: 4e5,
  cycleStarlight: 2e6,
  lifetimeStarlight: 3e6,
  owned: { telescope: 30, lens: 14, prism: 5 },
  upgrades: ["u-telescope-1", "u-telescope-2", "u-lens-1"],
  charted: ["lyre", "crown", "key"],
  boons: ["dark-adapted", "brass-polish"],
  achievements: ["telescope-row", "first-ink"],
};

const LATE: GameState = {
  ...createInitialState(CATALOG),
  starlight: 2e9,
  cycleStarlight: 4e10,
  lifetimeStarlight: 9e10,
  owned: {
    telescope: 60,
    lens: 40,
    prism: 30,
    orrery: 25,
    "star-map": 20,
    beacon: 12,
    archive: 9,
    "aurora-coil": 5,
  },
  upgrades: ["u-telescope-1", "u-telescope-2", "u-lens-1"],
  charted: ["lyre", "crown", "key", "lantern", "whale", "harp", "fox", "archer"],
  boons: ["dark-adapted", "brass-polish", "clear-glass"],
  achievements: ["telescope-row", "lens-bench", "first-ink", "cartographer", "first-shadow"],
};

const LATE_NIGHT: GameState = { ...LATE, boons: [...LATE.boons, "night-watch", "corona"] };
const LATE_VIGIL: GameState = {
  ...LATE,
  boons: [...LATE.boons, "night-watch", "long-vigil", "corona", "totality"],
};

const SAVES: readonly (readonly [string, GameState])[] = [
  ["early game, base 50 percent", EARLY],
  ["mid game with upgrades and atlas", MID],
  ["late game, base 50 percent", LATE],
  ["late game, Night Watch 75 percent", LATE_NIGHT],
  ["late game, Long Vigil 100 percent", LATE_VIGIL],
];

const STEP = 0.1;

/** Reference: the online fixed-step loop (what a running app does) scaled by offline efficiency. */
function steppedGain(state: GameState, seconds: number): number {
  const ticks = Math.round(seconds / STEP);
  let current = state;
  for (let i = 0; i < ticks; i++) {
    const result = reduce(current, { type: "tick", seconds: STEP }, CATALOG);
    if (!result.ok) throw new Error("tick rejected");
    current = result.state;
  }
  return (current.lifetimeStarlight - state.lifetimeStarlight) * offlineEfficiency(state, CATALOG);
}

function expectClose(actual: number, expected: number, relative = 1e-8): void {
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(Math.abs(expected) * relative);
}

describe("closed-form offline progress equals the tick-by-tick reference", () => {
  for (const [name, save] of SAVES) {
    for (const seconds of [1, 90, 1800]) {
      it(`${name}: ${seconds} s`, () => {
        const fast = applyOffline(save, seconds, CATALOG);
        expect(fast.secondsCounted).toBe(seconds);
        expectClose(fast.gained, steppedGain(save, seconds));
        expectClose(fast.state.starlight - save.starlight, fast.gained, 1e-6);
        expectClose(fast.state.lifetimeStarlight - save.lifetimeStarlight, fast.gained, 1e-6);
      });
    }
  }

  it("matches the reference over the full 8 hour cap (288,000 reference ticks)", () => {
    for (const save of [MID, LATE_VIGIL]) {
      const fast = applyOffline(save, RULES.OFFLINE_CAP_SECONDS, CATALOG);
      expect(fast.capped).toBe(false);
      expectClose(fast.gained, steppedGain(save, RULES.OFFLINE_CAP_SECONDS));
    }
  }, 120_000);

  it("counts only the 8 hour cap when away longer", () => {
    const capped = applyOffline(LATE, 3 * 86400, CATALOG);
    const exact = applyOffline(LATE, RULES.OFFLINE_CAP_SECONDS, CATALOG);
    expect(capped.capped).toBe(true);
    expect(capped.secondsCounted).toBe(RULES.OFFLINE_CAP_SECONDS);
    expect(capped.gained).toBe(exact.gained);
  });

  it("stays at the value ceiling exactly like repeated ticks", () => {
    const huge: GameState = {
      ...LATE,
      starlight: RULES.MAX_VALUE,
      cycleStarlight: RULES.MAX_VALUE,
      lifetimeStarlight: RULES.MAX_VALUE,
    };
    const fast = applyOffline(huge, 3600, CATALOG);
    let current = huge;
    for (let i = 0; i < 600; i++) {
      const result = reduce(current, { type: "tick", seconds: 6 }, CATALOG);
      if (!result.ok) throw new Error("tick rejected");
      current = result.state;
    }
    expect(fast.state.starlight).toBe(RULES.MAX_VALUE);
    expect(current.starlight).toBe(RULES.MAX_VALUE);
    expect(Number.isFinite(fast.gained)).toBe(true);
  });

  it("keeps the per-second rate constant while away (nothing is bought offline)", () => {
    const after = applyOffline(LATE, 3600, CATALOG).state;
    expect(starlightPerSecond(after, CATALOG)).toBe(starlightPerSecond(LATE, CATALOG));
  });
});

describe("offline cost does not depend on the time away", () => {
  /** Counts reads of the catalog's instrument list, the unit of work of one rate evaluation. */
  function countedCatalog(): { catalog: Catalog; reads: () => number } {
    let reads = 0;
    const catalog = new Proxy(CATALOG, {
      get(target, key, receiver) {
        if (key === "instruments") reads++;
        return Reflect.get(target, key, receiver);
      },
    });
    return { catalog, reads: () => reads };
  }

  it("evaluates the economy the same number of times for 1 second and for 8 hours", () => {
    const short = countedCatalog();
    applyOffline(LATE_VIGIL, 1, short.catalog);
    const long = countedCatalog();
    applyOffline(LATE_VIGIL, RULES.OFFLINE_CAP_SECONDS, long.catalog);
    const huge = countedCatalog();
    applyOffline(LATE_VIGIL, 10 * 86400, huge.catalog);
    expect(short.reads()).toBeGreaterThan(0);
    expect(long.reads()).toBe(short.reads());
    expect(huge.reads()).toBe(short.reads());
  });
});
