import { describe, expect, it, vi } from "vitest";
import {
  type CapacitorShareLike,
  defaultShareEnv,
  type NavigatorShareLike,
  shareContent,
} from "./share";

const content = {
  title: "Lantern Loops",
  text: "I cleared day 12",
  url: "https://example.invalid/x",
};

function plugin(overrides: Partial<CapacitorShareLike> = {}): CapacitorShareLike & {
  share: ReturnType<typeof vi.fn>;
} {
  return {
    canShare: vi.fn(async () => ({ value: true })),
    share: vi.fn(async () => ({ activityType: "x" })),
    ...overrides,
  } as CapacitorShareLike & { share: ReturnType<typeof vi.fn> };
}

describe("shareContent", () => {
  it("uses the Capacitor plugin first", async () => {
    const cap = plugin();
    const nav: NavigatorShareLike = { share: vi.fn(async () => undefined) };
    const result = await shareContent(content, { capacitor: cap, navigator: nav });
    expect(result).toEqual({ path: "capacitor", ok: true, cancelled: false });
    expect(cap.share).toHaveBeenCalledWith({ ...content, dialogTitle: "Lantern Loops" });
    expect(nav.share).not.toHaveBeenCalled();
  });

  it("falls back to navigator.share when the plugin cannot share", async () => {
    const cap = plugin({ canShare: vi.fn(async () => ({ value: false })) });
    const nav: NavigatorShareLike = { share: vi.fn(async () => undefined) };
    expect(await shareContent(content, { capacitor: cap, navigator: nav })).toEqual({
      path: "navigator",
      ok: true,
      cancelled: false,
    });
  });

  it("falls back when the plugin throws a real error", async () => {
    const cap = plugin({
      share: vi.fn(async () => {
        throw new Error("Plugin not implemented");
      }),
    });
    const nav: NavigatorShareLike = { share: vi.fn(async () => undefined) };
    expect((await shareContent(content, { capacitor: cap, navigator: nav })).path).toBe(
      "navigator",
    );
  });

  it("reports a cancelled native share without trying other routes", async () => {
    const cap = plugin({
      share: vi.fn(async () => {
        throw new Error("Share canceled");
      }),
    });
    const nav: NavigatorShareLike = { share: vi.fn(async () => undefined) };
    expect(await shareContent(content, { capacitor: cap, navigator: nav })).toEqual({
      path: "capacitor",
      ok: false,
      cancelled: true,
    });
    expect(nav.share).not.toHaveBeenCalled();
  });

  it("uses navigator.share on the web and honours canShare", async () => {
    const share = vi.fn(async () => undefined);
    expect((await shareContent(content, { navigator: { share, canShare: () => true } })).path).toBe(
      "navigator",
    );
    expect(share).toHaveBeenCalledWith(content);
    const writeText = vi.fn(async () => undefined);
    const blocked = await shareContent(content, {
      navigator: { share, canShare: () => false, clipboard: { writeText } },
    });
    expect(blocked.path).toBe("clipboard");
  });

  it("treats an AbortError from navigator.share as cancelled", async () => {
    const abort = Object.assign(new Error("dismissed"), { name: "AbortError" });
    const result = await shareContent(content, {
      navigator: {
        share: async () => {
          throw abort;
        },
        clipboard: { writeText: vi.fn() },
      },
    });
    expect(result).toEqual({ path: "navigator", ok: false, cancelled: true });
  });

  it("falls back to the clipboard when there is no navigator.share", async () => {
    const writeText = vi.fn(async () => undefined);
    const result = await shareContent(content, { navigator: { clipboard: { writeText } } });
    expect(result).toEqual({ path: "clipboard", ok: true, cancelled: false });
    expect(writeText).toHaveBeenCalledWith("I cleared day 12 https://example.invalid/x");
  });

  it("falls back to the clipboard when navigator.share fails for another reason", async () => {
    const writeText = vi.fn(async () => undefined);
    const result = await shareContent(content, {
      navigator: {
        share: async () => {
          throw new Error("NotAllowedError");
        },
        clipboard: { writeText },
      },
    });
    expect(result.path).toBe("clipboard");
  });

  it("reports unavailable when nothing works", async () => {
    const none = { path: "unavailable", ok: false, cancelled: false };
    expect(await shareContent(content, {})).toEqual(none);
    expect(await shareContent(content, { navigator: undefined })).toEqual(none);
    expect(
      await shareContent(content, {
        navigator: {
          clipboard: {
            writeText: async () => {
              throw new Error("denied");
            },
          },
        },
      }),
    ).toEqual(none);
    expect(await shareContent({}, { navigator: { clipboard: { writeText: vi.fn() } } })).toEqual(
      none,
    );
  });

  it("default environment skips the plugin on the web (happy-dom)", async () => {
    const env = defaultShareEnv();
    expect(env.capacitor).toBeNull();
    const writeText = vi.fn(async () => undefined);
    const result = await shareContent(content, { ...env, navigator: { clipboard: { writeText } } });
    expect(result.path).toBe("clipboard");
  });

  it("works against the default environment without throwing", async () => {
    await expect(shareContent(content)).resolves.toHaveProperty("path");
  });
});
