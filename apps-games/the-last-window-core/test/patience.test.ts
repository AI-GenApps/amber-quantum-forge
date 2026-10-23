import { describe, expect, it } from "vitest";
import {
  decorEffects,
  LATE_SHIFT_TICKS,
  lateBaseSeconds,
  latePatienceSeconds,
  noDecorEffects,
  patienceSeconds,
  patienceTicks,
  shiftLengthForDay,
  weatherForDay,
} from "../src";
import { readDoc, tableAfter } from "./helpers/doc";

const none = noDecorEffects();

describe("patienceSeconds", () => {
  const rows = tableAfter(readDoc("content-plan.md"), "## Campaign days");
  for (const row of rows) {
    const day = Number(row[0]);
    it(`Day ${day} equals the campaign table (${row[5]})`, () => {
      expect(`${patienceSeconds(day, weatherForDay(day), none)} s`).toBe(row[5]);
    });
  }

  it("uses the base table without weather", () => {
    const base = [60, 50, 50, 45, 45, 45, 45, 45, 40, 40, 40, 40, 40, 40];
    expect(base.map((_, i) => patienceSeconds(i + 1, "morning", none))).toEqual(base);
  });

  it("adds 6 seconds in rain", () => {
    expect(patienceSeconds(3, "rain", none)).toBe(56);
    expect(patienceSeconds(6, "rain", none)).toBe(51);
    expect(patienceSeconds(9, "rain", none)).toBe(46);
  });

  it("adds cushions everywhere and the chime only in rain", () => {
    const cushions = decorEffects(["decor-1"]);
    const chime = decorEffects(["decor-7"]);
    const both = decorEffects(["decor-1", "decor-7"]);
    expect(patienceSeconds(5, "evening", cushions)).toBe(49);
    expect(patienceSeconds(5, "evening", chime)).toBe(45);
    expect(patienceSeconds(6, "rain", chime)).toBe(59);
    expect(patienceSeconds(6, "rain", both)).toBe(63);
    expect(patienceSeconds(1, "morning", both)).toBe(64);
  });

  it("rejects days outside the table", () => {
    expect(() => patienceSeconds(0, "morning", none)).toThrow(RangeError);
    expect(() => patienceSeconds(15, "morning", none)).toThrow(RangeError);
  });
});

describe("patienceTicks", () => {
  it("converts seconds to ticks", () => {
    expect(patienceTicks(60, false)).toBe(600);
    expect(patienceTicks(34, false)).toBe(340);
  });

  it("multiplies relaxed mode by 1.5 and floors to a tick", () => {
    expect(patienceTicks(40, true)).toBe(600);
    expect(patienceTicks(45, true)).toBe(675);
    expect(patienceTicks(33.33, true)).toBe(499);
    expect(patienceTicks(0.07, true)).toBe(1);
  });
});

describe("Late Shift patience", () => {
  it("starts at 40 and loses a second every 5 shifts down to a floor of 34", () => {
    const expected: Array<[number, number]> = [
      [0, 40],
      [4, 40],
      [5, 39],
      [9, 39],
      [10, 38],
      [29, 35],
      [30, 34],
      [34, 34],
      [100, 34],
    ];
    for (const [done, seconds] of expected) expect(lateBaseSeconds(done)).toBe(seconds);
  });

  it("adds rain and decor like campaign days", () => {
    expect(latePatienceSeconds(0, "rain", none)).toBe(46);
    expect(latePatienceSeconds(5, "evening", decorEffects(["decor-1"]))).toBe(43);
    expect(latePatienceSeconds(60, "rain", decorEffects(["decor-7"]))).toBe(48);
  });
});

describe("shift length", () => {
  it("follows the day bands and the Late Shift length", () => {
    expect([1, 4].map(shiftLengthForDay)).toEqual([1800, 1800]);
    expect([5, 9].map(shiftLengthForDay)).toEqual([2100, 2100]);
    expect([10, 14].map(shiftLengthForDay)).toEqual([2400, 2400]);
    expect(LATE_SHIFT_TICKS).toBe(2400);
  });

  it("matches the campaign table shift column", () => {
    for (const row of tableAfter(readDoc("content-plan.md"), "## Campaign days")) {
      expect(shiftLengthForDay(Number(row[0]))).toBe(Number.parseInt(row[3] as string, 10) * 10);
    }
  });
});
