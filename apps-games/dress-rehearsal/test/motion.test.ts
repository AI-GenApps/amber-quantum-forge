import type { Animatable } from "@web-games/kit";
import { describe, expect, it, vi } from "vitest";
import { STAR_STAGGER_MS } from "../src/audio/events";
import {
  CHIP_FRAMES,
  createGameMotion,
  FRAME_FADE_FRAMES,
  LANDING_FRAMES,
  meterFrames,
  SHEET_FRAMES,
  STAR_FRAMES,
} from "../src/motion/game";

function target() {
  const el = document.createElement("div");
  const animate = vi.fn((_frames: Keyframe[], _options: KeyframeAnimationOptions) => ({
    finished: Promise.resolve(),
    cancel: vi.fn(),
  }));
  (el as unknown as Animatable).animate = animate;
  return { el, animate };
}

describe("motion helpers with motion on", () => {
  it("animates each helper through the Web Animations API", async () => {
    const motion = createGameMotion(false);
    const { el, animate } = target();
    await motion.landingPop(el);
    await motion.chipFlip(el);
    await motion.meterEase(el, 10, 80);
    await motion.sheetSlide(el);
    await motion.frameFade(el);
    expect(animate).toHaveBeenCalledTimes(5);
    expect(animate.mock.calls[0]?.[0]).toEqual(LANDING_FRAMES);
    expect(animate.mock.calls[1]?.[0]).toEqual(CHIP_FRAMES);
    expect(animate.mock.calls[2]?.[0]).toEqual(meterFrames(10, 80));
    expect(animate.mock.calls[3]?.[0]).toEqual(SHEET_FRAMES);
    expect(animate.mock.calls[4]?.[0]).toEqual(FRAME_FADE_FRAMES);
  });

  it("staggers the star reveal by 120 ms", async () => {
    const motion = createGameMotion(false);
    const stars = [target(), target(), target()];
    await motion.starReveal(stars.map((entry) => entry.el));
    const delays = stars.map((entry) => entry.animate.mock.calls[0]?.[1].delay);
    expect(delays).toEqual([0, STAR_STAGGER_MS, STAR_STAGGER_MS * 2]);
    expect(STAR_STAGGER_MS).toBe(120);
  });

  it("clamps the meter scale between empty and full", () => {
    expect(meterFrames(-5, 140)).toEqual([{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }]);
  });
});

describe("motion helpers with reduced motion", () => {
  it("applies the final frame and never calls animate", async () => {
    const motion = createGameMotion(true);
    expect(motion.reduced).toBe(true);
    const { el, animate } = target();
    await motion.landingPop(el);
    expect(el.style.getPropertyValue("transform")).toBe("scale(1)");
    await motion.chipFlip(el);
    expect(el.style.getPropertyValue("transform")).toBe("rotateX(0deg)");
    expect(el.style.getPropertyValue("opacity")).toBe("1");
    await motion.meterEase(el, 0, 70);
    expect(el.style.getPropertyValue("transform")).toBe("scaleX(0.7)");
    await motion.sheetSlide(el);
    expect(el.style.getPropertyValue("transform")).toBe("translateY(0)");
    await motion.frameFade(el);
    expect(el.style.getPropertyValue("opacity")).toBe("1");
    const stars = [target(), target()];
    await motion.starReveal(stars.map((entry) => entry.el));
    for (const entry of stars) {
      expect(entry.animate).not.toHaveBeenCalled();
      expect(entry.el.style.getPropertyValue("opacity")).toBe("1");
      expect(entry.el.style.getPropertyValue("transform")).toBe("scale(1) rotate(0deg)");
    }
    expect(animate).not.toHaveBeenCalled();
    expect(STAR_FRAMES.at(-1)).toEqual({ transform: "scale(1) rotate(0deg)", opacity: 1 });
  });

  it("follows a live source", async () => {
    let reduced = true;
    const motion = createGameMotion(() => reduced);
    const { el, animate } = target();
    await motion.landingPop(el);
    expect(animate).not.toHaveBeenCalled();
    reduced = false;
    await motion.landingPop(el);
    expect(animate).toHaveBeenCalledTimes(1);
  });
});
