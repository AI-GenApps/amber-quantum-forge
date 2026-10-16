// @vitest-environment node
import { FIXED_DT } from "@city-drive/core";
import { afterEach, describe, expect, it } from "vitest";
import { SKID_START_MPS } from "../../src/audio/mapping";
import type { GameSession } from "../../src/game/session";
import { createSession, ScriptedInput } from "./helpers";

let active: GameSession | undefined;

afterEach(() => {
  active?.dispose();
  active = undefined;
});

async function make(): Promise<{ session: GameSession; input: ScriptedInput }> {
  const input = new ScriptedInput();
  const session = await createSession(input);
  active = session;
  return { session, input };
}

function run(session: GameSession, seconds: number): void {
  for (let i = 0; i < Math.round(seconds / FIXED_DT); i++) session.step();
}

describe("GameSession step report", () => {
  it("is empty before the first step, then follows the input and the car", async () => {
    const { session, input } = await make();
    expect(session.lastReport).toBeUndefined();
    input.set({ throttle: 1 });
    run(session, 3);
    const report = session.lastReport;
    expect(report?.input.throttle).toBe(1);
    expect(report?.speedKmh).toBeCloseTo(session.state.speedKmh, 5);
    expect(report?.speedKmh ?? 0).toBeGreaterThan(20);
    expect(report?.topSpeedKmh).toBe(session.car.spec.topSpeedKmh);
    expect(report?.impactNs).toBe(0);
    expect(report?.slipMps ?? 99).toBeLessThan(SKID_START_MPS);
  });

  it("exposes sideways slip when the car is thrown into a handbrake turn", async () => {
    const { session, input } = await make();
    input.set({ throttle: 1 });
    run(session, 2.5);
    input.set({ throttle: 1, steer: 1, handbrake: true });
    let peak = 0;
    for (let i = 0; i < 90; i++) {
      session.step();
      peak = Math.max(peak, session.lastReport?.slipMps ?? 0);
    }
    expect(peak).toBeGreaterThan(SKID_START_MPS);
  });

  it("reports an impact when the car hits something solid", async () => {
    const { session, input } = await make();
    input.set({ throttle: 1 });
    let hardest = 0;
    for (let i = 0; i < 60 * 40 && hardest === 0; i++) {
      session.step();
      hardest = Math.max(hardest, session.lastReport?.impactNs ?? 0);
      if (i % 120 === 119) input.set({ throttle: 1, steer: i % 240 === 119 ? 1 : -1 });
    }
    expect(hardest).toBeGreaterThan(0);
  });

  it("is deterministic: the same input gives the same reports", async () => {
    const a = await make();
    const reportsA: string[] = [];
    a.input.set({ throttle: 1, steer: 0.3 });
    for (let i = 0; i < 240; i++) {
      a.session.step();
      reportsA.push(JSON.stringify(a.session.lastReport));
    }
    a.session.dispose();
    const b = await make();
    b.input.set({ throttle: 1, steer: 0.3 });
    for (let i = 0; i < 240; i++) {
      b.session.step();
      expect(JSON.stringify(b.session.lastReport)).toBe(reportsA[i]);
    }
  });
});
