import { afterEach, describe, expect, it, vi } from "vitest";
import { bindKeepAwake, capacitorKeepAwake, noopKeepAwake } from "../../src/native/keepAwake";
import { flush, silenceErrors } from "./fakes";

afterEach(() => vi.restoreAllMocks());

function plugin() {
  return { keepAwake: vi.fn(async () => undefined), allowSleep: vi.fn(async () => undefined) };
}

describe("keep awake service", () => {
  it("calls the plugin only when the state changes", () => {
    const p = plugin();
    const service = capacitorKeepAwake(p);
    service.set(false);
    service.set(true);
    service.set(true);
    service.set(false);
    service.set(false);
    expect(p.keepAwake).toHaveBeenCalledTimes(1);
    expect(p.allowSleep).toHaveBeenCalledTimes(1);
  });

  it("logs a failure and retries on the next change", async () => {
    const log = silenceErrors();
    const p = plugin();
    p.keepAwake.mockRejectedValueOnce(new Error("unsupported"));
    const service = capacitorKeepAwake(p);
    service.set(true);
    await flush();
    expect(log).toHaveBeenCalled();
    service.set(true);
    expect(p.keepAwake).toHaveBeenCalledTimes(2);
  });

  it("is a no-op on the web", () => {
    expect(() => noopKeepAwake.set(true)).not.toThrow();
  });
});

describe("bindKeepAwake", () => {
  function source(screen: string, loading?: string) {
    const listeners = new Set<() => void>();
    const state = { view: { screen, loading } };
    return {
      state,
      subscribe(l: () => void) {
        listeners.add(l);
        return () => listeners.delete(l);
      },
      change(next: { screen: string; loading?: string }) {
        state.view = { screen: next.screen, loading: next.loading };
        for (const l of listeners) l();
      },
    };
  }

  it("stays awake only while driving", () => {
    const set = vi.fn();
    const s = source("home");
    const view = {
      get view() {
        return s.state.view;
      },
      subscribe: s.subscribe,
    };
    bindKeepAwake(view, { set });
    expect(set).toHaveBeenLastCalledWith(false);
    s.change({ screen: "play" });
    expect(set).toHaveBeenLastCalledWith(true);
    s.change({ screen: "play", loading: "Loading the city" });
    expect(set).toHaveBeenLastCalledWith(false);
    s.change({ screen: "play" });
    s.change({ screen: "pause" });
    expect(set).toHaveBeenLastCalledWith(false);
    s.change({ screen: "garage" });
    expect(set).toHaveBeenLastCalledWith(false);
  });
});
