import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  createMemoryAdapter,
  injectKitStyles,
  type Settings,
  type ShareContent,
  type ShareResult,
} from "@web-games/kit";
import {
  type CaseRecord,
  defaultProfile,
  type Profile,
  type StampCount,
} from "@web-games/lost-parcel-desk-core";
import { render } from "preact";
import { act } from "preact/test-utils";
import { App } from "../src/App";
import { createAppRouter, type Routes } from "../src/nav";
import type { AppContextValue } from "../src/state/app";
import { createProfileStore } from "../src/state/saveStores";
import { createServices, loadServices } from "../src/state/services";
import { installTheme } from "../src/theme/install";

const SRC = join(import.meta.dirname, "../src");
export const GAME_CSS = ["styles.css", "screens.css", "motion.css"]
  .map((name) => readFileSync(join(SRC, name), "utf8"))
  .join("\n");

export const FIXED_NOW = new Date(2026, 9, 21, 12, 0, 0);

export type RouteInit = {
  [K in keyof Routes]: [K, ...(Routes[K] extends undefined ? [] : [Routes[K]])];
}[keyof Routes];

export interface RigOptions {
  route?: RouteInit;
  profile?: Partial<Profile>;
  settings?: Partial<Settings>;
  now?: Date;
  shareResult?: ShareResult;
  reducedMotion?: boolean;
  artManifest?: string[];
  preload?: AppContextValue["preload"];
}

export interface Rig {
  container: HTMLElement;
  app: AppContextValue;
  shared: ShareContent[];
  unmount(): void;
  flush(): Promise<void>;
  settle(ms?: number): Promise<void>;
}

export function installGameStyles(): void {
  if (document.getElementById("lp-test-styles")) return;
  const style = document.createElement("style");
  style.id = "lp-test-styles";
  style.textContent = GAME_CSS;
  document.head.appendChild(style);
}

export function closedRecord(stamps: StampCount): CaseRecord {
  return { stamps, bestTimeMs: 90_000, hintsOnBest: 0, closedCount: 1 };
}

/** A profile in which the given campaign cases are closed with the given stamps. */
export function progress(ids: readonly string[], stamps: StampCount = 3): Partial<Profile> {
  return { cases: Object.fromEntries(ids.map((id) => [id, closedRecord(stamps)])) };
}

export const SEEN_FLAGS: Record<string, true> = {
  "chapter-1-intro": true,
  "chapter-2-intro": true,
  "chapter-3-intro": true,
};

export async function mountApp(options: RigOptions = {}): Promise<Rig> {
  const adapter = createMemoryAdapter();
  const base = defaultProfile();
  await createProfileStore(adapter).save({
    ...base,
    flags: { ...SEEN_FLAGS },
    ...options.profile,
  });
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
  const shared: ShareContent[] = [];
  const app: AppContextValue = {
    router,
    game: services.game,
    settings: services.settings,
    clock: () => now,
    share: async (content) => {
      shared.push(content);
      return options.shareResult ?? { path: "clipboard", ok: true, cancelled: false };
    },
    prefersReducedMotion: () => options.reducedMotion ?? true,
    outcome: { last: null },
    ...(options.preload ? { preload: options.preload } : {}),
    ...(options.artManifest ? { artManifest: options.artManifest } : {}),
  };
  injectKitStyles();
  installGameStyles();
  installTheme({ themeId: "mustard-riso", highContrast: false, reducedMotion: true });
  const container = document.createElement("div");
  document.body.appendChild(container);
  await act(() => render(<App app={app} />, container));
  return {
    container,
    app,
    shared,
    unmount: () => {
      render(null, container);
      container.remove();
    },
    settle: async (ms = 30) => {
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, ms));
      });
    },
    flush: async () => {
      await act(async () => {
        for (let i = 0; i < 40; i++) await Promise.resolve();
      });
    },
  };
}

export function q<T extends Element = HTMLElement>(root: ParentNode, selector: string): T {
  const found = root.querySelector<T>(selector);
  if (!found) throw new Error(`No element matches ${selector}`);
  return found;
}

export function qa<T extends Element = HTMLElement>(root: ParentNode, selector: string): T[] {
  return Array.from(root.querySelectorAll<T>(selector));
}

export async function click(el: Element): Promise<void> {
  await act(() => {
    const target = el as HTMLElement;
    if (typeof target.click === "function") target.click();
    else target.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
  });
}

export async function press(
  el: Element | Window,
  key: string,
  init: KeyboardEventInit = {},
): Promise<void> {
  await act(() => {
    el.dispatchEvent(
      new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true, ...init }),
    );
  });
}

export function buttons(root: ParentNode): HTMLButtonElement[] {
  return qa<HTMLButtonElement>(root, "button");
}

export function buttonByText(root: ParentNode, text: string): HTMLButtonElement {
  const match = buttons(root).find(
    (b) =>
      (b.textContent ?? "").replace(/\s+/g, " ").trim() === text ||
      b.getAttribute("aria-label") === text,
  );
  if (!match) throw new Error(`No button "${text}"`);
  return match;
}

export function buttonStarting(root: ParentNode, text: string): HTMLButtonElement {
  const match = buttons(root).find(
    (b) =>
      (b.textContent ?? "").replace(/\s+/g, " ").trim().startsWith(text) ||
      (b.getAttribute("aria-label") ?? "").startsWith(text),
  );
  if (!match) throw new Error(`No button starting with "${text}"`);
  return match;
}

export function currentScreen(rig: Rig): string {
  return rig.app.router.current.name;
}

export function text(root: ParentNode): string {
  return (root.textContent ?? "").replace(/\s+/g, " ").trim();
}

export async function tap(rig: Rig, label: string): Promise<void> {
  await click(buttonByText(rig.container, label));
  await rig.flush();
}

export async function tapStarting(rig: Rig, label: string): Promise<void> {
  await click(buttonStarting(rig.container, label));
  await rig.flush();
}
