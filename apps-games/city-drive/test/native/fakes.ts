import { vi } from "vitest";
import type { ExitPrompt } from "../../src/native/exitPrompt";
import type { AppPlugin, ListenerHandle } from "../../src/native/plugins";

type Listener = (state: { canGoBack: boolean }) => void;

/** A recording stand-in for @capacitor/app that lets a test fire native events. */
export class FakeApp implements AppPlugin {
  readonly listeners = new Map<string, Set<Listener>>();
  exited = 0;
  failAdd: Error | undefined;

  addListener(event: "backButton", l: (s: { canGoBack: boolean }) => void): Promise<ListenerHandle>;
  addListener(event: "pause", l: () => void): Promise<ListenerHandle>;
  addListener(event: "resume", l: () => void): Promise<ListenerHandle>;
  addListener(event: string, listener: Listener | (() => void)): Promise<ListenerHandle> {
    if (this.failAdd) return Promise.reject(this.failAdd);
    const set = this.listeners.get(event) ?? new Set<Listener>();
    set.add(listener as Listener);
    this.listeners.set(event, set);
    return Promise.resolve({
      remove: async () => {
        set.delete(listener as Listener);
      },
    });
  }

  async exitApp(): Promise<void> {
    this.exited++;
  }

  emit(event: string, state?: { canGoBack: boolean }): void {
    for (const listener of [...(this.listeners.get(event) ?? [])])
      listener(state ?? { canGoBack: false });
  }

  count(event: string): number {
    return this.listeners.get(event)?.size ?? 0;
  }
}

/** An exit prompt whose answer the test chooses. */
export class FakePrompt implements ExitPrompt {
  isOpen = false;
  asked = 0;
  cancelled = 0;
  private resolveOpen: ((exit: boolean) => void) | undefined;

  confirm(): Promise<boolean> {
    this.asked++;
    this.isOpen = true;
    return new Promise((resolve) => {
      this.resolveOpen = (exit) => {
        this.isOpen = false;
        resolve(exit);
      };
    });
  }

  cancel(): void {
    this.cancelled++;
    this.answer(false);
  }

  answer(exit: boolean): void {
    this.resolveOpen?.(exit);
  }
}

export const flush = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

export function silenceErrors() {
  return vi.spyOn(console, "error").mockImplementation(() => undefined);
}
