import { afterEach, describe, expect, it, vi } from "vitest";
import { capacitorDisplay, noopDisplay } from "../../src/native/display";
import { silenceErrors } from "./fakes";

afterEach(() => vi.restoreAllMocks());

describe("game display", () => {
  it("locks landscape and hides the status bar", async () => {
    const orientation = { lock: vi.fn(async () => undefined) };
    const statusBar = { hide: vi.fn(async () => undefined), show: vi.fn(async () => undefined) };
    await capacitorDisplay({ orientation, statusBar }).enterGameDisplay();
    expect(orientation.lock).toHaveBeenCalledWith({ orientation: "landscape" });
    expect(statusBar.hide).toHaveBeenCalledTimes(1);
    expect(statusBar.show).not.toHaveBeenCalled();
  });

  it("logs a failing plugin and still tries the other", async () => {
    const log = silenceErrors();
    const orientation = {
      lock: vi.fn(async () => {
        throw new Error("not supported");
      }),
    };
    const statusBar = { hide: vi.fn(async () => undefined), show: vi.fn(async () => undefined) };
    await capacitorDisplay({ orientation, statusBar }).enterGameDisplay();
    expect(statusBar.hide).toHaveBeenCalled();
    expect(log).toHaveBeenCalledTimes(1);
  });

  it("does nothing on the web", async () => {
    await expect(noopDisplay.enterGameDisplay()).resolves.toBeUndefined();
  });
});
