import type { Animatable, AnimationLike } from "@web-games/kit";
import { describe, expect, it } from "vitest";
import {
  createGameMotion,
  FLIP_FRAMES,
  LINK_FRAMES,
  PICK_FRAMES,
  PIN_FRAMES,
  STAMP_FRAMES,
  STAMP_ICON_FRAMES,
  TOAST_FRAMES,
} from "../src/motion/game";
import {
  FLIP_MS,
  STAMP_FALL_MS,
  STAMP_STAGGER_MS,
  TYPEWRITER_CPS,
  TYPEWRITER_MS_PER_CHAR,
} from "../src/motion/timing";

interface Call {
  keyframes: Keyframe[];
  options: KeyframeAnimationOptions;
}

function target(withAnimate = true): Animatable & { calls: Call[]; el: HTMLElement } {
  const el = document.createElement("div");
  const calls: Call[] = [];
  const animate = (keyframes: Keyframe[], options: KeyframeAnimationOptions): AnimationLike => {
    calls.push({ keyframes, options });
    return { finished: Promise.resolve(), cancel: () => undefined };
  };
  return Object.assign(el, { calls, el, ...(withAnimate ? { animate } : {}) }) as never;
}

const helpers = [
  ["pickUp", PICK_FRAMES],
  ["flip", FLIP_FRAMES],
  ["pinDrop", PIN_FRAMES],
  ["linkDraw", LINK_FRAMES],
  ["stampFall", STAMP_FRAMES],
  ["toastSlide", TOAST_FRAMES],
] as const;

describe("reduced motion", () => {
  it.each(helpers)("%s applies the final frame without calling animate", async (name, frames) => {
    const motion = createGameMotion(true);
    const el = target();
    await motion[name](el);
    expect(el.calls).toHaveLength(0);
    const last = frames[frames.length - 1] ?? {};
    for (const key of Object.keys(last)) {
      if (key === "offset" || key === "transformOrigin") continue;
      const css = key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
      expect(el.style.getPropertyValue(css), `${name} ${css}`).not.toBe("");
    }
  });

  it("reveals every stamp icon at once", async () => {
    const motion = createGameMotion(true);
    const icons = [target(), target(), target()];
    await motion.stampReveal(icons);
    for (const icon of icons) {
      expect(icon.calls).toHaveLength(0);
      expect(icon.el.style.opacity).toBe("1");
      expect(icon.el.style.transform).toBe("scale(1)");
    }
  });

  it("follows a reduced-motion source read at call time", async () => {
    let reduced = false;
    const motion = createGameMotion(() => reduced);
    const first = target();
    await motion.flip(first);
    expect(first.calls).toHaveLength(1);
    reduced = true;
    const second = target();
    await motion.flip(second);
    expect(second.calls).toHaveLength(0);
    expect(motion.reduced).toBe(true);
  });

  it("falls back to the final frame when animate is missing", async () => {
    const motion = createGameMotion(false);
    const el = target(false);
    await motion.pinDrop(el);
    expect(el.style.opacity).toBe("1");
  });
});

describe("full motion", () => {
  it.each(helpers)("%s animates with its keyframes", async (name, frames) => {
    const motion = createGameMotion(false);
    const el = target();
    await motion[name](el);
    expect(el.calls).toHaveLength(1);
    expect(el.calls[0]?.keyframes).toEqual(frames);
  });

  it("flips in 420 ms and drops the stamp in 520 ms", async () => {
    const motion = createGameMotion(false);
    const flip = target();
    await motion.flip(flip);
    expect(flip.calls[0]?.options.duration).toBe(FLIP_MS);
    expect(FLIP_MS).toBe(420);
    const stamp = target();
    await motion.stampFall(stamp);
    expect(stamp.calls[0]?.options.duration).toBe(STAMP_FALL_MS);
    expect(STAMP_FALL_MS).toBe(520);
  });

  it("falls, thuds and bounces slightly", () => {
    expect(STAMP_FRAMES.length).toBe(4);
    expect(STAMP_FRAMES[1]?.offset).toBeLessThan(STAMP_FRAMES[2]?.offset ?? 0);
    expect(String(STAMP_FRAMES[2]?.transform)).toContain("translateY(-6px)");
  });

  it("staggers the earned stamps by 140 ms", async () => {
    const motion = createGameMotion(false);
    const icons = [target(), target(), target()];
    await motion.stampReveal(icons);
    expect(icons.map((icon) => icon.calls[0]?.options.delay)).toEqual([0, 140, 280]);
    expect(STAMP_STAGGER_MS).toBe(140);
    expect(icons[0]?.calls[0]?.keyframes).toEqual(STAMP_ICON_FRAMES);
  });
});

describe("typewriter pace", () => {
  it("is about 40 characters per second", () => {
    expect(TYPEWRITER_CPS).toBe(40);
    expect(TYPEWRITER_MS_PER_CHAR).toBe(25);
  });
});
