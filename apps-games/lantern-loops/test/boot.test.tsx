import { createMemoryAdapter } from "@web-games/kit";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createBoot } from "../src/app/boot";
import { createFlagsStore, FLAGS_KEY, parseFlags } from "../src/save/flags";
import { createServices } from "../src/services";
import { FONT_FACES } from "../src/theme/fonts";
import { createTestEnv, flush, mountApp, removeAnimate } from "./helpers/env";

afterEach(() => {
  document.body.replaceChildren();
  removeAnimate();
});

describe("createBoot", () => {
  it("registers the fonts, loads the saves and preloads delivered art with rising progress", async () => {
    const services = createServices({
      adapter: createMemoryAdapter(),
      now: () => new Date(2026, 9, 19),
    });
    const register = vi.fn(async () => ({ families: ["Fraunces", "Nunito"], failed: [] }));
    const preload = vi.fn(
      async (
        urls: readonly string[],
        options?: { onProgress?: (p: { fraction: number }) => void },
      ) => {
        options?.onProgress?.({ fraction: 0.5 });
        options?.onProgress?.({ fraction: 1 });
        return { loaded: [...urls], failed: [] };
      },
    );
    const seen: number[] = [];
    await createBoot(services, {
      urls: () => ["/a.webp", "/b.webp"],
      register: register as never,
      preload: preload as never,
    })((fraction) => seen.push(fraction));
    expect(register).toHaveBeenCalledWith(FONT_FACES);
    expect(preload).toHaveBeenCalledTimes(1);
    expect(seen).toEqual([...seen].sort((a, b) => a - b));
    expect(seen[seen.length - 1]).toBe(1);
    expect(services.progression.current().freezeWeek).toBe("2026-W43");
  });

  it("skips the preload when no art file exists yet", async () => {
    const services = createServices({
      adapter: createMemoryAdapter(),
      now: () => new Date(2026, 9, 19),
    });
    const preload = vi.fn();
    await createBoot(services, {
      urls: () => [],
      register: (async () => ({ families: [], failed: [] })) as never,
      preload: preload as never,
    })(() => undefined);
    expect(preload).not.toHaveBeenCalled();
  });
});

describe("boot screen", () => {
  it("shows progress while loading and still reaches the next screen when loading fails", async () => {
    const test = await createTestEnv({ fixture: "mid", route: { name: "boot" } });
    let release: () => void = () => undefined;
    test.env.boot = (onProgress) =>
      new Promise<void>((_resolve, reject) => {
        onProgress(0.4);
        release = () => reject(new Error("preload failed"));
      });
    const app = await mountApp(test.env);
    await flush(4);
    const bar = app.container.querySelector("[role='progressbar']");
    expect(bar?.getAttribute("aria-valuenow")).toBe("0.4");
    expect(app.container.textContent).toContain("Lighting the lanterns");
    expect(test.router.current.name).toBe("boot");
    release();
    await flush(8);
    expect(test.router.current.name).toBe("home");
    app.unmount();
  });
});

describe("ui flags", () => {
  it("remembers coach cards across sessions", async () => {
    const adapter = createMemoryAdapter();
    const first = createFlagsStore(adapter);
    expect(await first.hasSeen("bridge-01")).toBe(false);
    await first.markSeen("bridge-01");
    await first.markSeen("bridge-01");
    const second = createFlagsStore(adapter);
    expect(await second.hasSeen("bridge-01")).toBe(true);
    expect(JSON.parse(adapter.entries.get(FLAGS_KEY) as string).data.coachSeen).toEqual([
      "bridge-01",
    ]);
    await second.clear();
    expect(await createFlagsStore(adapter).hasSeen("bridge-01")).toBe(false);
  });

  it("rejects malformed flag data", () => {
    expect(parseFlags(null)).toBeNull();
    expect(parseFlags({ coachSeen: [1] })).toBeNull();
    expect(parseFlags({})).toEqual({ coachSeen: [] });
  });
});
