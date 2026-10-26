import { describe, expect, it } from "vitest";
import { DECOR, decorEffects, noDecorEffects } from "../src";
import { clean, readDoc, tableAfter } from "./helpers/doc";

describe("decor table", () => {
  const rows = tableAfter(readDoc("economy.md"), "## Decor (8)");
  it("has 8 rows totalling 1,200", () => {
    expect(rows).toHaveLength(8);
    expect(DECOR).toHaveLength(8);
    expect(DECOR.reduce((sum, rule) => sum + rule.price, 0)).toBe(1200);
  });
  for (const [index, row] of rows.entries()) {
    it(`row ${index + 1} matches economy.md`, () => {
      const rule = DECOR[index];
      expect(rule?.id).toBe(clean(row[0] as string));
      expect(rule?.name).toBe(row[1]);
      expect(rule?.price).toBe(Number(row[2]));
      expect(rule?.unlockDay).toBe(Number(row[3]));
    });
  }
  it("effect numbers match the effect column", () => {
    const effects = DECOR.map((rule) => rule.effect);
    expect(effects).toEqual([
      { kind: "patience", seconds: 4 },
      { kind: "bookPrice", coins: 2 },
      { kind: "drinkPrice", coins: 1 },
      { kind: "pastrySlot", slots: 1 },
      { kind: "bookSlot", slots: 1 },
      { kind: "fpOnDelighted", points: 1 },
      { kind: "rainPatience", seconds: 8 },
      { kind: "tipPoints", points: 10 },
    ]);
    const text = rows.map((row) => row[4] as string);
    expect(text[0]).toContain("+4 s patience");
    expect(text[1]).toContain("+2 coins");
    expect(text[2]).toContain("+1 coin");
    expect(text[3]).toContain("+1 pastry shelf kind");
    expect(text[4]).toContain("+1 book shelf slot");
    expect(text[5]).toContain("+1 FP");
    expect(text[6]).toContain("+8 s patience in rain");
    expect(text[7]).toContain("+10 points");
  });
});

describe("decorEffects", () => {
  it("is neutral with nothing owned", () => {
    expect(noDecorEffects()).toEqual({
      patienceSeconds: 0,
      rainPatienceSeconds: 0,
      bookBonus: 0,
      drinkBonus: 0,
      shelfSlots: { pastries: 3, books: 3 },
      fpBonus: 0,
      tipBonusPoints: 0,
    });
  });

  it("applies each item alone", () => {
    expect(decorEffects(["decor-1"]).patienceSeconds).toBe(4);
    expect(decorEffects(["decor-2"]).bookBonus).toBe(2);
    expect(decorEffects(["decor-3"]).drinkBonus).toBe(1);
    expect(decorEffects(["decor-4"]).shelfSlots).toEqual({ pastries: 4, books: 3 });
    expect(decorEffects(["decor-5"]).shelfSlots).toEqual({ pastries: 3, books: 4 });
    expect(decorEffects(["decor-6"]).fpBonus).toBe(1);
    expect(decorEffects(["decor-7"]).rainPatienceSeconds).toBe(8);
    expect(decorEffects(["decor-8"]).tipBonusPoints).toBe(10);
  });

  it("combines every item and ignores order and duplicates", () => {
    const all = DECOR.map((rule) => rule.id);
    const reversed = all.slice().reverse();
    expect(decorEffects(reversed)).toEqual(decorEffects(all));
    expect(decorEffects([...all, ...all])).toEqual(decorEffects(all));
    expect(decorEffects(all)).toEqual({
      patienceSeconds: 4,
      rainPatienceSeconds: 8,
      bookBonus: 2,
      drinkBonus: 1,
      shelfSlots: { pastries: 4, books: 4 },
      fpBonus: 1,
      tipBonusPoints: 10,
    });
  });
});
