// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { FpsOverlay, formatFps } from "../../src/game/fpsOverlay";

describe("formatFps", () => {
  it("shows fps, draw calls and triangles", () => {
    expect(formatFps({ fps: 59.6, drawCalls: 41, triangles: 83_450 })).toBe(
      "60 fps | 41 draws | 83.5k tris",
    );
    expect(formatFps({ fps: 30, drawCalls: 3, triangles: 640 })).toBe(
      "30 fps | 3 draws | 640 tris",
    );
  });
});

describe("FpsOverlay", () => {
  it("renders into the host and refreshes at most every interval", () => {
    const host = document.createElement("div");
    let reads = 0;
    const overlay = new FpsOverlay(
      host,
      () => {
        reads++;
        return { fps: 60, drawCalls: reads, triangles: 100 };
      },
      500,
    );
    overlay.update(0);
    overlay.update(100);
    overlay.update(499);
    expect(reads).toBe(1);
    overlay.update(500);
    expect(reads).toBe(2);
    expect(host.querySelector("[data-testid=fps-overlay]")?.textContent).toContain("2 draws");
    overlay.dispose();
    expect(host.querySelector("[data-testid=fps-overlay]")).toBeNull();
  });
});
