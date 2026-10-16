// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vitest";
import { soundButtonTaps } from "../../src/audio/uiTaps";
import { unlockOnFirstGesture } from "../../src/audio/unlock";

afterEach(() => vi.restoreAllMocks());

describe("unlockOnFirstGesture", () => {
  it("unlocks once on the first gesture, then stops listening", async () => {
    const target = { unlock: vi.fn(async () => undefined) };
    unlockOnFirstGesture(window, target);
    window.dispatchEvent(new Event("pointerdown"));
    window.dispatchEvent(new Event("keydown"));
    window.dispatchEvent(new Event("touchend"));
    await Promise.resolve();
    expect(target.unlock).toHaveBeenCalledTimes(1);
  });

  it("listens again after a failed unlock, with a logged warning", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const target = {
      unlock: vi
        .fn<() => Promise<void>>()
        .mockRejectedValueOnce(new Error("blocked"))
        .mockResolvedValue(undefined),
    };
    unlockOnFirstGesture(window, target);
    window.dispatchEvent(new Event("pointerdown"));
    await new Promise((r) => setTimeout(r, 0));
    expect(warn).toHaveBeenCalledTimes(1);
    window.dispatchEvent(new Event("pointerdown"));
    await new Promise((r) => setTimeout(r, 0));
    expect(target.unlock).toHaveBeenCalledTimes(2);
  });

  it("can be cancelled", () => {
    const target = { unlock: vi.fn(async () => undefined) };
    const stop = unlockOnFirstGesture(window, target);
    stop();
    window.dispatchEvent(new Event("pointerdown"));
    expect(target.unlock).not.toHaveBeenCalled();
  });
});

describe("soundButtonTaps", () => {
  function host(html: string): HTMLElement {
    const el = document.createElement("div");
    el.innerHTML = html;
    document.body.appendChild(el);
    return el;
  }

  it("taps for menu buttons, not for the driving controls, the horn or disabled buttons", () => {
    const el = host(`
      <button id="menu"><span id="inner">Play</span></button>
      <div data-no-tap="true"><button id="gas">Gas</button></div>
      <button id="horn" data-no-tap="true">Horn</button>
      <button id="off" disabled>Off</button>
      <p id="text">text</p>`);
    const onTap = vi.fn();
    const stop = soundButtonTaps(el, onTap);
    const click = (id: string) => (el.querySelector(`#${id}`) as HTMLElement).click();
    click("menu");
    click("inner");
    expect(onTap).toHaveBeenCalledTimes(2);
    for (const id of ["gas", "horn", "off", "text"]) click(id);
    expect(onTap).toHaveBeenCalledTimes(2);
    stop();
    click("menu");
    expect(onTap).toHaveBeenCalledTimes(2);
    el.remove();
  });
});
