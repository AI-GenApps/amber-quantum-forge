import {
  createMemoryAdapter,
  createMotion,
  createRouter,
  injectKitStyles,
  type MemoryAdapter,
  type Router,
  type Settings,
  type ShareContent,
  type ShareResult,
} from "@web-games/kit";
import { CAMPAIGN } from "@web-games/lantern-loops-core";
import { type ComponentChild, render } from "preact";
import { act } from "preact/test-utils";
import { vi } from "vitest";
import { App } from "../../src/App";
import { AppContext, type AppEnv } from "../../src/app/AppContext";
import type { Routes } from "../../src/app/routes";
import { defaults, PROFILE_KEY, PROFILE_VERSION, type Profile } from "../../src/save/profile";
import { createServices } from "../../src/services";
import { injectGameStyles } from "../../src/theme/styles";

/** A Monday, so the daily is the small 5x5 board. */
export const MONDAY = new Date(2026, 9, 19, 12, 0, 0);
export const MONDAY_KEY = "2026-10-19";

export type Fixture = "fresh" | "mid" | "finished";

export function profileFixture(kind: Fixture): Profile {
  const base = defaults();
  if (kind === "fresh") return base;
  if (kind === "mid") {
    const stars: Record<string, number> = {};
    for (const record of CAMPAIGN.filter((r) => r.chapter === "harbor")) stars[record.id] = 2;
    return {
      ...base,
      stars,
      bestTimes: { "harbor-01": 40 },
      tokens: 7,
      streak: 4,
      bestStreak: 6,
      lastDailyDate: "2026-10-18",
      freezeWeek: "2026-W43",
      dailiesSolved: {
        "2026-10-17": { stars: 3, seconds: 90 },
        "2026-10-18": { stars: 2, seconds: 120 },
      },
      chaptersCleared: ["harbor"],
      onboardingDone: true,
      hintsUsed: 5,
      playSeconds: 4000,
    };
  }
  const stars: Record<string, number> = {};
  for (const record of CAMPAIGN) stars[record.id] = 3;
  return {
    ...base,
    stars,
    tokens: 20,
    streak: 31,
    bestStreak: 31,
    lastDailyDate: "2026-10-18",
    freezeWeek: "2026-W43",
    chaptersCleared: ["harbor", "garden", "bridge", "sky"],
    dailiesSolved: { [MONDAY_KEY]: { stars: 3, seconds: 70 } },
    onboardingDone: true,
  };
}

export interface FakeLifecycle {
  onPause(fn: () => void): () => void;
  onResume(fn: () => void): () => void;
  onBack(handler: () => boolean, options?: { onExit?: () => void }): () => void;
  pause(): void;
  resume(): void;
  /** Mimics the Android back button routing of the kit lifecycle. */
  pressBack(): void;
}

export function fakeLifecycle(): FakeLifecycle {
  const pauses = new Set<() => void>();
  const resumes = new Set<() => void>();
  let back: { handler: () => boolean; onExit?: (() => void) | undefined } | null = null;
  return {
    onPause: (fn) => {
      pauses.add(fn);
      return () => void pauses.delete(fn);
    },
    onResume: (fn) => {
      resumes.add(fn);
      return () => void resumes.delete(fn);
    },
    onBack: (handler, options) => {
      back = { handler, onExit: options?.onExit };
      return () => {
        back = null;
      };
    },
    pause: () => {
      for (const fn of [...pauses]) fn();
    },
    resume: () => {
      for (const fn of [...resumes]) fn();
    },
    pressBack: () => {
      if (back === null) return;
      if (!back.handler()) back.onExit?.();
    },
  };
}

export interface TestEnvOptions {
  fixture?: Fixture;
  profile?: Partial<Profile>;
  settings?: Partial<Settings>;
  now?: Date;
  /** Read the (possibly fake) system clock instead of a fixed date. */
  liveClock?: boolean;
  route?: {
    [K in keyof Routes]: Routes[K] extends undefined ? { name: K } : { name: K; params: Routes[K] };
  }[keyof Routes];
}

