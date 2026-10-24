import { defaultProfile } from "@web-games/the-last-window-core";
import { afterEach, describe, expect, it } from "vitest";
import { createPreload } from "../src/boot/preload";
import { FONT_FACES } from "../src/fonts";
import { shareText } from "../src/screens/Result";
import { buildSummary } from "../src/screens/resultSummary";
import { resultParams, shiftResult } from "./fixtures";
import { clickByText, currentScreen, mountApp, q, type Rig, text } from "./helpers";

let rig: Rig | null = null;

afterEach(() => {
  rig?.unmount();
  rig = null;
  document.body.replaceChildren();
});

describe("preload", () => {
  it("registers both font faces and reports a rising fraction that ends at 1", async () => {
    const seen: number[] = [];
    await createPreload({ manifest: [] })((fraction) => seen.push(fraction));
    const css = document.getElementById("wg-fonts")?.textContent ?? "";
    for (const face of FONT_FACES) expect(css).toContain(face.src);
    expect(css).toContain('"Young Serif"');
    expect(css).toContain('"Nunito Sans"');
    expect(seen[0]).toBe(0);
    expect(seen.at(-1)).toBe(1);
    expect([...seen].sort((a, b) => a - b)).toEqual(seen);
  });

  it("loads the listed art with progress and survives a failing image", async () => {
    const seen: number[] = [];
    const loaded: string[] = [];
    await createPreload({
      manifest: ["key-art", "interior-evening", "drink-1", "icon"],
      loader: async (url) => {
        if (url.includes("drink-1")) throw new Error("missing");
        loaded.push(url);
      },
    })((fraction) => seen.push(fraction));
    expect(loaded.sort()).toEqual(["/art/interior-evening.webp", "/art/key-art.webp"]);
    expect(seen.at(-1)).toBe(1);
    expect(Math.max(...seen.slice(0, -1))).toBeLessThanOrEqual(1);
  });

  it("makes the title wait for the preload before offering Tap to begin", async () => {
    let finish: () => void = () => undefined;
    const gate = new Promise<void>((resolve) => {
      finish = resolve;
    });
    rig = await mountApp({
      route: ["title"],
      preload: async (onProgress) => {
        onProgress(0.4);
        await gate;
        onProgress(1);
      },
    });
    expect(q(rig.container, "[role='status']").textContent).toBe("Lighting the lamp: 40 percent");
    expect(q(rig.container, "[role='progressbar']").getAttribute("aria-valuenow")).toBe("40");
    expect(rig.container.querySelector("button")).toBeNull();
    finish();
    await rig.flush();
    await clickByText(rig.container, "Tap to begin");
    expect(currentScreen(rig)).toBe("home");
  });
});

describe("motion and results", () => {
  it("honours the system reduced motion preference and the setting", async () => {
    rig = await mountApp({ route: ["home"], systemReducedMotion: true });
    expect(document.documentElement.dataset.motion).toBe("reduced");
    rig.unmount();
    rig = await mountApp({ route: ["home"] });
    expect(document.documentElement.dataset.motion).toBe("full");
    rig.unmount();
    rig = await mountApp({ route: ["home"], settings: { reducedMotion: true } });
    expect(document.documentElement.dataset.motion).toBe("reduced");
  });

  it("offers the Lantern Night finale after the last result without scenes", async () => {
    rig = await mountApp({
      route: ["result", resultParams({ day: 14 })],
      profile: { day: 15 },
    });
    await clickByText(rig.container, "Lantern Night");
    expect(q(rig.container, "[data-testid='finale-title']").textContent).toBe("Lantern Night");
    await clickByText(rig.container, "Back to the shop");
    expect(currentScreen(rig)).toBe("home");
  });

  it("shows Late Shift results with the lamp and streak bonus rows and shares the Late text", async () => {
    const summary = buildSummary({
      kind: "late",
      day: 15,
      dateKey: "2026-10-21",
      result: shiftResult({ kind: "late", day: 15, coins: 70, longestDelightedRun: 5 }),
      events: [],
      queue: [],
      remainder: [],
      lamp: 15,
      streakBonus: 4,
      profile: defaultProfile(),
    });
    expect(shareText(summary)).toBe(
      "The Last Window, Late Shift 2026-10-21: 3/3 stars, 89 coins, 5 delighted in a row.",
    );
    rig = await mountApp({
      route: ["result", { target: { kind: "late" }, summary, finale: false }],
      profile: { day: 15 },
      shareResult: { path: "navigator", ok: true, cancelled: false },
    });
    const table = text(q(rig.container, "[data-testid='earnings']"));
    expect(table).toContain("Lamp Bonus15");
    expect(table).toContain("Streak bonus4");
    expect(table).toContain("89 coins");
    expect(q(rig.container, "[data-testid='result-title']").textContent).toBe(
      "Late Shift complete",
    );
    await clickByText(rig.container, "Share");
    expect(rig.container.textContent).toContain("Shared.");
    await clickByText(rig.container, "Back to the shop");
    expect(currentScreen(rig)).toBe("home");
  });

  it("explains a failed share and stays quiet when the player cancels", async () => {
    rig = await mountApp({
      route: ["result", resultParams()],
      shareResult: { path: "unavailable", ok: false, cancelled: false },
    });
    await clickByText(rig.container, "Share");
    expect(rig.container.textContent).toContain("Sharing is not available here.");
    rig.unmount();
    rig = await mountApp({
      route: ["result", resultParams()],
      shareResult: { path: "navigator", ok: false, cancelled: true },
    });
    await clickByText(rig.container, "Share");
    expect(rig.container.querySelector(".wg-toast")).toBeNull();
  });
});
