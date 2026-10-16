import { ImpactStyle, NotificationType } from "@capacitor/haptics";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  capacitorDriver,
  createDriver,
  type HapticEvent,
  HapticsService,
  noopDriver,
  playEvent,
  vibrationDriver,
} from "../../src/haptics";
import { VIBRATE_MS } from "../../src/haptics/drivers";

afterEach(() => vi.restoreAllMocks());

function plugin() {
  return {
    impact: vi.fn(async () => undefined),
    notification: vi.fn(async () => undefined),
  };
}

describe("capacitor driver", () => {
  const cases: [HapticEvent, "impact" | "notification", unknown][] = [
    ["collision", "impact", { style: ImpactStyle.Medium }],
    ["checkpoint", "impact", { style: ImpactStyle.Light }],
    ["pickup", "impact", { style: ImpactStyle.Light }],
    ["success", "notification", { type: NotificationType.Success }],
    ["fail", "notification", { type: NotificationType.Error }],
  ];

  it.each(cases)("%s calls plugin.%s with the planned style", async (event, method, args) => {
    const p = plugin();
    await playEvent(capacitorDriver(p), event);
    expect(p[method]).toHaveBeenCalledWith(args);
    const other = method === "impact" ? "notification" : "impact";
    expect(p[other]).not.toHaveBeenCalled();
  });
});

describe("HapticsService", () => {
  it("fires events while vibration is on", () => {
    const p = plugin();
    new HapticsService(capacitorDriver(p), () => true).trigger("collision");
    expect(p.impact).toHaveBeenCalledTimes(1);
  });

  it("does nothing while vibration is off, and follows the setting live", () => {
    const p = plugin();
    let on = false;
    const service = new HapticsService(capacitorDriver(p), () => on);
    service.trigger("success");
    service.trigger("collision");
    expect(p.impact).not.toHaveBeenCalled();
    expect(p.notification).not.toHaveBeenCalled();
    on = true;
    service.trigger("success");
    expect(p.notification).toHaveBeenCalledTimes(1);
  });

  it("logs a failing driver once and keeps the game running", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const bad = {
      impact: () => Promise.reject(new Error("no taptic engine")),
      notification: () => {
        throw new Error("sync failure");
      },
    };
    const service = new HapticsService(bad, () => true);
    expect(() => service.trigger("collision")).not.toThrow();
    expect(() => service.trigger("fail")).not.toThrow();
    service.trigger("pickup");
    await new Promise((r) => setTimeout(r, 0));
    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0]?.[0])).toContain("haptic");
  });
});

describe("web fallback", () => {
  it("vibrates with a short pulse for impacts and a pattern for notifications", () => {
    const vibrate = vi.fn(() => true);
    const driver = vibrationDriver({ vibrate });
    void playEvent(driver, "collision");
    void playEvent(driver, "pickup");
    void playEvent(driver, "success");
    void playEvent(driver, "fail");
    expect(vibrate.mock.calls).toEqual([
      [VIBRATE_MS.medium],
      [VIBRATE_MS.light],
      [VIBRATE_MS.success],
      [VIBRATE_MS.error],
    ]);
  });

  it("is a no-op that never throws", () => {
    for (const event of ["collision", "checkpoint", "pickup", "success", "fail"] as const) {
      expect(() => playEvent(noopDriver, event)).not.toThrow();
    }
  });
});

describe("createDriver", () => {
  it("uses the Capacitor plugin on a device, even when navigator.vibrate exists", async () => {
    const p = plugin();
    const vibrate = vi.fn(() => true);
    const driver = createDriver({
      isNative: () => true,
      navigator: () => ({ vibrate }),
      plugin: p,
    });
    await playEvent(driver, "collision");
    expect(p.impact).toHaveBeenCalledTimes(1);
    expect(vibrate).not.toHaveBeenCalled();
  });

  it("uses navigator.vibrate in a browser that has it", () => {
    const vibrate = vi.fn(() => true);
    const driver = createDriver({ isNative: () => false, navigator: () => ({ vibrate }) });
    void playEvent(driver, "pickup");
    expect(vibrate).toHaveBeenCalledWith(VIBRATE_MS.light);
  });

  it("falls back to the no-op without a device or a vibrate function", () => {
    expect(createDriver({ isNative: () => false, navigator: () => ({}) })).toBe(noopDriver);
    expect(createDriver({ isNative: () => false, navigator: () => undefined })).toBe(noopDriver);
  });
});
