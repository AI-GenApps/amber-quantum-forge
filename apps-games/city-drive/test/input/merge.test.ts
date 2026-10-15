// @vitest-environment node
import { describe, expect, it } from "vitest";
import type { InputSource, PlayerInput } from "../../src/input";
import {
  CombinedInput,
  GamepadInput,
  mergeAll,
  mergeInputs,
  NO_INPUT,
  toCarInput,
} from "../../src/input";

const input = (p: Partial<PlayerInput>): PlayerInput => ({ ...NO_INPUT, ...p });

describe("mergeInputs", () => {
  it("lets the larger absolute value win on each axis", () => {
    const out = mergeInputs(
      input({ throttle: 0.4, steer: -0.9 }),
      input({ throttle: -1, steer: 0.5 }),
    );
    expect(out.throttle).toBe(-1);
    expect(out.steer).toBe(-0.9);
  });

  it("keeps the first value on a tie, and ORs the buttons", () => {
    const out = mergeInputs(
      input({ throttle: 1, handbrake: true }),
      input({ throttle: -1, reset: true }),
    );
    expect(out).toEqual({ throttle: 1, steer: 0, handbrake: true, reset: true });
  });

  it("keyboard steering and touch gas both come through", () => {
    const keyboard = input({ steer: 1 });
    const touch = input({ throttle: 1 });
    expect(mergeInputs(keyboard, touch)).toMatchObject({ throttle: 1, steer: 1 });
  });

  it("mergeAll of nothing is neutral", () => {
    expect(mergeAll([])).toEqual(NO_INPUT);
  });
});

describe("CombinedInput", () => {
  it("polls every source with the step length and merges them", () => {
    const seen: number[] = [];
    const a: InputSource = {
      read: (dt) => {
        seen.push(dt);
        return input({ throttle: 0.5 });
      },
      dispose: () => seen.push(-1),
    };
    const b: InputSource = { read: () => input({ throttle: 0.8, steer: 0.2 }), dispose: () => {} };
    const combined = new CombinedInput([a, b]);
    expect(combined.read(1 / 60)).toMatchObject({ throttle: 0.8, steer: 0.2 });
    expect(seen).toEqual([1 / 60]);
    combined.dispose();
    expect(seen).toContain(-1);
  });
});

describe("toCarInput", () => {
  it("passes every field through unchanged (the scene is right-handed like the simulation)", () => {
    expect(toCarInput(input({ throttle: 1, steer: 0.5, handbrake: true }))).toEqual({
      throttle: 1,
      steer: 0.5,
      handbrake: true,
    });
    expect(toCarInput(input({ throttle: -1, steer: -1 }))).toEqual({
      throttle: -1,
      steer: -1,
      handbrake: false,
    });
  });
});

describe("GamepadInput", () => {
  const pad = (axes: number[], pressed: number[] = [], values: Record<number, number> = {}) => ({
    axes,
    buttons: Array.from({ length: 8 }, (_, i) => ({
      pressed: pressed.includes(i),
      value: values[i] ?? (pressed.includes(i) ? 1 : 0),
    })),
  });

  it("is neutral with no pad", () => {
    expect(new GamepadInput(() => [null]).read()).toEqual(NO_INPUT);
  });

  it("maps stick, triggers, handbrake and reset (edge-triggered)", () => {
    let current = pad([0.8, 0]);
    const source = new GamepadInput(() => [current]);
    current = pad([0.8, 0], [], { 7: 0.75 });
    expect(source.read()).toMatchObject({ steer: 0.8, throttle: 0.75 });
    current = pad([0.05, 0], [6, 2]);
    expect(source.read()).toMatchObject({ steer: 0, throttle: -1, handbrake: true });
    current = pad([0, 0], [3]);
    expect(source.read().reset).toBe(true);
    expect(source.read().reset).toBe(false);
  });
});
