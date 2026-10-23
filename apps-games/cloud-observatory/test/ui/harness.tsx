import { injectKitStyles } from "@web-games/kit";
import { render } from "preact";
import { act } from "preact/test-utils";
import { App, type AppProps } from "../../src/App";
import type { FrameScheduler } from "../../src/app/game-loop";
import { type AppRouter, createAppRouter, type TabId } from "../../src/app/routes";
import type { Feedback, HapticKind, SfxId } from "../../src/ui/feedback";
import { injectAppStyles } from "../../src/ui/styles";
import { applyAppTheme } from "../../src/ui/tokens";
import {
  createHarness,
  type Harness,
  type HarnessOptions,
  type ProfileSeed,
} from "../session/harness";

export const SEEDS = {
  fresh: undefined,
  mid: {
    game: {
      starlight: 5000,
      cycleStarlight: 60000,
      lifetimeStarlight: 60000,
      taps: 40,
      owned: { telescope: 12, lens: 6, prism: 2 },
      upgrades: ["u-telescope-1"],
      charted: ["lyre", "crown"],
      achievements: ["telescope-row", "first-ink"],
    },
    stats: { taps: 40, charts: 2, activeSeconds: 900 },
    tutorial: { observe: true, build: true },
  },
  late: {
    game: {
      starlight: 2e9,
      cycleStarlight: 4e10,
      lifetimeStarlight: 9e10,
      taps: 900,
      shards: 20,
      shardsEarned: 40,
      eclipses: 2,
      owned: {
        telescope: 60,
        lens: 40,
        prism: 30,
        orrery: 25,
        "star-map": 20,
        beacon: 12,
        archive: 9,
        "aurora-coil": 5,
      },
      upgrades: ["u-telescope-1", "u-telescope-2", "u-lens-1"],
      charted: ["lyre", "crown", "key", "lantern", "whale", "harp", "fox", "archer"],
      boons: ["dark-adapted", "brass-polish", "clear-glass"],
      achievements: ["telescope-row", "lens-bench", "first-ink", "cartographer", "first-shadow"],
    },
    stats: { taps: 900, charts: 8, flawlessCharts: 3, eclipses: 2, activeSeconds: 40000 },
    profile: { cometStreak: 3, cometDays: 5, cometLastKey: "2026-10-22" },
  },
} satisfies Record<string, ProfileSeed | undefined>;

export type SeedName = keyof typeof SEEDS;

export interface RecordingFeedback extends Feedback {
  readonly sounds: SfxId[];
  readonly haptics: HapticKind[];
}

export function recordingFeedback(): RecordingFeedback {
  const sounds: SfxId[] = [];
  const haptics: HapticKind[] = [];
  return {
    sounds,
    haptics,
    sfx: (id) => void sounds.push(id),
    haptic: (kind) => void haptics.push(kind),
  };
}

export interface FakeFrames extends FrameScheduler {
  fire(timeMs: number): void;
  readonly pending: number;
}

export function fakeFrames(): FakeFrames {
  let nextId = 1;
  const callbacks = new Map<number, (timeMs: number) => void>();
  return {
    request(callback) {
      const id = nextId++;
      callbacks.set(id, callback);
      return id;
    },
    cancel(id) {
      callbacks.delete(id);
    },
    fire(timeMs) {
      const due = [...callbacks.entries()];
      callbacks.clear();
      for (const [, callback] of due) callback(timeMs);
    },
    get pending() {
      return callbacks.size;
    },
  };
}

export interface FakeLifecycle {
  readonly onPause: (listener: () => void) => () => void;
  readonly onResume: (listener: () => void) => () => void;
  readonly onBack: (handler: () => boolean) => () => void;
  pause(): void;
  resume(): void;
  back(): boolean;
}

export function fakeLifecycle(): FakeLifecycle {
  const pauses = new Set<() => void>();
  const resumes = new Set<() => void>();
  let backHandler: (() => boolean) | null = null;
  return {
    onPause: (listener) => {
      pauses.add(listener);
      return () => void pauses.delete(listener);
    },
    onResume: (listener) => {
      resumes.add(listener);
      return () => void resumes.delete(listener);
    },
    onBack: (handler) => {
      backHandler = handler;
      return () => {
        backHandler = null;
      };
    },
    pause: () => {
      for (const listener of [...pauses]) listener();
    },
    resume: () => {
      for (const listener of [...resumes]) listener();
    },
    back: () => backHandler?.() ?? false,
  };
}

export interface Rendered {
  readonly container: HTMLElement;
  readonly harness: Harness;
  readonly router: AppRouter;
  readonly feedback: RecordingFeedback;
  readonly frames: FakeFrames;
  readonly lifecycle: FakeLifecycle;
  q<T extends Element = HTMLElement>(selector: string): T;
  qa<T extends Element = HTMLElement>(selector: string): T[];
  click(target: Element | null): Promise<void>;
  flush(): Promise<void>;
  unmount(): Promise<void>;
}

export interface RenderOptions {
  seed?: SeedName | ProfileSeed;
  start?: "title" | "shell";
  tab?: TabId;
  props?: Partial<AppProps>;
  startMs?: number;
  harness?: HarnessOptions;
}

export async function renderApp(options: RenderOptions = {}): Promise<Rendered> {
  const seed = typeof options.seed === "string" ? SEEDS[options.seed] : options.seed;
  const harness = await createHarness({ ...(seed ? { seed } : {}), ...options.harness });
  const router = createAppRouter();
  if ((options.start ?? "shell") === "shell") router.reset("shell");
  const feedback = recordingFeedback();
  const frames = fakeFrames();
  const lifecycle = fakeLifecycle();
  injectKitStyles();
  injectAppStyles();
  applyAppTheme(false);
  const container = document.createElement("div");
  document.body.appendChild(container);
  await act(() =>
    render(
      <App
        session={harness.session}
        router={router}
        feedback={feedback}
        frames={frames}
        lifecycle={lifecycle}
        now={harness.clock.now}
        systemReducedMotion={() => false}
        {...options.props}
      />,
      container,
    ),
  );
  const flush = async () => {
    await act(async () => {
      await Promise.resolve();
    });
  };
  const rendered: Rendered = {
    container,
    harness,
    router,
    feedback,
    frames,
    lifecycle,
    q: <T extends Element = HTMLElement>(selector: string) => {
      const found = container.querySelector<T>(selector);
      if (!found) throw new Error(`Nothing matches ${selector}`);
      return found;
    },
    qa: <T extends Element = HTMLElement>(selector: string) =>
      Array.from(container.querySelectorAll<T>(selector)),
    click: async (target) => {
      if (!target) throw new Error("Cannot click a missing element");
      await act(() => {
        target.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
      });
    },
    flush,
    unmount: async () => {
      await act(() => render(null, container));
      container.remove();
    },
  };
  if (options.tab && options.tab !== "observe") {
    await rendered.click(rendered.q(`[role="tab"]:nth-child(${tabIndex(options.tab)})`));
  }
  return rendered;
}

function tabIndex(tab: TabId): number {
  return ["observe", "build", "atlas", "eclipse", "journal"].indexOf(tab) + 1;
}

export function cleanup(): void {
  document.body.replaceChildren();
}

export async function goTab(rendered: Rendered, tab: TabId): Promise<void> {
  await rendered.click(rendered.q(`[role="tab"]:nth-child(${tabIndex(tab)})`));
}

export async function openScreen(
  rendered: Rendered,
  name: "achievements" | "statistics" | "settings" | "howto" | "comet",
): Promise<void> {
  await act(() => {
    rendered.router.push(name);
  });
}
