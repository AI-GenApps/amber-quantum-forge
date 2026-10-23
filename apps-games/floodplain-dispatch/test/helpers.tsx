import { readFileSync } from "node:fs";
import { join } from "node:path";
import { defaultProfile, MECHANIC_CARDS, type Profile } from "@web-games/floodplain-dispatch-core";
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
import type { Draw2D } from "../src/board/Draw2D";
import { createAppRouter, type Routes } from "../src/nav";
import type { AppContextValue } from "../src/state/app";
import { createProfileStore } from "../src/state/saveStores";
import { createServices, loadServices } from "../src/state/services";
import { installTheme } from "../src/theme/install";

export type Op = { op: string; args: unknown[] };

export class RecordingContext implements Draw2D {
  ops: Op[] = [];
  private values: Record<string, unknown> = {
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 1,
    globalAlpha: 1,
    lineJoin: "miter",
    lineCap: "butt",
    font: "",
    textAlign: "left",
    textBaseline: "alphabetic",
  };
  private rec(op: string, args: unknown[]): void {
    this.ops.push({ op, args });
  }
  private set(name: string, value: unknown): void {
    this.values[name] = value;
    this.rec(`set:${name}`, [value]);
  }
  get fillStyle(): string {
    return this.values.fillStyle as string;
  }
  set fillStyle(v: string) {
    this.set("fillStyle", v);
  }
  get strokeStyle(): string {
    return this.values.strokeStyle as string;
  }
  set strokeStyle(v: string) {
    this.set("strokeStyle", v);
  }
  get lineWidth(): number {
    return this.values.lineWidth as number;
  }
  set lineWidth(v: number) {
    this.set("lineWidth", v);
  }
  get globalAlpha(): number {
    return this.values.globalAlpha as number;
  }
  set globalAlpha(v: number) {
    this.set("globalAlpha", v);
  }
  get lineJoin(): "round" | "bevel" | "miter" {
    return this.values.lineJoin as "round";
  }
  set lineJoin(v: "round" | "bevel" | "miter") {
    this.set("lineJoin", v);
  }
  get lineCap(): "butt" | "round" | "square" {
    return this.values.lineCap as "butt";
  }
  set lineCap(v: "butt" | "round" | "square") {
    this.set("lineCap", v);
  }
  get font(): string {
    return this.values.font as string;
  }
  set font(v: string) {
    this.set("font", v);
  }
  get textAlign(): "left" | "center" | "right" {
    return this.values.textAlign as "left";
  }
  set textAlign(v: "left" | "center" | "right") {
    this.set("textAlign", v);
  }
  get textBaseline(): "top" | "middle" | "alphabetic" | "bottom" {
    return this.values.textBaseline as "top";
  }
  set textBaseline(v: "top" | "middle" | "alphabetic" | "bottom") {
    this.set("textBaseline", v);
  }
  save() {
    this.rec("save", []);
  }
  restore() {
    this.rec("restore", []);
  }
  translate(x: number, y: number) {
    this.rec("translate", [x, y]);
  }
  scale(x: number, y: number) {
    this.rec("scale", [x, y]);
  }
  rotate(a: number) {
    this.rec("rotate", [a]);
  }
  beginPath() {
    this.rec("beginPath", []);
  }
  closePath() {
    this.rec("closePath", []);
  }
  moveTo(x: number, y: number) {
    this.rec("moveTo", [x, y]);
  }
  lineTo(x: number, y: number) {
    this.rec("lineTo", [x, y]);
  }
  arc(x: number, y: number, r: number, s: number, e: number) {
    this.rec("arc", [x, y, r, s, e]);
  }
  arcTo(a: number, b: number, c: number, d: number, r: number) {
    this.rec("arcTo", [a, b, c, d, r]);
  }
  rect(x: number, y: number, w: number, h: number) {
    this.rec("rect", [x, y, w, h]);
  }
  fill() {
    this.rec("fill", [this.fillStyle]);
  }
  stroke() {
    this.rec("stroke", [this.strokeStyle, this.lineWidth]);
  }
  clip() {
    this.rec("clip", []);
  }
  fillRect(x: number, y: number, w: number, h: number) {
    this.rec("fillRect", [x, y, w, h, this.fillStyle]);
  }
  strokeRect(x: number, y: number, w: number, h: number) {
    this.rec("strokeRect", [x, y, w, h, this.strokeStyle]);
  }
  clearRect(x: number, y: number, w: number, h: number) {
    this.rec("clearRect", [x, y, w, h]);
  }
  fillText(text: string, x: number, y: number) {
    this.rec("fillText", [text, x, y]);
  }
  setLineDash(s: number[]) {
    this.rec("setLineDash", [s]);
  }
  drawImage(image: unknown, x: number, y: number, w: number, h: number) {
    this.rec("drawImage", [image, x, y, w, h]);
  }
  count(op: string): number {
    return this.ops.filter((o) => o.op === op).length;
  }
  calls(op: string): unknown[][] {
    return this.ops.filter((o) => o.op === op).map((o) => o.args);
  }
  reset(): void {
    this.ops = [];
  }
}

