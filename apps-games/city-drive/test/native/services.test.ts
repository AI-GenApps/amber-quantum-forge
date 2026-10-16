import { describe, expect, it, vi } from "vitest";
import { createNativeServices, type NativeEnv } from "../../src/native";
import { WebLifecycleSource } from "../../src/native/lifecycle";
import { FakeApp, FakePrompt } from "./fakes";

function env(native: boolean): { env: NativeEnv; plugins: ReturnType<typeof vi.fn>; app: FakeApp } {
  const app = new FakeApp();
  const plugins = vi.fn(() => ({
    app,
    keepAwake: {
      keepAwake: vi.fn(async () => undefined),
      allowSleep: vi.fn(async () => undefined),
    },
    statusBar: { hide: vi.fn(async () => undefined), show: vi.fn(async () => undefined) },
    orientation: { lock: vi.fn(async () => undefined) },
  }));
  const target = { addEventListener: vi.fn(), removeEventListener: vi.fn(), hidden: false };
  return {
    app,
    plugins,
    env: {
      isNative: () => native,
      plugins,
      browser: { document: target as never, window: target as never },
      exitPrompt: new FakePrompt(),
    },
  };
}

describe("native services", () => {
  it("are web no-ops in a browser and never load a plugin", async () => {
    const { env: e, plugins } = env(false);
    const services = createNativeServices(e);
    expect(services.native).toBe(false);
    expect(services.lifecycle).toBeInstanceOf(WebLifecycleSource);
    expect(services.deviceBack).toBeUndefined();
    expect(() => services.keepAwake.set(true)).not.toThrow();
    await expect(services.display.enterGameDisplay()).resolves.toBeUndefined();
    expect(plugins).not.toHaveBeenCalled();
  });

  it("use the device plugins on a device", async () => {
    const { env: e, app } = env(true);
    const services = createNativeServices(e);
    expect(services.native).toBe(true);
    expect(services.deviceBack).toBeDefined();
    services.deviceBack?.onBack(() => true);
    await Promise.resolve();
    expect(app.count("backButton")).toBe(1);
    const stop = services.lifecycle.subscribe({
      onPause: () => undefined,
      onResume: () => undefined,
    });
    await Promise.resolve();
    expect(app.count("pause")).toBe(1);
    stop();
  });
});
