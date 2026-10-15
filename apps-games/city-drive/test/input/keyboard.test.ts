// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from "vitest";
import { KeyboardInput } from "../../src/input";

let keyboard: KeyboardInput | undefined;

function key(type: "keydown" | "keyup", code: string, repeat = false): void {
  window.dispatchEvent(new KeyboardEvent(type, { code, repeat, cancelable: true }));
}

function make(): KeyboardInput {
  keyboard = new KeyboardInput(window);
  return keyboard;
}

afterEach(() => keyboard?.dispose());

describe("KeyboardInput", () => {
  it("is neutral with nothing pressed", () => {
    expect(make().read()).toEqual({ throttle: 0, steer: 0, handbrake: false, reset: false });
  });

  it("maps WASD and the arrow keys", () => {
    const input = make();
    key("keydown", "KeyW");
    expect(input.read().throttle).toBe(1);
    key("keyup", "KeyW");
    key("keydown", "ArrowDown");
    expect(input.read().throttle).toBe(-1);
    key("keyup", "ArrowDown");
    key("keydown", "KeyA");
    expect(input.read().steer).toBe(-1);
    key("keyup", "KeyA");
    key("keydown", "ArrowRight");
    expect(input.read().steer).toBe(1);
  });

  it("cancels opposing keys and combines gas with steering", () => {
    const input = make();
    key("keydown", "KeyW");
    key("keydown", "KeyS");
    key("keydown", "KeyD");
    key("keydown", "ArrowLeft");
    const out = input.read();
    expect(out.throttle).toBe(0);
    expect(out.steer).toBe(0);
    key("keyup", "KeyS");
    key("keyup", "ArrowLeft");
    expect(input.read()).toMatchObject({ throttle: 1, steer: 1 });
  });

  it("holds the handbrake on Space only while it is down", () => {
    const input = make();
    key("keydown", "Space");
    expect(input.read().handbrake).toBe(true);
    key("keyup", "Space");
    expect(input.read().handbrake).toBe(false);
  });

  it("reports reset once per press, not while held or on key repeat", () => {
    const input = make();
    key("keydown", "KeyR");
    expect(input.read().reset).toBe(true);
    expect(input.read().reset).toBe(false);
    key("keydown", "KeyR", true);
    expect(input.read().reset).toBe(false);
    key("keyup", "KeyR");
    key("keydown", "KeyR");
    expect(input.read().reset).toBe(true);
  });

  it("releases everything when the window loses focus", () => {
    const input = make();
    key("keydown", "KeyW");
    key("keydown", "Space");
    window.dispatchEvent(new Event("blur"));
    expect(input.read()).toMatchObject({ throttle: 0, handbrake: false });
  });

  it("prevents the default action of handled keys only", () => {
    make();
    const space = new KeyboardEvent("keydown", { code: "Space", cancelable: true });
    const other = new KeyboardEvent("keydown", { code: "KeyQ", cancelable: true });
    window.dispatchEvent(space);
    window.dispatchEvent(other);
    expect(space.defaultPrevented).toBe(true);
    expect(other.defaultPrevented).toBe(false);
  });

  it("stops listening after dispose", () => {
    const input = make();
    input.dispose();
    key("keydown", "KeyW");
    expect(input.read().throttle).toBe(0);
  });
});
