import { describe, expect, it, vi } from "vitest";
import { createMemoryAdapter } from "../save";
import {
  createSettingsStore,
  defaultSettings,
  sanitizeSettings,
  settingsSchema,
  systemPrefersReducedMotion,
} from "./settings";

describe("sanitizeSettings", () => {
  it("fills missing keys, ignores bad types and unknown keys", () => {
    expect(sanitizeSettings({})).toEqual(defaultSettings);
    expect(sanitizeSettings({ sound: false, music: "no", extra: true })).toEqual({
      ...defaultSettings,
      sound: false,
    });
  });

  it("rejects non-objects", () => {
    expect(sanitizeSettings(null)).toBeNull();
    expect(sanitizeSettings("x")).toBeNull();
    expect(sanitizeSettings([true])).toBeNull();
  });
});

describe("settings store", () => {
  it("starts with defaults and persists changes under a game-scoped key", async () => {
    const adapter = createMemoryAdapter();
    const settings = createSettingsStore(adapter, "lantern-loops");
    expect(settings.get()).toEqual(defaultSettings);
    await settings.set({ music: false, highContrast: true });
    expect(settings.get().music).toBe(false);
    const stored = JSON.parse(adapter.entries.get("lantern-loops.settings") ?? "");
    expect(stored).toEqual({
      v: 1,
      data: { ...defaultSettings, music: false, highContrast: true },
    });
  });

  it("restores saved settings on load", async () => {
    const adapter = createMemoryAdapter();
    await createSettingsStore(adapter, "g").set({ haptics: false });
    const again = createSettingsStore(adapter, "g");
    expect((await again.load()).haptics).toBe(false);
    expect(again.get().haptics).toBe(false);
  });

  it("recovers from corrupt data with defaults", async () => {
    const adapter = createMemoryAdapter({ "g.settings": "{bad" });
    const settings = createSettingsStore(adapter, "g");
    expect(await settings.load()).toEqual(defaultSettings);
  });

  it("repairs a stored object that has wrong value types", async () => {
    const adapter = createMemoryAdapter({
      "g.settings": JSON.stringify({ v: 1, data: { sound: 0, music: false } }),
    });
    expect(await createSettingsStore(adapter, "g").load()).toEqual({
      ...defaultSettings,
      music: false,
    });
  });

  it("notifies subscribers only for real changes and supports unsubscribe", async () => {
    const settings = createSettingsStore(createMemoryAdapter(), "g");
    const listener = vi.fn();
    const off = settings.subscribe(listener);
    await settings.set({ sound: false });
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenLastCalledWith({ ...defaultSettings, sound: false }, ["sound"]);
    await settings.set({ sound: false });
    expect(listener).toHaveBeenCalledTimes(1);
    off();
    await settings.set({ sound: true });
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("toggle flips one flag", async () => {
    const settings = createSettingsStore(createMemoryAdapter(), "g");
    await settings.toggle("reducedMotion");
    expect(settings.get().reducedMotion).toBe(true);
    await settings.toggle("reducedMotion");
    expect(settings.get().reducedMotion).toBe(false);
  });

  it("reset restores defaults and notifies", async () => {
    const settings = createSettingsStore(createMemoryAdapter(), "g");
    await settings.set({ sound: false, music: false });
    const listener = vi.fn();
    settings.subscribe(listener);
    await settings.reset();
    expect(settings.get()).toEqual(defaultSettings);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("get returns a copy that cannot corrupt the store", () => {
    const settings = createSettingsStore(createMemoryAdapter(), "g");
    const snapshot = settings.get() as { sound: boolean };
    snapshot.sound = false;
    expect(settings.get().sound).toBe(true);
  });

  it("combines the override with the system preference", async () => {
    const settings = createSettingsStore(createMemoryAdapter(), "g");
    expect(settings.effectiveReducedMotion()).toBe(false);
    expect(settings.effectiveReducedMotion(true)).toBe(true);
    await settings.set({ reducedMotion: true });
    expect(settings.effectiveReducedMotion(false)).toBe(true);
  });

  it("uses a save schema that exposes the key", () => {
    expect(settingsSchema("x").key).toBe("x.settings");
  });
});

describe("systemPrefersReducedMotion", () => {
  it("reads the media query", () => {
    expect(systemPrefersReducedMotion(() => ({ matches: true }))).toBe(true);
    expect(systemPrefersReducedMotion(() => ({ matches: false }))).toBe(false);
  });

  it("is false when matchMedia is missing or throws", () => {
    vi.stubGlobal("matchMedia", undefined);
    try {
      expect(systemPrefersReducedMotion()).toBe(false);
    } finally {
      vi.unstubAllGlobals();
    }
    expect(
      systemPrefersReducedMotion(() => {
        throw new Error("no");
      }),
    ).toBe(false);
  });
});
