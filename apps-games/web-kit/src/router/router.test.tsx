import { render } from "preact";
import { act } from "preact/test-utils";
import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { useBackInterceptor, useCurrentScreen } from "./hooks";
import { createRouter } from "./router";

interface Routes extends Record<string, unknown> {
  home: undefined;
  level: { id: number };
  settings: undefined;
  result: { stars: number };
}

const names = (router: ReturnType<typeof createRouter<Routes>>) => router.stack.map((e) => e.name);

describe("router", () => {
  it("starts at the root screen", () => {
    const router = createRouter<Routes>("home");
    expect(router.current).toEqual({ name: "home", params: undefined });
    expect(router.canGoBack).toBe(false);
  });

  it("pushes with typed params and pops", () => {
    const router = createRouter<Routes>("home");
    router.push("level", { id: 3 });
    router.push("settings");
    expect(names(router)).toEqual(["home", "level", "settings"]);
    expect(router.pop()).toBe(true);
    expect(router.current).toEqual({ name: "level", params: { id: 3 } });
    expect(router.canGoBack).toBe(true);
  });

  it("refuses to pop the root", () => {
    const router = createRouter<Routes>("home");
    expect(router.pop()).toBe(false);
    expect(names(router)).toEqual(["home"]);
  });

  it("replaces the top screen", () => {
    const router = createRouter<Routes>("home");
    router.push("level", { id: 1 });
    router.replace("result", { stars: 2 });
    expect(names(router)).toEqual(["home", "result"]);
    router.replace("settings");
    expect(names(router)).toEqual(["home", "settings"]);
  });

  it("popTo returns to an earlier screen and reports missing ones", () => {
    const router = createRouter<Routes>("home");
    router.push("level", { id: 1 });
    router.push("settings");
    router.push("level", { id: 2 });
    expect(router.popTo("settings")).toBe(true);
    expect(names(router)).toEqual(["home", "level", "settings"]);
    expect(router.popTo("settings")).toBe(true);
    expect(router.popTo("result")).toBe(false);
  });

  it("reset clears history", () => {
    const router = createRouter<Routes>("home");
    router.push("level", { id: 1 });
    router.reset("result", { stars: 3 });
    expect(router.stack).toEqual([{ name: "result", params: { stars: 3 } }]);
  });

  it("can start on a screen that needs params", () => {
    const router = createRouter<Routes, "level">("level", { id: 9 });
    expect(router.current).toEqual({ name: "level", params: { id: 9 } });
  });

  it("returns a copy of the stack", () => {
    const router = createRouter<Routes>("home");
    (router.stack as unknown[]).push("x");
    expect(router.stack).toHaveLength(1);
  });

  it("notifies subscribers with the action and supports unsubscribe", () => {
    const router = createRouter<Routes>("home");
    const listener = vi.fn();
    const off = router.subscribe(listener);
    router.push("settings");
    router.replace("level", { id: 1 });
    router.pop();
    router.push("settings");
    router.popTo("home");
    router.reset("home");
    expect(listener.mock.calls.map(([, action]) => action)).toEqual([
      "push",
      "replace",
      "pop",
      "push",
      "pop",
      "reset",
    ]);
    off();
    router.push("settings");
    expect(listener).toHaveBeenCalledTimes(6);
  });

  it("does not notify when popTo is already on the target", () => {
    const router = createRouter<Routes>("home");
    const listener = vi.fn();
    router.subscribe(listener);
    router.popTo("home");
    expect(listener).not.toHaveBeenCalled();
  });

  it("enforces params at compile time", () => {
    const router = createRouter<Routes>("home");
    expectTypeOf(router.push<"level">).parameters.toEqualTypeOf<
      [name: "level", params: { id: number }]
    >();
    expectTypeOf(router.push<"settings">).parameters.toEqualTypeOf<
      [name: "settings", params?: undefined]
    >();
  });
});

describe("back handling", () => {
  it("pops screens and returns false at the root", () => {
    const router = createRouter<Routes>("home");
    router.push("settings");
    expect(router.handleBack()).toBe(true);
    expect(router.handleBack()).toBe(false);
  });

  it("lets the newest interceptor consume the press first", () => {
    const router = createRouter<Routes>("home");
    router.push("settings");
    const older = vi.fn(() => true);
    const newer = vi.fn(() => true);
    router.pushBackInterceptor(older);
    const removeNewer = router.pushBackInterceptor(newer);
    expect(router.handleBack()).toBe(true);
    expect(newer).toHaveBeenCalledTimes(1);
    expect(older).not.toHaveBeenCalled();
    expect(names(router)).toEqual(["home", "settings"]);
    removeNewer();
    router.handleBack();
    expect(older).toHaveBeenCalledTimes(1);
  });

  it("falls through declining interceptors and removes them cleanly", () => {
    const router = createRouter<Routes>("home");
    router.push("settings");
    const decline = vi.fn(() => false);
    const remove = router.pushBackInterceptor(decline);
    expect(router.handleBack()).toBe(true);
    expect(decline).toHaveBeenCalledTimes(1);
    expect(router.current.name).toBe("home");
    remove();
    remove();
    expect(router.handleBack()).toBe(false);
    expect(decline).toHaveBeenCalledTimes(1);
  });
});

describe("hooks", () => {
  it("useCurrentScreen re-renders on navigation", async () => {
    const router = createRouter<Routes>("home");
    function View() {
      const screen = useCurrentScreen(router);
      return <p data-testid="screen">{screen.name}</p>;
    }
    const root = document.createElement("div");
    await act(() => render(<View />, root));
    expect(root.textContent).toBe("home");
    await act(() => router.push("settings"));
    expect(root.textContent).toBe("settings");
    await act(() => void router.pop());
    expect(root.textContent).toBe("home");
    await act(() => render(null, root));
  });

  it("useBackInterceptor is active only while requested", async () => {
    const router = createRouter<Routes>("home");
    router.push("settings");
    const handler = vi.fn(() => true);
    function Sheet({ open }: { open: boolean }) {
      useBackInterceptor(router, open, handler);
      return null;
    }
    const root = document.createElement("div");
    await act(() => render(<Sheet open={true} />, root));
    expect(router.handleBack()).toBe(true);
    expect(handler).toHaveBeenCalledTimes(1);
    expect(router.current.name).toBe("settings");
    await act(() => render(<Sheet open={false} />, root));
    expect(router.handleBack()).toBe(true);
    expect(router.current.name).toBe("home");
    await act(() => render(null, root));
  });
});
