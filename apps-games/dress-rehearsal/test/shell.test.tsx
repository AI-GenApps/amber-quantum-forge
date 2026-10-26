import type { Lifecycle } from "@web-games/kit";
import { act } from "preact/test-utils";
import { afterEach, describe, expect, it } from "vitest";
import { buttonByText, click, currentScreen, mountApp, q, type Rig, text } from "./helpers";
import { card, openTab, piece, slotEl, startBoard } from "./play";

let rig: Rig | null = null;

afterEach(() => {
  rig?.unmount();
  rig = null;
  document.body.replaceChildren();
  document.documentElement.removeAttribute("data-motion");
  document.documentElement.removeAttribute("data-contrast");
});

function fakeLifecycle() {
  let handler: (() => boolean) | null = null;
  let onExit: (() => void) | null = null;
  const lifecycle: Pick<Lifecycle, "onBack"> = {
    onBack(next, options) {
      handler = next;
      onExit = options?.onExit ?? null;
      return () => {
        handler = null;
      };
    },
  };
  return {
    lifecycle,
    press: () => {
      const handled = handler?.() ?? false;
      if (!handled) onExit?.();
    },
  };
}

describe("shell", () => {
  it("routes the hardware back button through the router and asks before quitting at the root", async () => {
    const fake = fakeLifecycle();
    let exited = 0;
    rig = await mountApp({
      route: ["home"],
      lifecycle: fake.lifecycle,
      exitApp: () => {
        exited += 1;
      },
    });
    rig.app.router.push("chapters");
    await rig.flush();
    await act(() => fake.press());
    expect(currentScreen(rig)).toBe("home");
    await act(() => fake.press());
    expect(text(q(document.body, ".dr-sheet"))).toContain("Leave Dress Rehearsal?");
    await click(buttonByText(document.body, "Cancel"));
    expect(exited).toBe(0);
    await act(() => fake.press());
    await click(buttonByText(document.body, "Leave"));
    expect(exited).toBe(1);
  });

  it("honours the system reduced motion preference as well as the setting", async () => {
    rig = await mountApp({ route: ["home"], systemReducedMotion: true });
    expect(document.documentElement.dataset.motion).toBe("reduced");
    rig.unmount();
    rig = await mountApp({ route: ["home"], settings: { reducedMotion: true } });
    expect(document.documentElement.dataset.motion).toBe("reduced");
    rig.unmount();
    rig = await mountApp({ route: ["home"] });
    expect(document.documentElement.dataset.motion).toBe("full");
  });

  it("marks only a matching slot as a valid drop target while dragging", async () => {
    rig = await mountApp({ route: ["styling", { challengeId: "riv-01" }] });
    await startBoard();
    await openTab(rig, "hat");
    const hat = card(rig, piece("item-riviera-7").id);
    const original = document.elementFromPoint;
    const over = { el: slotEl(rig, "hat") as Element | null };
    document.elementFromPoint = (() => over.el) as typeof document.elementFromPoint;
    try {
      await act(() => {
        hat.dispatchEvent(
          new PointerEvent("pointerdown", {
            bubbles: true,
            clientX: 5,
            clientY: 5,
            pointerId: 1,
            button: 0,
          }),
        );
      });
      await act(() => {
        window.dispatchEvent(
          new PointerEvent("pointermove", {
            bubbles: true,
            clientX: 90,
            clientY: 90,
            pointerId: 1,
          }),
        );
      });
      expect(slotEl(rig, "hat").dataset.over).toBe("true");
      expect(q(document.body, "[data-testid='ghost']").getAttribute("style")).toContain(
        "left: 90px",
      );
      over.el = slotEl(rig, "top");
      await act(() => {
        window.dispatchEvent(
          new PointerEvent("pointermove", {
            bubbles: true,
            clientX: 95,
            clientY: 95,
            pointerId: 1,
          }),
        );
      });
      expect(slotEl(rig, "top").dataset.over).toBe("invalid");
      expect(slotEl(rig, "hat").dataset.over).toBe("false");
      await act(() => {
        window.dispatchEvent(
          new PointerEvent("pointercancel", {
            bubbles: true,
            clientX: 95,
            clientY: 95,
            pointerId: 1,
          }),
        );
      });
    } finally {
      document.elementFromPoint = original;
    }
    expect(document.body.querySelector("[data-testid='ghost']")).toBeNull();
    expect(slotEl(rig, "hat").dataset.filled).toBe("false");
    expect(slotEl(rig, "top").dataset.filled).toBe("false");
  });

  it("highlights the slot that takes the selected piece", async () => {
    rig = await mountApp({ route: ["styling", { challengeId: "riv-01" }] });
    await startBoard();
    await openTab(rig, "bag");
    await click(card(rig, "item-riviera-6"));
    expect(slotEl(rig, "bag").dataset.target).toBe("true");
    expect(slotEl(rig, "hat").dataset.target).toBe("false");
    expect(card(rig, "item-riviera-6").getAttribute("aria-pressed")).toBe("true");
    await click(card(rig, "item-riviera-6"));
    expect(slotEl(rig, "bag").dataset.target).toBe("false");
  });

  it("disables the tabs of categories the brief does not open", async () => {
    rig = await mountApp({ route: ["styling", { challengeId: "riv-01" }] });
    await startBoard();
    const tabs = Array.from(rig.container.querySelectorAll<HTMLButtonElement>("[role='tab']"));
    const state = Object.fromEntries(tabs.map((tab) => [tab.textContent, tab.disabled]));
    expect(state).toEqual({
      Tops: false,
      Bottoms: false,
      Dresses: true,
      Outerwear: true,
      Shoes: false,
      Bags: false,
      Hats: false,
      Extras: false,
    });
  });

  it("ignores board shortcuts while a sheet is open", async () => {
    rig = await mountApp({ route: ["styling", { challengeId: "riv-01" }] });
    await startBoard();
    await openTab(rig, "hat");
    await click(card(rig, "item-riviera-7"));
    await click(slotEl(rig, "hat"));
    expect(slotEl(rig, "hat").dataset.filled).toBe("true");
    await click(buttonByText(rig.container, "Pause"));
    const dialog = q(document.body, "[role='dialog']");
    await act(() => {
      dialog.dispatchEvent(
        new KeyboardEvent("keydown", { key: "z", ctrlKey: true, bubbles: true, cancelable: true }),
      );
    });
    expect(slotEl(rig, "hat").dataset.filled).toBe("true");
  });
});
