import { ImpactStyle as CapImpact, NotificationType } from "@capacitor/haptics";
import { describe, expect, it, vi } from "vitest";
import {
  capacitorDriver,
  createDefaultDriver,
  createHaptics,
  type HapticsDriver,
  type HapticsPlugin,
  noopDriver,
} from "./haptics";

function fakeDriver(): HapticsDriver & { calls: string[] } {
  const calls: string[] = [];
  return {
    name: "fake",
    calls,
    impact: (style) => void calls.push(`impact:${style}`),
    notification: (kind) => void calls.push(`notification:${kind}`),
    selection: () => void calls.push("selection"),
  };
}

function fakePlugin() {
  return {
    impact: vi.fn(async (_o: { style: CapImpact }) => undefined),
    notification: vi.fn(async (_o: { type: NotificationType }) => undefined),
    selectionStart: vi.fn(async () => undefined),
    selectionChanged: vi.fn(async () => undefined),
    selectionEnd: vi.fn(async () => undefined),
  } satisfies HapticsPlugin;
}

describe("haptics wrapper", () => {
  it("forwards calls to the driver with a light default", () => {
    const driver = fakeDriver();
    const haptics = createHaptics({ driver });
    haptics.impact();
    haptics.impact("heavy");
    haptics.notify("success");
    haptics.selection();
    expect(driver.calls).toEqual([
      "impact:light",
      "impact:heavy",
      "notification:success",
      "selection",
    ]);
    expect(haptics.driverName).toBe("fake");
  });

  it("stays silent when the setting is off and resumes when it is on", () => {
    const driver = fakeDriver();
    const haptics = createHaptics({ driver });
    haptics.syncSettings({ haptics: false });
    haptics.impact();
    haptics.notify("error");
    haptics.selection();
    expect(driver.calls).toEqual([]);
    haptics.syncSettings({ haptics: true });
    haptics.impact();
    expect(driver.calls).toEqual(["impact:light"]);
  });

  it("can start disabled", () => {
    const driver = fakeDriver();
    createHaptics({ driver, enabled: false }).impact();
    expect(driver.calls).toEqual([]);
  });

  it("never throws into game code and reports driver errors", async () => {
    const onError = vi.fn();
    const boom = new Error("boom");
    const haptics = createHaptics({
      onError,
      driver: {
        name: "bad",
        impact: () => {
          throw boom;
        },
        notification: async () => {
          throw boom;
        },
        selection: () => undefined,
      },
    });
    expect(() => haptics.impact()).not.toThrow();
    expect(() => haptics.notify("warning")).not.toThrow();
    await Promise.resolve();
    await Promise.resolve();
    expect(onError).toHaveBeenCalledTimes(2);
  });

  it("swallows errors when no handler is given", async () => {
    const haptics = createHaptics({
      driver: { ...noopDriver, notification: () => Promise.reject(new Error("x")) },
    });
    haptics.notify("success");
    await Promise.resolve();
  });
});

describe("capacitor driver", () => {
  it("maps styles and kinds onto the plugin", async () => {
    const plugin = fakePlugin();
    const driver = capacitorDriver(plugin);
    await driver.impact("medium");
    await driver.notification("warning");
    await driver.selection();
    expect(plugin.impact).toHaveBeenCalledWith({ style: CapImpact.Medium });
    expect(plugin.notification).toHaveBeenCalledWith({ type: NotificationType.Warning });
    expect(plugin.selectionChanged).toHaveBeenCalledTimes(1);
  });

  it("covers every style and kind", async () => {
    const plugin = fakePlugin();
    const driver = capacitorDriver(plugin);
    for (const style of ["light", "medium", "heavy"] as const) await driver.impact(style);
    for (const kind of ["success", "warning", "error"] as const) await driver.notification(kind);
    expect(plugin.impact.mock.calls.map(([o]) => o.style)).toEqual([
      CapImpact.Light,
      CapImpact.Medium,
      CapImpact.Heavy,
    ]);
    expect(plugin.notification.mock.calls.map(([o]) => o.type)).toEqual([
      NotificationType.Success,
      NotificationType.Warning,
      NotificationType.Error,
    ]);
  });
});

describe("default driver", () => {
  it("is the web no-op unless native with the plugin", () => {
    expect(createDefaultDriver({ isNative: () => false, pluginAvailable: () => true })).toBe(
      noopDriver,
    );
    expect(createDefaultDriver({ isNative: () => true, pluginAvailable: () => false })).toBe(
      noopDriver,
    );
    expect(createDefaultDriver({ isNative: () => true, pluginAvailable: () => true }).name).toBe(
      "capacitor",
    );
  });

  it("is the no-op in the test environment and silently accepts calls", () => {
    const haptics = createHaptics();
    expect(haptics.driverName).toBe("noop");
    expect(() => {
      haptics.impact();
      haptics.notify("success");
      haptics.selection();
    }).not.toThrow();
  });
});
