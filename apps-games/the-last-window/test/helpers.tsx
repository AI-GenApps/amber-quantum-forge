import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  createMemoryAdapter,
  injectKitStyles,
  type Settings,
  type ShareContent,
  type ShareResult,
} from "@web-games/kit";
import { defaultProfile, type Profile } from "@web-games/the-last-window-core";
import { render } from "preact";
import { act } from "preact/test-utils";
import { App } from "../src/App";
import { createAppRouter, type Routes } from "../src/nav";
import { createManualScheduler, type ManualScheduler } from "../src/shift/scheduler";
import type { AppContextValue } from "../src/state/app";
import { createProfileStore } from "../src/state/saveStores";
import { createServices, loadServices } from "../src/state/services";
import { installTheme } from "../src/theme/install";

const SRC = join(import.meta.dirname, "../src");

export const GAME_CSS = ["styles.css", "screens.css", "shift.css"]
  .map((name) => readFileSync(join(SRC, name), "utf8"))
  .join("\n");

export function installGameStyles(): void {
  if (document.getElementById("tlw-test-styles")) return;
  const style = document.createElement("style");
  style.id = "tlw-test-styles";
  style.textContent = GAME_CSS;
  document.head.appendChild(style);
}

export const FIXED_NOW = new Date(2026, 9, 21, 12, 0, 0);

export type RouteName = keyof Routes;

export interface FakeVisibility {
  hidden: boolean;
  addEventListener(type: "visibilitychange", listener: () => void): void;
  removeEventListener(type: "visibilitychange", listener: () => void): void;
  setHidden(hidden: boolean): void;
}

export function createFakeVisibility(): FakeVisibility {
  const listeners = new Set<() => void>();
  const source: FakeVisibility = {
    hidden: false,
    addEventListener: (_type, listener) => void listeners.add(listener),
    removeEventListener: (_type, listener) => void listeners.delete(listener),
    setHidden(hidden) {
      source.hidden = hidden;
      for (const listener of [...listeners]) listener();
    },
  };
  return source;
}

export interface RigOptions {
  profile?: Partial<Profile>;
  route?: [RouteName, unknown?];
  settings?: Partial<Settings>;
  now?: Date;
  artManifest?: readonly string[];
  shareResult?: ShareResult;
  noLifecycle?: boolean;
  preload?: AppContextValue["preload"];
  systemReducedMotion?: boolean;
}

export interface Rig {
  container: HTMLElement;
  app: AppContextValue;
  scheduler: ManualScheduler;
  visibility: FakeVisibility;
  shared: ShareContent[];
  backHandlers: Array<() => boolean>;
  /** Simulates the Android back button at the root: runs the registered onExit. */
  requestExit(): Promise<void>;
  exits: number;
  unmount(): void;
  flush(): Promise<void>;
  advance(ms: number, frameMs?: number): Promise<void>;
}

/** Mounts the whole app with an in-memory save, a manual frame scheduler and a fake visibility. */
export async function mountApp(options: RigOptions = {}): Promise<Rig> {
  const adapter = createMemoryAdapter();
  await createProfileStore(adapter).save({ ...defaultProfile(), ...options.profile });
  const now = options.now ?? FIXED_NOW;
  const services = createServices(adapter, { clock: () => now });
  if (options.settings) {
    await services.settings.load();
    await services.settings.set(options.settings);
  }
  await loadServices(services);
  const router = createAppRouter();
  const [name, params] = options.route ?? ["home"];
  (router.reset as (n: string, p?: unknown) => void)(name, params);
  const scheduler = createManualScheduler();
  const visibility = createFakeVisibility();
  const shared: ShareContent[] = [];
  const backHandlers: Array<() => boolean> = [];
  const exitCallbacks: Array<() => void> = [];
  const rig = { exits: 0 } as { exits: number };
  const app: AppContextValue = {
    router,
    game: services.game,
    settings: services.settings,
    clock: () => now,
    share: async (content) => {
      shared.push(content);
      return options.shareResult ?? { path: "clipboard", ok: true, cancelled: false };
    },
    scheduler,
    visibility,
    prefersReducedMotion: () => options.systemReducedMotion ?? false,
    exitApp: () => {
      rig.exits += 1;
    },
    ...(options.artManifest ? { artManifest: options.artManifest } : {}),
    ...(options.preload ? { preload: options.preload } : {}),
    ...(options.noLifecycle
      ? {}
      : {
          lifecycle: {
            onBack: (handler: () => boolean, backOptions?: { onExit?: () => void }) => {
              backHandlers.push(handler);
              if (backOptions?.onExit) exitCallbacks.push(backOptions.onExit);
              return () => void backHandlers.splice(backHandlers.indexOf(handler), 1);
            },
          },
        }),
  };
  injectKitStyles();
  installGameStyles();
  installTheme({ highContrast: false, reducedMotion: false, textSize: "normal" });
  const container = document.createElement("div");
  document.body.appendChild(container);
  await act(() => render(<App app={app} />, container));
  const out = {
    container,
    app,
    scheduler,
    visibility,
    shared,
    backHandlers,
    requestExit: async () => {
      await act(() => {
        if (!backHandlers[0]?.()) exitCallbacks[0]?.();
      });
    },
    get exits() {
      return rig.exits;
    },
    unmount: () => {
      render(null, container);
      container.remove();
    },
    flush: async () => {
      await act(async () => {
        for (let i = 0; i < 40; i++) await Promise.resolve();
      });
    },
    advance: async (ms: number, frameMs = 100) => {
      await act(() => {
        scheduler.advance(ms, frameMs);
      });
      await act(async () => {
        for (let i = 0; i < 40; i++) await Promise.resolve();
      });
    },
  } as Rig;
  return out;
}

export function q<T extends Element = HTMLElement>(root: ParentNode, selector: string): T {
  const found = root.querySelector<T>(selector);
  if (!found) throw new Error(`No element matches ${selector}`);
  return found;
}

export async function click(el: Element): Promise<void> {
  await act(() => {
    (el as HTMLElement).click();
  });
}

export async function press(
  target: EventTarget,
  key: string,
  init: KeyboardEventInit = {},
): Promise<void> {
  await act(() => {
    target.dispatchEvent(
      new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true, ...init }),
    );
  });
}

export function buttonByText(root: ParentNode, text: string): HTMLButtonElement {
  const match = Array.from(root.querySelectorAll("button")).find(
    (b) => (b.textContent ?? "").trim() === text || b.getAttribute("aria-label") === text,
  );
  if (!match) throw new Error(`No button "${text}"`);
  return match as HTMLButtonElement;
}

export function hasButton(root: ParentNode, text: string): boolean {
  return Array.from(root.querySelectorAll("button")).some(
    (b) => (b.textContent ?? "").trim() === text || b.getAttribute("aria-label") === text,
  );
}

export async function clickByText(root: ParentNode, text: string): Promise<void> {
  await click(buttonByText(root, text));
}

export function currentScreen(rig: Rig): string {
  return rig.app.router.current.name;
}

export function text(root: ParentNode): string {
  return (root.textContent ?? "").replace(/\s+/g, " ").trim();
}

export function profileOf(rig: Rig): Profile {
  return rig.app.game.getState().profile;
}