export interface TestEnv {
  env: AppEnv;
  adapter: MemoryAdapter;
  lifecycle: FakeLifecycle;
  router: Router<Routes>;
  shares: ShareContent[];
  exits: number[];
  animate: ReturnType<typeof vi.fn>;
}

/** Installs a counting `Element.animate` so tests can assert whether motion ran. */
export function installAnimate(): ReturnType<typeof vi.fn> {
  const animate = vi.fn(() => ({ finished: Promise.resolve(), cancel: () => undefined }));
  Object.defineProperty(Element.prototype, "animate", {
    value: animate,
    configurable: true,
    writable: true,
  });
  return animate;
}

export function removeAnimate(): void {
  Reflect.deleteProperty(Element.prototype, "animate");
}

export async function createTestEnv(options: TestEnvOptions = {}): Promise<TestEnv> {
  const profile = { ...profileFixture(options.fixture ?? "fresh"), ...options.profile };
  const adapter = createMemoryAdapter({
    [PROFILE_KEY]: JSON.stringify({ v: PROFILE_VERSION, data: profile }),
    ...(options.settings
      ? {
          "lantern-loops.settings": JSON.stringify({
            v: 1,
            data: {
              sound: true,
              music: true,
              haptics: true,
              reducedMotion: false,
              highContrast: false,
              ...options.settings,
            },
          }),
        }
      : {}),
  });
  const now = options.now ?? MONDAY;
  const services = createServices({
    adapter,
    now: options.liveClock ? () => new Date() : () => now,
  });
  await services.start();
  const animate = installAnimate();
  const router = createRouter<Routes>("home");
  if (options.route) {
    const { name, ...rest } = options.route as { name: keyof Routes; params?: unknown };
    (router.reset as (n: string, p?: unknown) => void)(name, rest.params);
  }
  const lifecycle = fakeLifecycle();
  const shares: ShareContent[] = [];
  const exits: number[] = [];
  const env: AppEnv = {
    services,
    router,
    motion: createMotion(() => services.settings.effectiveReducedMotion(false)),
    lifecycle,
    share: async (content): Promise<ShareResult> => {
      shares.push(content);
      return { path: "clipboard", ok: true, cancelled: false };
    },
    boot: async (onProgress) => {
      onProgress(1);
    },
    exitApp: () => void exits.push(1),
  };
  return { env, adapter, lifecycle, router, shares, exits, animate };
}

export interface Mounted {
  container: HTMLElement;
  unmount(): void;
}

export async function flush(times = 4): Promise<void> {
  for (let i = 0; i < times; i++) {
    await act(async () => {
      await Promise.resolve();
    });
  }
}

export async function mountApp(env: AppEnv): Promise<Mounted> {
  injectKitStyles();
  injectGameStyles();
  const container = document.createElement("div");
  document.body.appendChild(container);
  await act(() => render(<App env={env} />, container));
  await flush();
  return {
    container,
    unmount: () => {
      render(null, container);
      container.remove();
    },
  };
}

export async function mountWithEnv(env: AppEnv, vnode: ComponentChild): Promise<Mounted> {
  injectKitStyles();
  injectGameStyles();
  const container = document.createElement("div");
  document.body.appendChild(container);
  await act(() =>
    render(<AppContext.Provider value={env}>{vnode}</AppContext.Provider>, container),
  );
  await flush();
  return {
    container,
    unmount: () => {
      render(null, container);
      container.remove();
    },
  };
}

export async function click(el: Element | null): Promise<void> {
  if (!el) throw new Error("click target missing");
  await act(() => {
    el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
  });
  await flush();
}

export function byText(root: ParentNode, selector: string, text: string): HTMLElement | null {
  return (
    Array.from(root.querySelectorAll<HTMLElement>(selector)).find((el) =>
      (el.textContent ?? "").includes(text),
    ) ?? null
  );
}
