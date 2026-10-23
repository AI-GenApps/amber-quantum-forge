import { describe, expect, it } from "vitest";
import {
  archiveKeys,
  isDateKey,
  isoWeekKey,
  parseDateKey,
  shiftDate,
  toDateKey,
  weekdayOf,
} from "../../src/progress/calendar";

function key(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function referenceIsoWeek(d: Date): string {
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const yearStart = Date.UTC(t.getUTCFullYear(), 0, 1);
  const week = Math.ceil(((t.getTime() - yearStart) / 86_400_000 + 1) / 7);
  return `${t.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

describe("calendar helpers against Date", () => {
  it("matches weekday, ISO week and shift for every day of 2024 to 2030", () => {
    let count = 0;
    for (let t = Date.UTC(2024, 0, 1); t < Date.UTC(2031, 0, 1); t += 86_400_000) {
      const d = new Date(t);
      const k = key(d);
      expect(weekdayOf(k)).toBe(d.getUTCDay() === 0 ? 7 : d.getUTCDay());
      expect(isoWeekKey(k)).toBe(referenceIsoWeek(d));
      expect(shiftDate(k, 1)).toBe(key(new Date(t + 86_400_000)));
      expect(shiftDate(k, -1)).toBe(key(new Date(t - 86_400_000)));
      expect(parseDateKey(k)).not.toBeNull();
      count += 1;
    }
    expect(count).toBe(2557);
  });

  it("uses one ISO week for 2026-12-28 to 2027-01-03", () => {
    const keys = [
      "2026-12-28",
      "2026-12-29",
      "2026-12-30",
      "2026-12-31",
      "2027-01-01",
      "2027-01-02",
      "2027-01-03",
    ];
    expect(new Set(keys.map(isoWeekKey))).toEqual(new Set(["2026-W53"]));
    expect(isoWeekKey("2027-01-04")).toBe("2027-W01");
    expect(isoWeekKey("2026-12-27")).toBe("2026-W52");
  });

  it("knows the anchor dates", () => {
    expect(weekdayOf("2026-10-23")).toBe(5);
    expect(weekdayOf("2026-10-26")).toBe(1);
    expect(weekdayOf("2026-10-25")).toBe(7);
  });
});

describe("date keys", () => {
  it("validates real calendar dates only", () => {
    expect(isDateKey("2028-02-29")).toBe(true);
    for (const bad of [
      "2026-02-29",
      "2026-13-01",
      "2026-00-10",
      "2026-01-00",
      "2026-1-1",
      "nope",
      "",
      5,
    ]) {
      expect(isDateKey(bad)).toBe(false);
    }
    expect(toDateKey({ year: 999, month: 1, day: 5 })).toBe("0999-01-05");
    expect(() => weekdayOf("bad")).toThrow(RangeError);
  });
});

describe("archiveKeys", () => {
  it("lists the 30 previous dates, yesterday first, never today", () => {
    const keys = archiveKeys("2026-10-23");
    expect(keys).toHaveLength(30);
    expect(keys[0]).toBe("2026-10-22");
    expect(keys[29]).toBe("2026-09-23");
    expect(keys).not.toContain("2026-10-23");
    expect(new Set(keys).size).toBe(30);
    expect([...keys].sort().reverse()).toEqual(keys);
  });

  it("crosses a year boundary and honours a custom count", () => {
    expect(archiveKeys("2027-01-02", 3)).toEqual(["2027-01-01", "2026-12-31", "2026-12-30"]);
    expect(archiveKeys("2026-10-23", 0)).toEqual([]);
  });
});
