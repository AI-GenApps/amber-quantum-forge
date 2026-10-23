import { describe, expect, it, vi } from "vitest";
import { STAR_STAGGER_MS } from "../src/audio/events";
import {
  BADGE_FRAMES,
  createGameMotion,
  POP_FRAMES,
  PULSE_FRAMES,
  SHEET_FRAMES,
  STAR_FRAMES,
} from "../src/motion/game";

function target() {
  const element = document.createElement("div");
  const animate = vi.fn((_frames: Keyframe[], _timing: KeyframeAnimationOptions) => ({
    finished: Promise.resolve(),
    cancel: () => undefined,
  }));
  Object.assign(element, { animate });
  return { element, animate };
}

type Run = (motion: ReturnType<typeof createGameMotion>, el: HTMLElement) => Promise<void>;

const helpers: Array<{ name: string; run: Run; frames: Keyframe[] }> = [
  { name: "placementPop", run: (m, el) => m.placementPop(el), frames: POP_FRAMES },
  { name: "badgePop", run: (m, el) => m.badgePop(el), frames: BADGE_FRAMES },
  { name: "sheetSlide", run: (m, el) => m.sheetSlide(el), frames: SHEET_FRAMES },
  { name: "starReveal", run: (m, el) => m.starReveal([el]), frames: STAR_FRAMES },
  { name: "weekPulse", run: (m, el) => m.weekPulse(el), frames: PULSE_FRAMES },
];

describe("motion helpers with reduced motion", () => {
  for (const helper of helpers) {
    it(`${helper.name} applies the final frame and never calls animate`, async () => {
      const { element, animate } = target();
      const motion = createGameMotion(true);
      expect(motion.reduced).toBe(true);
      await helper.run(motion, element);
      expect(animate).not.toHaveBeenCalled();
      const last = helper.frames[helper.frames.length - 1] as Record<string, string | number>;
      for (const [key, value] of Object.entries(last)) {
        const css = key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
        expect(element.style.getPropertyValue(css), `${helper.name} ${key}`).toBe(String(value));
      }
    });
  }

  it("reveals every earned star at once", async () => {
    const stars = [target(), target(), target()];
    await createGameMotion(true).starReveal(stars.map((entry) => entry.element));
    for (const star of stars) {
      expect(star.animate).not.toHaveBeenCalled();
      expect(star.element.style.opacity).toBe("1");
    }
  });

  it("follows a function source so the setting can change at runtime", async () => {
    let reduced = true;
    const motion = createGameMotion(() => reduced);
    const { element, animate } = target();
    await motion.weekPulse(element);
    expect(animate).not.toHaveBeenCalled();
    reduced = false;
    await motion.weekPulse(element);
    expect(animate).toHaveBeenCalledTimes(1);
  });
});

describe("motion helpers with full motion", () => {
  it("animates each helper once with its keyframes", async () => {
    for (const helper of helpers) {
      const { element, animate } = target();
      await helper.run(createGameMotion(false), element);
      expect(animate, helper.name).toHaveBeenCalledTimes(1);
      expect(animate.mock.calls[0]?.[0], helper.name).toEqual(helper.frames);
    }
  });

  it("staggers the star reveal by 120 ms", async () => {
    const stars = [target(), target(), target()];
    await createGameMotion(false).starReveal(stars.map((entry) => entry.element));
    const delays = stars.map((entry) => {
      return entry.animate.mock.calls[0]?.[1].delay;
    });
    expect(delays).toEqual([0, STAR_STAGGER_MS, STAR_STAGGER_MS * 2]);
  });

  it("falls back to the final frame where animate is missing", async () => {
    const element = document.createElement("div");
    await createGameMotion(false).sheetSlide(element);
    expect(element.style.opacity).toBe("1");
  });
});
