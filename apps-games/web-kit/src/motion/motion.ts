export const easings = {
  linear: "linear",
  easeOut: "cubic-bezier(0.16, 1, 0.3, 1)",
  easeIn: "cubic-bezier(0.7, 0, 0.84, 0)",
  easeInOut: "cubic-bezier(0.65, 0, 0.35, 1)",
  overshoot: "cubic-bezier(0.34, 1.56, 0.64, 1)",
} as const;

export interface MotionOptions {
  duration?: number;
  delay?: number;
  easing?: string;
  fill?: FillMode;
}

export interface SpringOptions {
  stiffness?: number;
  damping?: number;
  mass?: number;
  samples?: number;
}

export interface SpringEasing {
  easing: string;
  /** Milliseconds until the spring is within 0.1% of its target. */
  duration: number;
}

export interface Motion {
  readonly reduced: boolean;
  tween(target: Animatable, keyframes: Keyframe[], options?: MotionOptions): Promise<void>;
  spring(
    target: Animatable,
    keyframes: Keyframe[],
    options?: SpringOptions & Pick<MotionOptions, "delay" | "fill">,
  ): Promise<void>;
}

export interface AnimationLike {
  readonly finished: Promise<unknown>;
  cancel(): void;
}

export interface Animatable {
  readonly style: CSSStyleDeclaration;
  animate?(keyframes: Keyframe[], options: KeyframeAnimationOptions): AnimationLike;
}

export type ReducedMotionSource = boolean | (() => boolean);

const NON_STYLE_KEYS = new Set(["offset", "easing", "composite", "computedOffset"]);

const kebab = (name: string): string =>
  name === "cssFloat" ? "float" : name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

/** Applies the last keyframe as inline style; used when motion is reduced or unsupported. */
export function applyFinalFrame(target: Pick<HTMLElement, "style">, keyframes: Keyframe[]): void {
  const last = keyframes[keyframes.length - 1];
  if (!last) return;
  for (const [key, value] of Object.entries(last)) {
    if (NON_STYLE_KEYS.has(key) || value === null || value === undefined) continue;
    target.style.setProperty(kebab(key), String(value));
  }
}

/**
 * Samples a damped spring (0 to 1) into a CSS `linear()` easing so it can run on the compositor
 * through the Web Animations API.
 */
export function springEasing(options: SpringOptions = {}): SpringEasing {
  const { stiffness = 170, damping = 18, mass = 1, samples = 40 } = options;
  const omega = Math.sqrt(stiffness / mass);
  const zeta = damping / (2 * Math.sqrt(stiffness * mass));
  const position = (t: number): number => {
    if (zeta < 1) {
      const wd = omega * Math.sqrt(1 - zeta * zeta);
      return (
        1 -
        Math.exp(-zeta * omega * t) * (Math.cos(wd * t) + ((zeta * omega) / wd) * Math.sin(wd * t))
      );
    }
    return 1 - Math.exp(-omega * t) * (1 + omega * t);
  };
  let settle = 0.05;
  const limit = 10;
  for (let t = 0.05; t < limit; t += 0.05) {
    if (Math.abs(1 - position(t)) > 0.001) settle = t + 0.05;
  }
  const count = Math.max(2, Math.floor(samples));
  const points: string[] = [];
  for (let i = 0; i <= count; i++) {
    const value = i === count ? 1 : position((settle * i) / count);
    points.push(String(Math.round(value * 1000) / 1000));
  }
  return { easing: `linear(${points.join(", ")})`, duration: Math.round(settle * 1000) };
}

const resolveReduced = (source: ReducedMotionSource): boolean =>
  typeof source === "function" ? source() : source;

/**
 * Tween and spring helpers over `Element.animate`. When motion is reduced, or `animate` is missing,
 * the final frame is applied immediately and the promise resolves at once.
 */
export function createMotion(reducedMotion: ReducedMotionSource = false): Motion {
  const run = async (
    target: Animatable,
    keyframes: Keyframe[],
    timing: KeyframeAnimationOptions,
  ): Promise<void> => {
    if (resolveReduced(reducedMotion) || typeof target.animate !== "function") {
      applyFinalFrame(target, keyframes);
      return;
    }
    const animation = target.animate(keyframes, timing);
    try {
      await animation.finished;
    } catch {
      return;
    }
    applyFinalFrame(target, keyframes);
    animation.cancel();
  };

  return {
    get reduced() {
      return resolveReduced(reducedMotion);
    },
    tween(target, keyframes, options = {}) {
      const { duration = 250, delay = 0, easing = easings.easeOut, fill = "both" } = options;
      return run(target, keyframes, { duration, delay, easing, fill });
    },
    spring(target, keyframes, options = {}) {
      const { delay = 0, fill = "both", ...springOptions } = options;
      const { easing, duration } = springEasing(springOptions);
      return run(target, keyframes, { duration, delay, easing, fill });
    },
  };
}
