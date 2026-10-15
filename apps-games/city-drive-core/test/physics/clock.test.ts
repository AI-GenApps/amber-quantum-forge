import { describe, expect, it } from "vitest";
import { FIXED_DT, SimClock } from "../../src/index";

describe("SimClock", () => {
  it("runs one fixed step per 1/60 s and carries the remainder", () => {
    const clock = new SimClock();
    let steps = 0;
    expect(clock.advance(FIXED_DT * 0.5, () => steps++)).toBe(0);
    expect(clock.advance(FIXED_DT * 0.6, () => steps++)).toBe(1);
    expect(clock.alpha).toBeCloseTo(0.1, 6);
    expect(clock.advance(FIXED_DT * 2, () => steps++)).toBe(2);
    expect(steps).toBe(3);
    expect(clock.ticks).toBe(3);
  });

  it("is frame-rate independent: 1 s of 30 fps and 144 fps frames both give 60 steps", () => {
    for (const fps of [30, 144, 61]) {
      const clock = new SimClock({ maxStepsPerAdvance: 10 });
      let steps = 0;
      for (let i = 0; i < fps; i++) clock.advance(1 / fps, () => steps++);
      expect(Math.abs(steps - 60)).toBeLessThanOrEqual(1);
    }
  });

  it("caps catch-up after a long stall and drops the backlog", () => {
    const clock = new SimClock({ maxStepsPerAdvance: 5 });
    let steps = 0;
    expect(clock.advance(10, () => steps++)).toBe(5);
    expect(clock.alpha).toBeLessThan(1);
    expect(clock.advance(0, () => steps++)).toBe(0);
  });

  it("rejects negative frame times", () => {
    expect(() => new SimClock().advance(-1, () => undefined)).toThrow(/frame time/);
  });
});
