import { describe, expect, it } from "vitest";
import { createClock, createFakeClock } from "../../src/session/clock";

describe("clock", () => {
  it("reads the injected time and formats the local date key", () => {
    const at = new Date(2026, 9, 23, 22, 30).getTime();
    const clock = createClock(() => at);
    expect(clock.now()).toBe(at);
    expect(clock.dateKey()).toBe("2026-10-23");
  });

  it("fake clock advances, jumps and overrides the date", () => {
    const clock = createFakeClock(Date.UTC(2026, 9, 23, 12));
    expect(clock.dateKey()).toBe("2026-10-23");
    clock.advance(13 * 3_600_000);
    expect(clock.dateKey()).toBe("2026-10-24");
    clock.advanceDays(2);
    expect(clock.dateKey()).toBe("2026-10-26");
    clock.setDateKey("2026-01-01");
    expect(clock.dateKey()).toBe("2026-01-01");
    clock.setDateKey(null);
    clock.set(Date.UTC(2027, 0, 1, 0, 0, 1));
    expect(clock.dateKey()).toBe("2027-01-01");
  });
});
