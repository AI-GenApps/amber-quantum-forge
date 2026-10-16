import { afterEach, describe, expect, it, vi } from "vitest";
import {
  bindLifecycle,
  CapacitorLifecycleSource,
  type LifecycleDeps,
  WebLifecycleSource,
} from "../../src/native/lifecycle";
import { FakeApp, flush, silenceErrors } from "./fakes";

afterEach(() => vi.restoreAllMocks());

function deps() {
  const calls: string[] = [];
  const value: LifecycleDeps = {
    setHidden: (hidden) => calls.push(`hidden:${hidden}`),
    save: async () => void calls.push("save"),
    audio: {
      suspend: async () => void calls.push("audio:suspend"),
      resume: async () => void calls.push("audio:resume"),
    },
  };
  return { calls, value };
}

describe("capacitor lifecycle", () => {
  it("pauses, saves and silences audio on pause", async () => {
    const app = new FakeApp();
    const { calls, value } = deps();
    bindLifecycle(new CapacitorLifecycleSource(app), value);
    await flush();
    app.emit("pause");
    await flush();
    expect(calls).toEqual(["hidden:true", "save", "audio:suspend"]);
  });

  it("restores audio and unhides on resume", async () => {
    const app = new FakeApp();
    const { calls, value } = deps();
    bindLifecycle(new CapacitorLifecycleSource(app), value);
    await flush();
    app.emit("resume");
    await flush();
    expect(calls).toEqual(["hidden:false", "audio:resume"]);
  });

  it("removes both listeners when unbound", async () => {
    const app = new FakeApp();
    const stop = bindLifecycle(new CapacitorLifecycleSource(app), deps().value);
    await flush();
    expect(app.count("pause")).toBe(1);
    expect(app.count("resume")).toBe(1);
    stop();
    await flush();
    expect(app.count("pause")).toBe(0);
    expect(app.count("resume")).toBe(0);
  });

  it("logs a failing listener registration instead of throwing", async () => {
    const log = silenceErrors();
    const app = new FakeApp();
    app.failAdd = new Error("no bridge");
    bindLifecycle(new CapacitorLifecycleSource(app), deps().value);
    await flush();
    expect(log).toHaveBeenCalled();
  });

  it("reports a failing save and still suspends audio", async () => {
    const log = silenceErrors();
    const app = new FakeApp();
    const { calls, value } = deps();
    value.save = async () => {
      throw new Error("disk full");
    };
    bindLifecycle(new CapacitorLifecycleSource(app), value);
    await flush();
    app.emit("pause");
    await flush();
    expect(calls).toContain("audio:suspend");
    expect(log).toHaveBeenCalled();
  });
});

describe("web lifecycle", () => {
  function target() {
    const listeners = new Map<string, Set<() => void>>();
    return {
      hidden: false,
      addEventListener(type: string, fn: () => void) {
        listeners.set(type, (listeners.get(type) ?? new Set()).add(fn));
      },
      removeEventListener(type: string, fn: () => void) {
        listeners.get(type)?.delete(fn);
      },
      fire(type: string) {
        for (const fn of [...(listeners.get(type) ?? [])]) fn();
      },
      count: (type: string) => listeners.get(type)?.size ?? 0,
    };
  }

  it("follows page visibility and pagehide", async () => {
    const doc = target();
    const win = target();
    const { calls, value } = deps();
    const stop = bindLifecycle(new WebLifecycleSource(doc as never, win as never), value);
    doc.hidden = true;
    doc.fire("visibilitychange");
    await flush();
    expect(calls).toEqual(["hidden:true", "save", "audio:suspend"]);
    calls.length = 0;
    doc.hidden = false;
    doc.fire("visibilitychange");
    await flush();
    expect(calls).toEqual(["hidden:false", "audio:resume"]);
    calls.length = 0;
    win.fire("pagehide");
    await flush();
    expect(calls[0]).toBe("hidden:true");
    stop();
    expect(doc.count("visibilitychange")).toBe(0);
    expect(win.count("pagehide")).toBe(0);
  });
});
