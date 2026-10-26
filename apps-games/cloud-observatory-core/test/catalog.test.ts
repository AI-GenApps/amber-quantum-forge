import { describe, expect, it } from "vitest";
import {
  boonEffects,
  findBoon,
  findConstellation,
  findInstrument,
  findUpgrade,
  isInstrumentUnlocked,
  ownedCount,
} from "../src/catalog";
import { BOONS, CATALOG, LENS, LYRE, stateWith, TELESCOPE, UPGRADES } from "./fixtures/catalog";

describe("catalog lookups", () => {
  it("finds known ids and misses unknown ones", () => {
    expect(findInstrument(CATALOG, "lens")).toBe(LENS);
    expect(findInstrument(CATALOG, "ghost")).toBeUndefined();
    expect(findUpgrade(CATALOG, "tel-2")).toBe(UPGRADES[1]);
    expect(findUpgrade(CATALOG, "ghost")).toBeUndefined();
    expect(findConstellation(CATALOG, "lyre")).toBe(LYRE);
    expect(findConstellation(CATALOG, "ghost")).toBeUndefined();
    expect(findBoon(CATALOG, "night-watch")).toBe(BOONS[2]);
    expect(findBoon(CATALOG, "ghost")).toBeUndefined();
  });
});

describe("ownedCount", () => {
  it("defaults to zero", () => {
    expect(ownedCount(stateWith(), "telescope")).toBe(0);
    expect(ownedCount(stateWith({ owned: { telescope: 4 } }), "telescope")).toBe(4);
  });
});

describe("boonEffects", () => {
  it("lists only owned boons that exist in the catalog, in catalog order", () => {
    expect(boonEffects(stateWith(), CATALOG)).toEqual([]);
    const state = stateWith({ boons: ["night-watch", "dark-adapted", "ghost"] });
    expect(boonEffects(state, CATALOG)).toEqual([BOONS[0]?.effect, BOONS[2]?.effect]);
  });
});

describe("isInstrumentUnlocked", () => {
  it("always unlocks the first instrument", () => {
    expect(isInstrumentUnlocked(stateWith(), TELESCOPE.id, CATALOG)).toBe(true);
  });

  it("unlocks the next one after the previous was bought once", () => {
    expect(isInstrumentUnlocked(stateWith(), "lens", CATALOG)).toBe(false);
    expect(isInstrumentUnlocked(stateWith({ owned: { telescope: 1 } }), "lens", CATALOG)).toBe(
      true,
    );
  });

  it("is false for an unknown id", () => {
    expect(isInstrumentUnlocked(stateWith({ owned: { telescope: 5 } }), "ghost", CATALOG)).toBe(
      false,
    );
  });
});
