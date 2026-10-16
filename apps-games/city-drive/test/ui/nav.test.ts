import { describe, expect, it, vi } from "vitest";
import { backAction, EscapeBackSource } from "../../src/ui/nav/back";
import { SCREEN_IDS, ScreenStack } from "../../src/ui/nav/screenStack";

describe("ScreenStack", () => {
  it("starts at home and cannot pop the root", () => {
    const stack = new ScreenStack();
    expect(stack.top).toBe("home");
    expect(stack.depth).toBe(1);
    expect(stack.pop()).toBeUndefined();
    expect(stack.top).toBe("home");
  });

  it("opens the map, garage and settings from home and pops back", () => {
    for (const id of ["map", "garage", "settings"] as const) {
      const stack = new ScreenStack();
      stack.push(id);
      expect(stack.top).toBe(id);
      expect(stack.screens).toEqual(["home", id]);
      expect(stack.pop()).toBe(id);
      expect(stack.top).toBe("home");
    }
  });

  it("reaches play, then pause, then settings, and unwinds in order", () => {
    const stack = new ScreenStack();
    stack.push("play");
    stack.push("pause");
    stack.push("settings");
    expect(stack.screens).toEqual(["home", "play", "pause", "settings"]);
    stack.pop();
    expect(stack.top).toBe("pause");
    stack.pop();
    expect(stack.top).toBe("play");
  });

  it("every screen is reachable (directly or through resetTo)", () => {
    const reached = new Set<string>();
    for (const id of SCREEN_IDS) {
      const stack = new ScreenStack();
      if (stack.canPush(id)) stack.push(id);
      else stack.resetTo(id);
      reached.add(stack.top);
    }
    expect([...reached].sort()).toEqual([...SCREEN_IDS].sort());
  });

  it("rejects an illegal push with a descriptive error", () => {
    const stack = new ScreenStack();
    expect(() => stack.push("pause")).toThrow(/"pause" cannot be opened on top of "home"/);
    stack.push("map");
    expect(() => stack.push("garage")).toThrow(/"garage" cannot be opened on top of "map"/);
  });

  it("resetTo replaces the whole stack", () => {
    const stack = new ScreenStack();
    stack.push("play");
    stack.push("pause");
    stack.resetTo("home");
    expect(stack.screens).toEqual(["home"]);
  });

  it("notifies subscribers on every change and stops after unsubscribe", () => {
    const stack = new ScreenStack();
    const listener = vi.fn();
    const off = stack.subscribe(listener);
    stack.push("map");
    stack.pop();
    stack.resetTo("play");
    expect(listener).toHaveBeenCalledTimes(3);
    off();
    stack.resetTo("home");
    expect(listener).toHaveBeenCalledTimes(3);
  });
});

describe("backAction", () => {
  it("closes menu screens, resumes from pause and exits from home", () => {
    expect(backAction("map", "idle")).toBe("pop");
    expect(backAction("garage", "idle")).toBe("pop");
    expect(backAction("settings", "idle")).toBe("pop");
    expect(backAction("pause", "active")).toBe("resume");
    expect(backAction("home", "idle")).toBe("exit");
  });

  it("while playing it depends on the mission phase", () => {
    expect(backAction("play", "idle")).toBe("pause");
    expect(backAction("play", "active")).toBe("pause");
    expect(backAction("play", "briefing")).toBe("decline");
    expect(backAction("play", "success")).toBe("continue");
    expect(backAction("play", "fail")).toBe("continue");
    expect(backAction("play", "results")).toBe("continue");
  });
});

describe("EscapeBackSource", () => {
  function setup(handled: boolean) {
    const target = new EventTarget();
    const source = new EscapeBackSource(target as unknown as Window);
    const handler = vi.fn(() => handled);
    const off = source.onBack(handler);
    const press = (key: string) => {
      const event = new Event("keydown", { cancelable: true });
      Object.defineProperty(event, "key", { value: key });
      target.dispatchEvent(event);
      return event;
    };
    return { handler, off, press };
  }

  it("calls the handler on Escape only, and prevents default when it was handled", () => {
    const { handler, press } = setup(true);
    expect(press("Enter").defaultPrevented).toBe(false);
    expect(handler).not.toHaveBeenCalled();
    expect(press("Escape").defaultPrevented).toBe(true);
    expect(handler).toHaveBeenCalledOnce();
  });

  it("leaves the event alone when nothing could go back, and stops after off()", () => {
    const { handler, off, press } = setup(false);
    expect(press("Escape").defaultPrevented).toBe(false);
    off();
    press("Escape");
    expect(handler).toHaveBeenCalledOnce();
  });
});
