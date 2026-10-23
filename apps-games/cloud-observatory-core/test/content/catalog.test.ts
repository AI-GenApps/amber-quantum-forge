import { describe, expect, it } from "vitest";
import { buyBoon, buyInstrument, buyUpgrade, gather, tick } from "../../src/actions";
import { canChart, completeChart, startChart, tapStar } from "../../src/chart";
import { ACHIEVEMENTS } from "../../src/content/achievements";
import {
  achievementById,
  boonById,
  CATALOG,
  constellationById,
  instrumentById,
  loreById,
  loreForTrigger,
  upgradeById,
} from "../../src/content/catalog";
import { LORE, LORE_CHAPTERS } from "../../src/content/lore";
import { canEclipse, eclipse } from "../../src/eclipse";
import { globalMultiplier, starlightPerSecond } from "../../src/economy";
import { reduce } from "../../src/reducer";
import { createInitialState, sanitizeState } from "../../src/state";

function frozenDeep(value: unknown): boolean {
  if (typeof value !== "object" || value === null) return true;
  if (!Object.isFrozen(value)) return false;
  return Object.values(value).every(frozenDeep);
}

describe("CATALOG", () => {
  it("is deeply frozen", () => {
    expect(frozenDeep(CATALOG)).toBe(true);
    expect(frozenDeep(ACHIEVEMENTS)).toBe(true);
    expect(frozenDeep(LORE)).toBe(true);
    expect(frozenDeep(LORE_CHAPTERS)).toBe(true);
    expect(() => {
      (CATALOG.instruments[0] as { name: string }).name = "changed";
    }).toThrow();
  });

  it("round-trips through JSON", () => {
    expect(JSON.parse(JSON.stringify(CATALOG))).toEqual(CATALOG);
    expect(JSON.parse(JSON.stringify(LORE))).toEqual(LORE);
    expect(JSON.parse(JSON.stringify(ACHIEVEMENTS))).toEqual(ACHIEVEMENTS);
  });

  it("is indexed by id", () => {
    expect(instrumentById.size).toBe(8);
    expect(upgradeById.size).toBe(24);
    expect(constellationById.size).toBe(12);
    expect(boonById.size).toBe(10);
    expect(achievementById.size).toBe(20);
    expect(loreById.size).toBe(30);
    expect(instrumentById.get("orrery")?.name).toBe("Clockwork Orrery");
    expect(loreForTrigger("boon", "totality")?.id).toBe("lore-30");
    expect(loreForTrigger("boon", "ghost")).toBeUndefined();
  });
});

describe("generic rules against the real catalog", () => {
  it("starts a journey the way the economy says", () => {
    const state = createInitialState(CATALOG);
    expect(state.starlight).toBe(10);
    expect(starlightPerSecond(state, CATALOG)).toBe(0);
    expect(globalMultiplier(state, CATALOG)).toBe(1);
  });

  it("buys, upgrades, gathers and ticks", () => {
    let state = { ...createInitialState(CATALOG), starlight: 1e6 };
    const bought = buyInstrument(state, "telescope", 10, CATALOG);
    expect(bought.ok).toBe(true);
    if (!bought.ok) return;
    state = bought.state;
    expect(state.owned.telescope).toBe(10);
    const upgraded = buyUpgrade(state, "u-telescope-1", CATALOG);
    expect(upgraded.ok).toBe(true);
    if (!upgraded.ok) return;
    state = tick(gather(upgraded.state, CATALOG), 10, CATALOG);
    expect(state.lifetimeStarlight).toBeGreaterThan(0);
    expect(starlightPerSecond(state, CATALOG)).toBeCloseTo(10 * 0.2 * 2);
    expect(buyInstrument(state, "prism", 1, CATALOG)).toEqual({
      ok: false,
      reason: "not-unlocked",
    });
  });

  it("charts every constellation with a perfect session once its prerequisite is met", () => {
    let state = {
      ...createInitialState(CATALOG),
      starlight: 1e12,
      owned: Object.fromEntries(CATALOG.instruments.map((i) => [i.id, 12])),
    };
    for (const constellation of CATALOG.constellations) {
      expect(canChart(state, constellation.id, CATALOG).ok).toBe(true);
      let session = startChart(constellation);
      for (let i = 0; i < constellation.stars.length; i++) session = tapStar(session, i).session;
      const completion = completeChart(state, session, CATALOG);
      expect(completion.ok).toBe(true);
      if (!completion.ok) return;
      expect(completion.flawless).toBe(true);
      state = completion.state;
    }
    expect(state.charted).toHaveLength(12);
  });

  it("buys every boon with enough shards and runs the Eclipse", () => {
    let state = { ...createInitialState(CATALOG), shards: 105 };
    for (const boon of CATALOG.boons) {
      const result = buyBoon(state, boon.id, CATALOG);
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      state = result.state;
    }
    expect(state.shards).toBe(0);
    expect(state.boons).toHaveLength(10);
    const ready = { ...state, cycleStarlight: 4e10, starlight: 5 };
    expect(canEclipse(ready)).toBe(true);
    const result = eclipse(ready, CATALOG);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.starlight).toBe(1000);
    expect(result.state.owned).toEqual({ telescope: 5, lens: 3 });
    expect(result.shardsGained).toBe(6);
  });

  it("round-trips a state through the reducer and sanitizeState", () => {
    const start = { ...createInitialState(CATALOG), starlight: 500 };
    const { state } = reduce(
      start,
      { type: "buy-instrument", id: "telescope", quantity: 3 },
      CATALOG,
    );
    expect(state.owned.telescope).toBe(3);
    expect(sanitizeState(JSON.parse(JSON.stringify(state)), CATALOG)).toEqual(state);
  });
});
