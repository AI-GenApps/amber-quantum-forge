/**
 * The menu screens. In-drive overlays (free-roam HUD, briefing, mission HUD, results) are not
 * screens of their own: they all belong to "play" and follow the mission phase.
 */
export type ScreenId = "home" | "map" | "garage" | "settings" | "play" | "pause";

export const SCREEN_IDS: readonly ScreenId[] = [
  "home",
  "map",
  "garage",
  "settings",
  "play",
  "pause",
];

/** Which screens may be opened on top of which. `resetTo` ignores this table. */
const OPENS: Readonly<Record<ScreenId, readonly ScreenId[]>> = {
  home: ["map", "garage", "settings", "play"],
  map: [],
  garage: [],
  settings: [],
  play: ["pause"],
  pause: ["settings"],
};

/** A tiny stack-based screen navigator. The bottom of the stack is never popped. */
export class ScreenStack {
  private stack: ScreenId[];
  private readonly listeners = new Set<() => void>();

  constructor(root: ScreenId = "home") {
    this.stack = [root];
  }

  get top(): ScreenId {
    return this.stack[this.stack.length - 1] as ScreenId;
  }

  get depth(): number {
    return this.stack.length;
  }

  /** A copy of the stack, bottom first. */
  get screens(): readonly ScreenId[] {
    return [...this.stack];
  }

  canPush(id: ScreenId): boolean {
    return OPENS[this.top].includes(id);
  }

  push(id: ScreenId): void {
    if (!this.canPush(id)) {
      throw new Error(`navigation: "${id}" cannot be opened on top of "${this.top}"`);
    }
    this.stack.push(id);
    this.emit();
  }

  /** Closes the top screen. Returns it, or undefined when only the root is left. */
  pop(): ScreenId | undefined {
    if (this.stack.length <= 1) return undefined;
    const closed = this.stack.pop();
    this.emit();
    return closed;
  }

  /** Throws away the whole stack and starts again from `id`. */
  resetTo(id: ScreenId): void {
    this.stack = [id];
    this.emit();
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit(): void {
    for (const listener of [...this.listeners]) listener();
  }
}
