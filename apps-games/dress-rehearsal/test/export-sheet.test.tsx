import { afterEach, describe, expect, it } from "vitest";
import { all, buttonByText, click, mountApp, q, type Rig, text } from "./helpers";
import { RIV01_LOOK, settle, startBoard, tapPlace } from "./play";

let rig: Rig | null = null;

afterEach(() => {
  rig?.unmount();
  rig = null;
  document.body.replaceChildren();
});

async function openExport(options: Parameters<typeof mountApp>[0] = {}): Promise<Rig> {
  rig = await mountApp({ route: ["styling", { challengeId: "riv-01" }], ...options });
  await startBoard();
  for (const id of RIV01_LOOK) await tapPlace(rig, id);
  await click(buttonByText(rig.container, "Finish look"));
  await settle(rig);
  await click(buttonByText(document.body, "Export image"));
  return rig;
}

const frameButton = (name: string): HTMLButtonElement =>
  q<HTMLButtonElement>(document.body, `.dr-frame[data-frame='${name}']`);

describe("export sheet", () => {
  it("previews the plain frame and lists four frames with prices", async () => {
    const r = await openExport();
    expect(q(document.body, "[data-testid='export-preview']").getAttribute("width")).toBe("1080");
    expect(r.exporter.previewContext.count("fillText")).toBeGreaterThan(8);
    const frames = all<HTMLButtonElement>(document.body, ".dr-frame");
    expect(frames.map((f) => text(f))).toEqual([
      "PlainOwned",
      "Paper Border30 coins",
      "Polaroid40 coins",
      "Magazine Cover60 coins",
    ]);
    expect(frames[0]?.getAttribute("aria-pressed")).toBe("true");
    expect(buttonByText(document.body, "Share").disabled).toBe(false);
    expect(document.body.querySelector(".dr-export__buy")).toBeNull();
  });

  it("previews a locked frame but only exports it after the purchase", async () => {
    const r = await openExport({ profile: { coins: 100 } });
    r.exporter.previewContext.reset();
    await click(frameButton("paper"));
    expect(frameButton("paper").getAttribute("aria-pressed")).toBe("true");
    expect(r.exporter.previewContext.count("strokeRect")).toBe(3);
    expect(buttonByText(document.body, "Share").disabled).toBe(true);
    expect(buttonByText(document.body, "Save to device").disabled).toBe(true);
    await click(buttonByText(document.body, "Buy this frame for 30 coins"));
    await settle(r);
    const profile = r.app.game.getState().profile;
    expect(profile.coins).toBe(100 + 35 - 30);
    expect(profile.framesOwned).toEqual(["plain", "paper"]);
    expect(profile.frameSelected).toBe("paper");
    expect(text(q(document.body, "[data-testid='export-note']"))).toBe("Paper Border is yours.");
    expect(document.body.querySelector(".dr-export__buy")).toBeNull();
    expect(buttonByText(document.body, "Share").disabled).toBe(false);
    expect(text(frameButton("paper"))).toContain("Owned");
  });

  it("explains when a frame cannot be afforded", async () => {
    const r = await openExport({ profile: { coins: 0 } });
    await click(frameButton("magazine"));
    await click(buttonByText(document.body, "Buy this frame for 60 coins"));
    await settle(r);
    expect(text(q(document.body, "[data-testid='export-note']"))).toBe(
      "Not enough coins for this frame.",
    );
    expect(r.app.game.getState().profile.framesOwned).toEqual(["plain"]);
    expect(r.app.game.getState().profile.coins).toBe(35);
  });

  it("selects an owned frame and keeps the choice", async () => {
    const r = await openExport({
      profile: { framesOwned: ["plain", "polaroid"], frameSelected: "plain" },
    });
    await click(frameButton("polaroid"));
    await settle(r);
    expect(r.app.game.getState().profile.frameSelected).toBe("polaroid");
    expect(r.exporter.previewContext.calls("fillRect").some((args) => args[4] === "#d3dde0")).toBe(
      true,
    );
  });

  it("shares the image file with the share text and counts the export", async () => {
    const r = await openExport({ fileShare: "ok" });
    await click(buttonByText(document.body, "Share"));
    await settle(r);
    expect(r.exporter.shares).toHaveLength(1);
    expect(r.exporter.shares[0]?.text).toBe(
      'Dress Rehearsal - Riviera Summer "Harbour Lunch": 3/3 stars, harmony 83, styled for Mireille Vasseur.',
    );
    expect(r.exporter.shares[0]?.files?.[0]?.type).toBe("image/png");
    expect(text(q(document.body, "[data-testid='export-note']"))).toBe("Shared.");
    expect(r.app.game.getState().profile.stats.boardsExported).toBe(1);
    expect(r.exporter.canvases).toHaveLength(1);
    expect(r.exporter.canvases[0]?.context.count("fillText")).toBe(10);
  });

  it("downloads the image and sends the text through the kit share without file sharing", async () => {
    const r = await openExport({ fileShare: "none" });
    await click(buttonByText(document.body, "Share"));
    await settle(r);
    expect(r.exporter.downloads).toHaveLength(1);
    expect(r.exporter.downloads[0]?.name).toBe("dress-rehearsal-riviera-summer-harbour-lunch.png");
    expect(r.shared).toHaveLength(1);
    expect(r.shared[0]?.text).toContain("3/3 stars");
    expect(text(q(document.body, "[data-testid='export-note']"))).toBe(
      "Image saved to your device. Share text sent.",
    );
    expect(r.app.game.getState().profile.stats.boardsExported).toBe(1);
  });

  it("handles a cancelled share without counting an export", async () => {
    const r = await openExport({ fileShare: "abort" });
    await click(buttonByText(document.body, "Share"));
    await settle(r);
    expect(text(q(document.body, "[data-testid='export-note']"))).toBe("Sharing cancelled.");
    expect(r.app.game.getState().profile.stats.boardsExported).toBe(0);
    expect(r.exporter.downloads).toEqual([]);
  });

  it("still saves the image when the share text cannot be sent", async () => {
    const r = await openExport({
      fileShare: "none",
      shareResult: { path: "unavailable", ok: false, cancelled: false },
    });
    await click(buttonByText(document.body, "Share"));
    await settle(r);
    expect(r.exporter.downloads).toHaveLength(1);
    expect(text(q(document.body, "[data-testid='export-note']"))).toBe(
      "Image saved to your device.",
    );
    expect(r.app.game.getState().profile.stats.boardsExported).toBe(1);
  });

  it("saves to the device from the picker and returns to the result", async () => {
    const r = await openExport();
    await click(buttonByText(document.body, "Save to device"));
    await settle(r);
    expect(r.exporter.downloads).toHaveLength(1);
    expect(r.app.game.getState().profile.stats.boardsExported).toBe(1);
    await click(buttonByText(document.body, "Done"));
    expect(document.body.querySelector("[data-testid='export']")).toBeNull();
    expect(q(document.body, "[data-testid='result']")).toBeTruthy();
  });

  it("closes with the back button before anything else", async () => {
    const r = await openExport();
    const { act } = await import("preact/test-utils");
    await act(() => {
      r.app.router.handleBack();
    });
    expect(document.body.querySelector("[data-testid='export']")).toBeNull();
    expect(r.app.router.current.name).toBe("styling");
  });
});
