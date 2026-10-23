import { describe, expect, it } from "vitest";
import {
  addDays,
  DAILY_EPOCH,
  dailySeed,
  dayNumber,
  daysBetween,
  isDateKey,
  localDateKey,
  parseDateKey,
  streakStep,
} from "./daily";

describe("localDateKey", () => {
  it("uses the device-local calendar fields", () => {
    expect(localDateKey(new Date(2026, 9, 23, 0, 0, 1))).toBe("2026-10-23");
    expect(localDateKey(new Date(2026, 9, 23, 23, 59, 59))).toBe("2026-10-23");
    expect(localDateKey(new Date(2026, 0, 5))).toBe("2026-01-05");
    expect(localDateKey(new Date(2026, 11, 31, 12))).toBe("2026-12-31");
  });

  it("pads short years", () => {
    const d = new Date(2026, 0, 1);
    d.setFullYear(999);
    expect(localDateKey(d)).toBe("0999-01-01");
  });
});

describe("parseDateKey", () => {
  it("accepts real dates and rejects others", () => {
    expect(parseDateKey("2028-02-29")).toEqual({ year: 2028, month: 2, day: 29 });
    expect(parseDateKey("2026-02-29")).toBeNull();
    expect(parseDateKey("2026-13-01")).toBeNull();
    expect(parseDateKey("2026-1-1")).toBeNull();
    expect(parseDateKey("nope")).toBeNull();
    expect(isDateKey("2026-10-23")).toBe(true);
    expect(isDateKey("2026-10-32")).toBe(false);
  });
});

describe("dayNumber", () => {
  it("counts whole days from the epoch", () => {
    expect(dayNumber(DAILY_EPOCH)).toBe(0);
    expect(dayNumber("2026-01-02")).toBe(1);
    expect(dayNumber("2026-10-23")).toBe(295);
    expect(dayNumber("2025-12-31")).toBe(-1);
    expect(dayNumber("2027-01-01")).toBe(365);
  });

  it("accepts a custom epoch and rejects bad keys", () => {
    expect(dayNumber("2026-10-23", "2026-10-20")).toBe(3);
    expect(() => dayNumber("bad")).toThrow(RangeError);
  });

  it("is unaffected by daylight-saving boundaries", () => {
    expect(dayNumber("2026-03-30") - dayNumber("2026-03-28")).toBe(2);
    expect(dayNumber("2026-11-02") - dayNumber("2026-10-31")).toBe(2);
  });
});

describe("addDays and daysBetween", () => {
  it("rolls across month and year ends", () => {
    expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
    expect(addDays("2028-03-01", -1)).toBe("2028-02-29");
    expect(addDays("2026-10-23", 0)).toBe("2026-10-23");
  });

  it("is the inverse of addDays", () => {
    expect(daysBetween("2026-10-23", addDays("2026-10-23", 40))).toBe(40);
    expect(daysBetween("2026-10-23", "2026-10-20")).toBe(-3);
  });
});

describe("dailySeed", () => {
  it("is stable per game and date and differs otherwise", () => {
    expect(dailySeed("lantern-loops", "2026-10-23")).toBe(dailySeed("lantern-loops", "2026-10-23"));
    expect(dailySeed("lantern-loops", "2026-10-23")).not.toBe(
      dailySeed("lantern-loops", "2026-10-24"),
    );
    expect(dailySeed("lantern-loops", "2026-10-23")).not.toBe(
      dailySeed("cloud-observatory", "2026-10-23"),
    );
  });

  it("matches a golden value", () => {
    expect(dailySeed("lantern-loops", "2026-10-23")).toBe(2451716204);
  });

  it("rejects malformed dates", () => {
    expect(() => dailySeed("g", "2026/10/23")).toThrow(RangeError);
  });
});

describe("streakStep", () => {
  it("classifies the gap between completions", () => {
    expect(streakStep("2026-10-23", "2026-10-23")).toBe("same-day");
    expect(streakStep("2026-10-23", "2026-10-24")).toBe("next-day");
    expect(streakStep("2026-10-23", "2026-10-26")).toBe("gap");
    expect(streakStep("2026-10-23", "2026-10-22")).toBe("clock-went-back");
  });
});