export interface Rig {
  container: HTMLElement;
  app: AppContextValue;
  ctx: RecordingContext;
  shared: ShareContent[];
  unmount(): void;
  flush(): Promise<void>;
  /** Waits real time for effects that Preact schedules after a frame. */
  settle(ms?: number): Promise<void>;
}

/** Flags that mark the tutorial and every mechanic card as already seen. */
export const SEEN_FLAGS: Record<string, true> = Object.fromEntries([
  ["tutorial", true],
  ...MECHANIC_CARDS.map((card) => [`card-${card.id}`, true]),
]);

export interface RigOptions {
  route?: {
    [K in keyof Routes]: [K, ...(Routes[K] extends undefined ? [] : [Routes[K]])];
  }[keyof Routes];
  profile?: Partial<Profile>;
  settings?: Partial<Settings>;
  now?: Date;
  shareResult?: ShareResult;
  preload?: AppContextValue["preload"];
  artManifest?: AppContextValue["artManifest"];
  feedback?: (settings: AppContextValue["settings"]) => NonNullable<AppContextValue["feedback"]>;
}

export const GAME_CSS = readFileSync(join(import.meta.dirname, "../src/styles.css"), "utf8");

export function installGameStyles(): void {
  if (document.getElementById("fd-test-styles")) return;
  const style = document.createElement("style");
  style.id = "fd-test-styles";
  style.textContent = GAME_CSS;
  document.head.appendChild(style);
}

export const FIXED_NOW = new Date(2026, 9, 21, 12, 0, 0);

export async function mountApp(options: RigOptions = {}): Promise<Rig> {
  const adapter = createMemoryAdapter();
  await createProfileStore(adapter).save({
    ...defaultProfile(),
    flags: SEEN_FLAGS,
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
  const ctx = new RecordingContext();
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
    prefersReducedMotion: () => false,
    contextFactory: () => ctx,
    ...(options.preload ? { preload: options.preload } : {}),
    ...(options.artManifest ? { artManifest: options.artManifest } : {}),
    ...(options.feedback ? { feedback: options.feedback(services.settings) } : {}),
  };
  injectKitStyles();
  installGameStyles();
  installTheme({ themeId: "gouache-meadow", highContrast: false, reducedMotion: false });
  const container = document.createElement("div");
  document.body.appendChild(container);
  await act(() => render(<App app={app} />, container));
  return {
    container,
    app,
    ctx,
    shared,
    unmount: () => {
      render(null, container);
      container.remove();
    },
    settle: async (ms = 40) => {
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

export function starsFor(ids: readonly string[], stars: 1 | 2 | 3 = 3): Record<string, 1 | 2 | 3> {
  return Object.fromEntries(ids.map((id) => [id, stars]));
}

export const VALLEY_IDS = ["v01", "v02", "v03", "v04", "v05", "v06", "v07", "v08", "v09", "v10"];

export function text(root: ParentNode): string {
  return (root.textContent ?? "").replace(/\s+/g, " ").trim();
}
