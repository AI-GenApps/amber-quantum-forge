import { readFileSync } from "node:fs";
import { join } from "node:path";
import { defaultProfile, type Profile, RULE_CARD_IDS } from "@web-games/dress-rehearsal-core";
import {
  createMemoryAdapter,
  injectKitStyles,
  type Settings,
  type ShareContent,
  type ShareResult,
} from "@web-games/kit";
import { render } from "preact";
import { act } from "preact/test-utils";
import { App } from "../src/App";
import type { SlotId } from "../src/art/slots";
import type { Draw2D } from "../src/export/Draw2D";
import type { CanvasLike, ExportEnv, FileShareData } from "../src/export/share";
import { createAppRouter, type Routes } from "../src/nav";
import type { AppContextValue } from "../src/state/app";
import { createGame } from "../src/state/game";
import { createProfileStore } from "../src/state/saveStores";
import { installTheme } from "../src/theme/install";
import { RecordingContext } from "./recording";

export { RecordingContext } from "./recording";

export const GAME_CSS = readFileSync(join(import.meta.dirname, "../src/styles.css"), "utf8");

export const FIXED_NOW = new Date(2026, 9, 23, 12, 0, 0);

export type FileShareMode = "ok" | "abort" | "fail" | "none" | "unsupported";

export interface FakeExport {
  env: ExportEnv;
  canvases: FakeCanvas[];
  previewContext: RecordingContext;
  downloads: { name: string; size: number }[];
  shares: FileShareData[];
}

export class FakeCanvas implements CanvasLike {
  readonly context = new RecordingContext();
  constructor(
    public width: number,
    public height: number,
  ) {}
  getContext(): Draw2D {
    return this.context;
  }
  toBlob(callback: (blob: Blob | null) => void): void {
    callback(new Blob(["png"], { type: "image/png" }));
  }
}

export function fakeExport(mode: FileShareMode = "none"): FakeExport {
  const canvases: FakeCanvas[] = [];
  const downloads: { name: string; size: number }[] = [];
  const shares: FileShareData[] = [];
  const previewContext = new RecordingContext();
  const share =
    mode === "none"
      ? undefined
      : async (data: FileShareData): Promise<void> => {
          shares.push(data);
          if (mode === "abort") throw Object.assign(new Error("cancelled"), { name: "AbortError" });
          if (mode === "fail") throw new Error("share failed");
        };
  const env: ExportEnv = {
    createCanvas(width, height) {
      const canvas = new FakeCanvas(width, height);
      canvases.push(canvas);
      return canvas;
    },
    previewContext: () => previewContext,
    navigator: share ? { share, canShare: () => mode !== "unsupported" } : undefined,
    createFile: (blob, name) => new File([blob], name, { type: "image/png" }),
    download(blob, name) {
      downloads.push({ name, size: blob.size });
      return true;
    },
  };
  return { env, canvases, previewContext, downloads, shares };
}

export interface Rig {
  container: HTMLElement;
  app: AppContextValue;
  exporter: FakeExport;
  shared: ShareContent[];
  unmount(): void;
  flush(): Promise<void>;
  settle(ms?: number): Promise<void>;
}

export type Route = {
  [K in keyof Routes]: [K, ...(Routes[K] extends undefined ? [] : [Routes[K]])];
}[keyof Routes];

export interface RigOptions {
  route?: Route;
  profile?: Partial<Profile>;
  settings?: Partial<Settings>;
  now?: Date;
  shareResult?: ShareResult;
  fileShare?: FileShareMode;
  systemReducedMotion?: boolean;
  lifecycle?: AppContextValue["lifecycle"];
  exitApp?: () => void;
  preload?: AppContextValue["preload"];
  artManifest?: readonly SlotId[];
  /** Leaves the tutorial and rule cards unseen; by default a rig has seen them all. */
  freshOnboarding?: boolean;
  feedback?: AppContextValue["feedback"];
}

export const SEEN_FLAGS: Profile["flags"] = {
  tutorial: true,
  howTo: true,
  ruleCards: Object.fromEntries(RULE_CARD_IDS.map((id) => [id, true])),
};

export function installGameStyles(): void {
  if (document.getElementById("dr-test-styles")) return;
  const style = document.createElement("style");
  style.id = "dr-test-styles";
  style.textContent = GAME_CSS;
  document.head.appendChild(style);
}

export async function mountApp(options: RigOptions = {}): Promise<Rig> {
  const adapter = createMemoryAdapter();
  await createProfileStore(adapter).save({
    ...defaultProfile(),
    ...(options.freshOnboarding ? {} : { flags: SEEN_FLAGS }),
    ...options.profile,
  });
  const now = options.now ?? FIXED_NOW;
  const game = createGame({ adapter, clock: () => now });
  await game.load();
  if (options.settings) await game.settings.set(options.settings);
  const router = createAppRouter();
  const [name, params] = options.route ?? ["home"];
  (router.reset as (n: string, p?: unknown) => void)(name, params);
  const exporter = fakeExport(options.fileShare ?? "none");
  const shared: ShareContent[] = [];
  const app: AppContextValue = {
    router,
    game,
    settings: game.settings,
    clock: () => now,
    share: async (content) => {
      shared.push(content);
      return options.shareResult ?? { path: "clipboard", ok: true, cancelled: false };
    },
    prefersReducedMotion: () => options.systemReducedMotion === true,
    ...(options.lifecycle ? { lifecycle: options.lifecycle } : {}),
    ...(options.exitApp ? { exitApp: options.exitApp } : {}),
    exportEnv: exporter.env,
    ...(options.preload ? { preload: options.preload } : {}),
    ...(options.artManifest ? { artManifest: options.artManifest } : {}),
    ...(options.feedback ? { feedback: options.feedback } : {}),
  };
  injectKitStyles();
  installGameStyles();
  installTheme({ highContrast: options.settings?.highContrast === true, reducedMotion: false });
  const container = document.createElement("div");
  document.body.appendChild(container);
  await act(() => render(<App app={app} />, container));
  return {
    container,
    app,
    exporter,
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

export function all<T extends Element = HTMLElement>(root: ParentNode, selector: string): T[] {
  return Array.from(root.querySelectorAll<T>(selector));
}

export async function click(el: Element): Promise<void> {
  await act(() => {
    (el as HTMLElement).click();
  });
}

export async function press(el: Element, key: string, init: KeyboardEventInit = {}): Promise<void> {
  await act(() => {
    el.dispatchEvent(
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

export function currentScreen(rig: Rig): string {
  return rig.app.router.current.name;
}

export function text(root: ParentNode): string {
  return (root.textContent ?? "").replace(/\s+/g, " ").trim();
}

export function starsFor(ids: readonly string[], stars: 1 | 2 | 3 = 3): Record<string, 1 | 2 | 3> {
  return Object.fromEntries(ids.map((id) => [id, stars]));
}

export const RIVIERA_IDS = ["riv-01", "riv-02", "riv-03", "riv-04", "riv-05", "riv-06", "riv-07"];

export function galleryEntry(n: number, ref = "riv-01") {
  return {
    id: `campaign-${ref}-2026-10-01-${n}`,
    kind: "campaign" as const,
    ref,
    look: {
      top: "item-riviera-1",
      bottom: "item-riviera-4",
      shoes: "item-riviera-5",
      bag: "item-riviera-6",
      hat: "item-riviera-7",
      accessory: "item-riviera-8",
    },
    stars: 3 as const,
    harmony: 80,
    savedKey: "2026-10-01",
  };
}
