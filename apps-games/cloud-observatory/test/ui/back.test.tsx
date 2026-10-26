import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, goTab, openScreen, renderApp } from "./harness";

afterEach(cleanup);

describe("back button", () => {
  it("closes an open sheet first, then pops the screen, then asks to leave on Observe", async () => {
    const onExit = vi.fn();
    const r = await renderApp({ props: { onExit } });
    await openScreen(r, "achievements");
    expect(r.router.current.name).toBe("achievements");

    await r.click(r.q("button[aria-label='Back']"));
    expect(r.router.current.name).toBe("shell");

    await r.click(r.q("button[aria-label='Menu']"));
    expect(r.container.querySelector("[role='dialog']")).not.toBeNull();
    expect(r.lifecycle.back()).toBe(true);
    await r.flush();
    expect(r.container.querySelector("[role='dialog']")).toBeNull();
    expect(r.router.current.name).toBe("shell");

    await r.click(r.q("button[aria-label='Menu']"));
    const settings = Array.from(r.qa("[role='dialog'] button")).find(
      (b) => b.textContent === "Settings",
    );
    await r.click(settings ?? null);
    expect(r.router.current.name).toBe("settings");
    expect(r.lifecycle.back()).toBe(true);
    await r.flush();
    expect(r.router.current.name).toBe("shell");
    expect(r.container.querySelector("[role='dialog']")).toBeNull();

    expect(r.lifecycle.back()).toBe(true);
    await r.flush();
    expect(r.q("[data-sheet='exit']")).toBeTruthy();
    expect(onExit).not.toHaveBeenCalled();

    expect(r.lifecycle.back()).toBe(true);
    await r.flush();
    expect(r.container.querySelector("[data-sheet='exit']")).toBeNull();

    expect(r.lifecycle.back()).toBe(true);
    await r.flush();
    const leave = Array.from(r.qa("[data-sheet='exit'] button")).find(
      (b) => b.textContent === "Leave",
    );
    await r.click(leave ?? null);
    await new Promise((resolve) => setTimeout(resolve, 20));
    await r.flush();
    expect(onExit).toHaveBeenCalledTimes(1);
    expect(r.router.current.name).toBe("title");
  });

  it("Stay keeps the observatory open", async () => {
    const r = await renderApp({});
    r.lifecycle.back();
    await r.flush();
    const stay = Array.from(r.qa("[data-sheet='exit'] button")).find(
      (b) => b.textContent === "Stay",
    );
    await r.click(stay ?? null);
    expect(r.router.current.name).toBe("shell");
    expect(r.container.querySelector("[data-sheet='exit']")).toBeNull();
  });

  it("from another tab the first back press returns to Observe", async () => {
    const r = await renderApp({ seed: "mid" });
    await goTab(r, "atlas");
    expect(r.q("[role='tab'][aria-selected='true']").textContent).toBe("Atlas");
    expect(r.lifecycle.back()).toBe(true);
    await r.flush();
    expect(r.q("[role='tab'][aria-selected='true']").textContent).toBe("Observe");
    expect(r.container.querySelector("[data-sheet='exit']")).toBeNull();
    r.lifecycle.back();
    await r.flush();
    expect(r.q("[data-sheet='exit']")).toBeTruthy();
  });

  it("the journal reader closes before anything else", async () => {
    const r = await renderApp({ seed: "mid" });
    await goTab(r, "journal");
    await r.click(r.q("[data-entry='lore-01']"));
    expect(r.q("[data-reading]")).toBeTruthy();
    r.lifecycle.back();
    await r.flush();
    expect(r.container.querySelector("[data-reading]")).toBeNull();
    expect(r.q("[role='tab'][aria-selected='true']").textContent).toBe("Journal");
    r.lifecycle.back();
    await r.flush();
    expect(r.q("[role='tab'][aria-selected='true']").textContent).toBe("Observe");
  });

  it("leaving a chart with back abandons it", async () => {
    const r = await renderApp({ seed: { game: { starlight: 100, owned: { telescope: 2 } } } });
    await goTab(r, "atlas");
    await r.click(r.q("li[data-constellation='lyre'] .co-card-atlas__action"));
    await r.click(r.q('[data-star="0"]'));
    expect(r.harness.session.snapshot().chart?.next).toBe(1);
    r.lifecycle.back();
    await r.flush();
    expect(r.router.current.name).toBe("shell");
    expect(r.harness.session.snapshot().chart).toBeNull();
  });

  it("on the title screen the press is left to the app (exit)", async () => {
    const r = await renderApp({ start: "title" });
    expect(r.lifecycle.back()).toBe(false);
  });

  it("a pushed How to Play from the title pops back to it", async () => {
    const r = await renderApp({ start: "title" });
    await r.click(Array.from(r.qa("button")).find((b) => b.textContent === "How to Play") ?? null);
    expect(r.router.current.name).toBe("howto");
    expect(r.lifecycle.back()).toBe(true);
    await r.flush();
    expect(r.router.current.name).toBe("title");
  });
});
