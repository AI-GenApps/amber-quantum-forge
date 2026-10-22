import { describe, expect, it, type Mock, vi } from "vitest";
import { applyFinalFrame, createMotion, easings, springEasing } from "./motion";

interface FakeAnimation {
  finished: Promise<unknown>;
  cancel: Mock<() => void>;
}

function fakeTarget(animation?: Partial<FakeAnimation>) {
  const style = document.createElement("div").style;
  const created: FakeAnimation = {
    finished: Promise.resolve(),
    cancel: vi.fn<() => void>(),
    ...animation,
  };
  const animate = vi.fn((_k: Keyframe[], _t: KeyframeAnimationOptions) => created);
  return { style, animate, created } as const;
}

const frames: Keyframe[] = [
  { opacity: 0, transform: "scale(0.5)" },
  { opacity: 1, transform: "scale(1)", backgroundColor: "red", offset: 1 },
];

describe("springEasing", () => {
  it("produces a linear() easing that starts at 0 and ends at 1", () => {
    const { easing, duration } = springEasing();
    expect(easing).toMatch(/^linear\(0, .*, 1\)$/);
    expect(duration).toBeGreaterThan(100);
    expect(duration).toBeLessThan(5000);
  });

  it("underdamped springs overshoot, critically damped ones do not", () => {
    const peak = (easing: string) => Math.max(...easing.slice(7, -1).split(", ").map(Number));
    expect(peak(springEasing({ damping: 8 }).easing)).toBeGreaterThan(1);
    expect(peak(springEasing({ damping: 2 * Math.sqrt(170) }).easing)).toBeLessThanOrEqual(1);
  });

  it("is deterministic and honours the sample count", () => {
    expect(springEasing({ samples: 10 })).toEqual(springEasing({ samples: 10 }));
    expect(springEasing({ samples: 10 }).easing.split(", ")).toHaveLength(11);
  });

  it("stiffer springs settle faster", () => {
    expect(springEasing({ stiffness: 400 }).duration).toBeLessThan(
      springEasing({ stiffness: 100 }).duration,
    );
  });
});

describe("applyFinalFrame", () => {
  it("copies the last keyframe to inline style as kebab-case properties", () => {
    const { style } = fakeTarget();
    applyFinalFrame({ style }, frames);
    expect(style.getPropertyValue("opacity")).toBe("1");
    expect(style.getPropertyValue("transform")).toBe("scale(1)");
    expect(style.getPropertyValue("background-color")).toBe("red");
  });

  it("ignores an empty keyframe list", () => {
    const { style } = fakeTarget();
    applyFinalFrame({ style }, []);
    expect(style.length).toBe(0);
  });
});

describe("createMotion", () => {
  it("runs Element.animate with the tween defaults and commits the final frame", async () => {
    const target = fakeTarget();
    await createMotion().tween(target, frames);
    expect(target.animate).toHaveBeenCalledWith(frames, {
      duration: 250,
      delay: 0,
      easing: easings.easeOut,
      fill: "both",
    });
    expect(target.style.getPropertyValue("opacity")).toBe("1");
    expect(target.created.cancel).toHaveBeenCalled();
  });

  it("passes custom timing through", async () => {
    const target = fakeTarget();
    await createMotion().tween(target, frames, {
      duration: 90,
      delay: 10,
      easing: easings.linear,
      fill: "forwards",
    });
    expect(target.animate).toHaveBeenCalledWith(frames, {
      duration: 90,
      delay: 10,
      easing: "linear",
      fill: "forwards",
    });
  });

  it("uses the spring easing and duration for springs", async () => {
    const target = fakeTarget();
    await createMotion().spring(target, frames, { stiffness: 300, delay: 5 });
    const expected = springEasing({ stiffness: 300 });
    expect(target.animate).toHaveBeenCalledWith(frames, {
      duration: expected.duration,
      delay: 5,
      easing: expected.easing,
      fill: "both",
    });
  });

  it("skips animation and jumps to the final frame when motion is reduced", async () => {
    const target = fakeTarget();
    const motion = createMotion(true);
    await motion.tween(target, frames);
    await motion.spring(target, frames);
    expect(target.animate).not.toHaveBeenCalled();
    expect(target.style.getPropertyValue("opacity")).toBe("1");
    expect(motion.reduced).toBe(true);
  });

  it("re-reads a reduced-motion getter on every call", async () => {
    let reduced = false;
    const motion = createMotion(() => reduced);
    const target = fakeTarget();
    await motion.tween(target, frames);
    expect(target.animate).toHaveBeenCalledTimes(1);
    reduced = true;
    await motion.tween(target, frames);
    expect(target.animate).toHaveBeenCalledTimes(1);
    expect(motion.reduced).toBe(true);
  });

  it("falls back to the final frame when Element.animate is missing", async () => {
    const style = document.createElement("div").style;
    await createMotion().tween({ style }, frames);
    expect(style.getPropertyValue("opacity")).toBe("1");
  });

  it("resolves quietly when the animation is cancelled", async () => {
    const target = fakeTarget({ finished: Promise.reject(new Error("AbortError")) });
    await expect(createMotion().tween(target, frames)).resolves.toBeUndefined();
    expect(target.style.getPropertyValue("opacity")).toBe("");
  });
});
