// @vitest-environment node
import { describe, expect, it } from "vitest";
import { quatFromYaw, RespawnDetector, type RespawnSample } from "../../src/index";

const DT = 1 / 60;
const UPRIGHT = { x: 0, y: 0, z: 0, w: 1 };

/** Roll about the car's forward axis (Z) by `deg` degrees. */
function roll(deg: number) {
  const half = (deg * Math.PI) / 360;
  return { x: 0, y: 0, z: Math.sin(half), w: Math.cos(half) };
}

function run(detector: RespawnDetector, seconds: number, sample: RespawnSample) {
  let reason: ReturnType<RespawnDetector["update"]>;
  const steps = Math.round(seconds / DT);
  for (let i = 0; i < steps; i++) reason = detector.update(DT, sample);
  return reason;
}

describe("RespawnDetector flipped", () => {
  it("fires after 2 s at roll 75 degrees", () => {
    const d = new RespawnDetector();
    const s = { rotation: roll(75), speedKmh: 0, throttle: 0 };
    expect(run(d, 1.9, s)).toBeUndefined();
    expect(run(d, 0.2, s)).toBe("flipped");
  });

  it("does not fire at roll 65 degrees however long it lasts", () => {
    const d = new RespawnDetector();
    expect(run(d, 10, { rotation: roll(65), speedKmh: 0, throttle: 0 })).toBeUndefined();
  });

  it("resets the timer when the car lands back on its wheels", () => {
    const d = new RespawnDetector();
    run(d, 1.5, { rotation: roll(120), speedKmh: 0, throttle: 0 });
    expect(d.flippedSeconds).toBeGreaterThan(1.4);
    run(d, 0.1, { rotation: UPRIGHT, speedKmh: 0, throttle: 0 });
    expect(d.flippedSeconds).toBe(0);
    expect(run(d, 1.5, { rotation: roll(120), speedKmh: 0, throttle: 0 })).toBeUndefined();
  });

  it("counts pitch as well as roll (car on its nose)", () => {
    const d = new RespawnDetector();
    const half = (80 * Math.PI) / 360;
    const nose = { x: Math.sin(half), y: 0, z: 0, w: Math.cos(half) };
    expect(run(d, 2.1, { rotation: nose, speedKmh: 0, throttle: 0 })).toBe("flipped");
  });

  it("ignores yaw", () => {
    const d = new RespawnDetector();
    expect(run(d, 5, { rotation: quatFromYaw(2), speedKmh: 0, throttle: 0 })).toBeUndefined();
  });
});

describe("RespawnDetector stuck", () => {
  it("fires after 4 s under 1 km/h on full throttle", () => {
    const d = new RespawnDetector();
    const s = { rotation: UPRIGHT, speedKmh: 0.4, throttle: 1 };
    expect(run(d, 3.9, s)).toBeUndefined();
    expect(run(d, 0.2, s)).toBe("stuck");
  });

  it("does not fire without full throttle or while moving", () => {
    const d = new RespawnDetector();
    expect(run(d, 10, { rotation: UPRIGHT, speedKmh: 0, throttle: 0.5 })).toBeUndefined();
    expect(run(d, 10, { rotation: UPRIGHT, speedKmh: 5, throttle: 1 })).toBeUndefined();
  });

  it("restarts the timer whenever the car moves", () => {
    const d = new RespawnDetector();
    run(d, 3.5, { rotation: UPRIGHT, speedKmh: 0, throttle: 1 });
    run(d, 0.1, { rotation: UPRIGHT, speedKmh: 4, throttle: 1 });
    expect(d.stuckSeconds).toBe(0);
    expect(run(d, 3.5, { rotation: UPRIGHT, speedKmh: 0, throttle: 1 })).toBeUndefined();
  });

  it("treats full reverse throttle as stuck too", () => {
    const d = new RespawnDetector();
    expect(run(d, 4.1, { rotation: UPRIGHT, speedKmh: 0, throttle: -1 })).toBe("stuck");
  });
});
