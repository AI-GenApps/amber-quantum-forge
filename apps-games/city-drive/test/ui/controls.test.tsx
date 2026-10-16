// @vitest-environment happy-dom
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { render } from "preact";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { KeyboardInput, mergeInputs, TouchInput } from "../../src/input";
import { MIN_HIT_PX } from "../../src/ui/controls/HoldButton";
import { RotateOverlay } from "../../src/ui/controls/RotateOverlay";
import { TouchControls } from "../../src/ui/controls/TouchControls";

const DT = 1 / 60;
const CSS = readFileSync(join(import.meta.dirname, "../../src/ui/controls/controls.css"), "utf8");
let host: HTMLElement;
let touch: TouchInput;

function button(name: string): HTMLElement {
  const el = host.querySelector<HTMLElement>(`.cd-btn-${name}`);
  if (!el) throw new Error(`no ${name} button rendered`);
  return el;
}

function pointer(el: HTMLElement, type: string, pointerId: number): void {
  el.dispatchEvent(new PointerEvent(type, { pointerId, bubbles: true, cancelable: true }));
}

beforeEach(() => {
  host = document.createElement("div");
  document.body.appendChild(host);
  touch = new TouchInput();
  render(<TouchControls input={touch} />, host);
});

afterEach(() => {
  render(null, host);
  host.remove();
});

describe("touch controls overlay", () => {
  it("renders every control with an accessible name", () => {
    for (const name of ["left", "right", "gas", "brake", "handbrake", "reset"]) {
      expect(button(name).getAttribute("aria-label")).toBeTruthy();
    }
  });

  it("gives every button a hit area of at least 56 px and disables browser touch handling", () => {
    expect(MIN_HIT_PX).toBeGreaterThanOrEqual(56);
    for (const el of host.querySelectorAll<HTMLElement>(".cd-btn")) {
      expect(Number.parseInt(el.style.minWidth, 10)).toBeGreaterThanOrEqual(56);
      expect(Number.parseInt(el.style.minHeight, 10)).toBeGreaterThanOrEqual(56);
      expect(el.style.touchAction).toBe("none");
    }
    expect(CSS).toContain("touch-action: none");
  });

  it("holds a control while a pointer is down and releases it on pointer up", () => {
    pointer(button("gas"), "pointerdown", 1);
    expect(touch.read(DT).throttle).toBe(1);
    pointer(button("gas"), "pointerup", 1);
    expect(touch.read(DT).throttle).toBe(0);
  });

  it("supports multi-touch: steer with one finger while another holds gas", () => {
    pointer(button("right"), "pointerdown", 1);
    pointer(button("gas"), "pointerdown", 2);
    const both = touch.read(DT);
    expect(both.throttle).toBe(1);
    expect(both.steer).toBeGreaterThan(0);
    pointer(button("right"), "pointerup", 1);
    expect(touch.read(DT).throttle).toBe(1);
    pointer(button("gas"), "pointerup", 2);
    expect(touch.read(DT).throttle).toBe(0);
  });

  it("releases on pointercancel and on lost pointer capture", () => {
    pointer(button("brake"), "pointerdown", 4);
    expect(touch.read(DT).throttle).toBe(-1);
    pointer(button("brake"), "pointercancel", 4);
    expect(touch.read(DT).throttle).toBe(0);
    pointer(button("handbrake"), "pointerdown", 5);
    expect(touch.read(DT).handbrake).toBe(true);
    pointer(button("handbrake"), "lostpointercapture", 5);
    expect(touch.read(DT).handbrake).toBe(false);
  });

  it("two fingers on one button need both to lift", () => {
    pointer(button("gas"), "pointerdown", 1);
    pointer(button("gas"), "pointerdown", 2);
    pointer(button("gas"), "pointerup", 1);
    expect(touch.read(DT).throttle).toBe(1);
    pointer(button("gas"), "pointerup", 2);
    expect(touch.read(DT).throttle).toBe(0);
  });

  it("ramps steering instead of snapping, and returns to centre", () => {
    pointer(button("left"), "pointerdown", 1);
    const first = touch.read(DT).steer;
    expect(first).toBeLessThan(0);
    expect(first).toBeGreaterThan(-0.5);
    let steer = first;
    for (let i = 0; i < 30; i++) steer = touch.read(DT).steer;
    expect(steer).toBe(-1);
    pointer(button("left"), "pointerup", 1);
    const back = touch.read(DT).steer;
    expect(back).toBeGreaterThan(-1);
    for (let i = 0; i < 30; i++) touch.read(DT);
    expect(touch.read(DT).steer).toBe(0);
  });

  it("fires reset once per press", () => {
    pointer(button("reset"), "pointerdown", 1);
    expect(touch.read(DT).reset).toBe(true);
    expect(touch.read(DT).reset).toBe(false);
  });

  it("works together with the keyboard: larger absolute value wins", () => {
    const keyboard = new KeyboardInput(window);
    window.dispatchEvent(new KeyboardEvent("keydown", { code: "KeyA" }));
    pointer(button("gas"), "pointerdown", 1);
    const merged = mergeInputs(keyboard.read(), touch.read(DT));
    expect(merged.steer).toBe(-1);
    expect(merged.throttle).toBe(1);
    keyboard.dispose();
  });
});

describe("portrait guard and safe areas", () => {
  it("renders a rotate message that the stylesheet shows only in portrait", () => {
    const guard = document.createElement("div");
    render(<RotateOverlay />, guard);
    expect(guard.textContent).toContain("Rotate your device");
    expect(CSS).toMatch(/@media \(orientation: portrait\)\s*{\s*\.cd-rotate\s*{\s*display: flex/);
    expect(CSS).toMatch(/\.cd-rotate\s*{\s*display: none/);
    render(null, guard);
  });

  it("mirrors the layout when asked", () => {
    render(<TouchControls input={touch} layout="mirrored" />, host);
    expect(host.querySelector("[data-testid=touch-controls]")?.getAttribute("data-layout")).toBe(
      "mirrored",
    );
    expect(CSS).toContain('[data-layout="mirrored"]');
  });

  it("positions all clusters from the safe-area insets", () => {
    const tokens = readFileSync(join(import.meta.dirname, "../../src/ui/tokens.css"), "utf8");
    for (const inset of ["left", "right", "bottom", "top"]) {
      expect(tokens).toContain(`--inset-${inset}: env(safe-area-inset-${inset}`);
      expect(CSS).toContain(`var(--inset-${inset})`);
    }
  });
});
