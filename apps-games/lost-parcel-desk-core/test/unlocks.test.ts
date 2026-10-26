import { describe, expect, it } from "vitest";
import {
  caseUnlocked,
  chaptersUnlocked,
  chapterUnlocked,
  defaultProfile,
  stampsToNextUnlock,
  themesUnlocked,
  totalStamps,
} from "../src";
import { docTable } from "./fixtures/doc";
import { withCases, withTotal } from "./fixtures/profiles";

describe("unlock thresholds match economy.md", () => {
  it("chapters and themes", () => {
    const rows = docTable("economy.md", "## Unlock thresholds (stamps)");
    expect(rows.map((row) => row[1])).toEqual([
      "7 (and case 04 closed)",
      "18 (and case 08 closed)",
      "6, 14, 24, 33",
    ]);
  });
});

describe("totalStamps", () => {
  it("sums the best stamps of every case", () => {
    expect(totalStamps(defaultProfile())).toBe(0);
    expect(totalStamps(withCases({ "01": 3, "02": 2, "12": 1 }))).toBe(6);
    expect(totalStamps(withTotal(36))).toBe(36);
  });
});

describe("chapter 2", () => {
  it("stays shut at 6 stamps even with case 04 closed", () => {
    const profile = withCases({ "01": 1, "02": 1, "03": 1, "04": 3 });
    expect(totalStamps(profile)).toBe(6);
    expect(chapterUnlocked(profile, 2)).toBe(false);
    expect(caseUnlocked(profile, "05")).toBe(false);
  });

  it("opens at 7 stamps with case 04 closed", () => {
    const profile = withCases({ "01": 2, "02": 1, "03": 1, "04": 3 });
    expect(totalStamps(profile)).toBe(7);
    expect(chapterUnlocked(profile, 2)).toBe(true);
    expect(caseUnlocked(profile, "05")).toBe(true);
    expect(caseUnlocked(profile, "06")).toBe(false);
  });

  it("stays shut at 9 stamps while case 04 is open", () => {
    const profile = withCases({ "01": 3, "02": 3, "03": 3 });
    expect(chapterUnlocked(profile, 2)).toBe(false);
    expect(caseUnlocked(profile, "04")).toBe(true);
    expect(caseUnlocked(profile, "05")).toBe(false);
  });
});

describe("chapter 3", () => {
  const chapterOne = { "01": 3, "02": 3, "03": 3, "04": 3 };

  it("stays shut at 17 stamps with case 08 closed", () => {
    const profile = withCases({ ...chapterOne, "05": 1, "06": 1, "07": 1, "08": 2 });
    expect(totalStamps(profile)).toBe(17);
    expect(chapterUnlocked(profile, 3)).toBe(false);
    expect(caseUnlocked(profile, "09")).toBe(false);
  });

  it("opens at 18 stamps with case 08 closed", () => {
    const profile = withCases({ ...chapterOne, "05": 1, "06": 1, "07": 1, "08": 3 });
    expect(totalStamps(profile)).toBe(18);
    expect(chapterUnlocked(profile, 3)).toBe(true);
    expect(caseUnlocked(profile, "09")).toBe(true);
    expect(caseUnlocked(profile, "10")).toBe(false);
  });

  it("stays shut at 21 stamps while case 08 is open", () => {
    const profile = withCases({ ...chapterOne, "05": 3, "06": 3, "07": 3 });
    expect(totalStamps(profile)).toBe(21);
    expect(chapterUnlocked(profile, 3)).toBe(false);
    expect(caseUnlocked(profile, "08")).toBe(true);
  });
});

describe("caseUnlocked", () => {
  it("opens the first case of chapter 1 and then follows the previous case", () => {
    const profile = defaultProfile();
    expect(caseUnlocked(profile, "01")).toBe(true);
    expect(caseUnlocked(profile, "02")).toBe(false);
    expect(caseUnlocked(withCases({ "01": 1 }), "02")).toBe(true);
    expect(caseUnlocked(withCases({ "01": 1 }), "03")).toBe(false);
  });

  it("knows nothing about unknown cases", () => {
    expect(caseUnlocked(defaultProfile(), "99")).toBe(false);
    expect(chapterUnlocked(defaultProfile(), 9)).toBe(false);
  });

  it("lists the unlocked chapters", () => {
    expect(chaptersUnlocked(defaultProfile())).toEqual([1]);
    expect(chaptersUnlocked(withTotal(36))).toEqual([1, 2, 3]);
  });
});

describe("themesUnlocked", () => {
  const cases: Array<[number, number]> = [
    [0, 1],
    [5, 1],
    [6, 2],
    [13, 2],
    [14, 3],
    [23, 3],
    [24, 4],
    [32, 4],
    [33, 5],
    [36, 5],
  ];
  it.each(cases)("%i stamps unlock %i themes", (total, count) => {
    expect(themesUnlocked(withTotal(total))).toHaveLength(count);
  });
});

describe("stampsToNextUnlock", () => {
  it("points at the nearest threshold", () => {
    expect(stampsToNextUnlock(defaultProfile())).toEqual({
      kind: "theme",
      id: "teal-blotter",
      needed: 6,
    });
    expect(stampsToNextUnlock(withTotal(6))).toEqual({ kind: "chapter", id: 2, needed: 1 });
    expect(stampsToNextUnlock(withTotal(7))).toEqual({
      kind: "theme",
      id: "brick-ledger",
      needed: 7,
    });
    expect(stampsToNextUnlock(withTotal(17))).toEqual({ kind: "chapter", id: 3, needed: 1 });
    expect(stampsToNextUnlock(withTotal(32))).toEqual({
      kind: "theme",
      id: "gold-rubber-stamp",
      needed: 1,
    });
    expect(stampsToNextUnlock(withTotal(33))).toBeNull();
  });
});
