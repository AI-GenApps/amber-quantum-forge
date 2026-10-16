// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from "vitest";
import { showUnsupported, UNSUPPORTED_ID } from "../../src/support/unsupported";
import { detectWebGl2 } from "../../src/support/webgl";

afterEach(() => {
  document.body.innerHTML = "";
});

describe("WebGL2 detection", () => {
  it("reports support when getContext returns a context", () => {
    expect(detectWebGl2(() => ({ getContext: () => ({}) }))).toEqual({ supported: true });
  });

  it("asks for a webgl2 context specifically", () => {
    const asked: string[] = [];
    detectWebGl2(() => ({
      getContext: (id) => {
        asked.push(id);
        return {};
      },
    }));
    expect(asked).toEqual(["webgl2"]);
  });

  it("is unsupported when a real canvas getContext is stubbed to return null", () => {
    const canvas = document.createElement("canvas");
    canvas.getContext = (() => null) as typeof canvas.getContext;
    const result = detectWebGl2(() => canvas);
    expect(result.supported).toBe(false);
    if (!result.supported) expect(result.reason).toContain("WebGL2");
  });

  it("is unsupported (not a crash) when getContext throws", () => {
    const result = detectWebGl2(() => ({
      getContext: () => {
        throw new Error("blocked by policy");
      },
    }));
    expect(result).toEqual({
      supported: false,
      reason: "WebGL2 could not be started (blocked by policy).",
    });
  });
});

describe("unsupported screen", () => {
  it("replaces the page content with a readable message", () => {
    document.body.innerHTML = '<canvas id="game"></canvas><div id="ui"><p>old</p></div>';
    const ui = document.getElementById("ui") as HTMLElement;
    const screen = showUnsupported(ui, "Street Royale", "No context.");
    expect(ui.querySelector("p")?.textContent).not.toBe("old");
    expect(screen.id).toBe(UNSUPPORTED_ID);
    expect(screen.getAttribute("role")).toBe("alert");
    expect(screen.querySelector("h1")?.textContent).toBe("Street Royale cannot start here");
    expect(screen.textContent).toContain("WebGL2");
    expect(screen.textContent).toContain("No context.");
  });
});

describe("start-up guard", () => {
  it("shows the fallback and removes the game canvas when getContext returns null", async () => {
    const { ensureWebGl2 } = await import("../../src/support/guard");
    document.body.innerHTML = '<canvas id="game"></canvas><div id="ui"></div>';
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = (() => null) as typeof original;
    try {
      const ui = document.getElementById("ui") as HTMLElement;
      expect(ensureWebGl2(document, ui)).toBe(false);
      expect(document.getElementById(UNSUPPORTED_ID)).not.toBeNull();
      expect(document.getElementById("game")).toBeNull();
    } finally {
      HTMLCanvasElement.prototype.getContext = original;
    }
  });

  it("lets the game start when WebGL2 is available", async () => {
    const { ensureWebGl2 } = await import("../../src/support/guard");
    document.body.innerHTML = '<canvas id="game"></canvas><div id="ui"></div>';
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = (() => ({})) as unknown as typeof original;
    try {
      const ui = document.getElementById("ui") as HTMLElement;
      expect(ensureWebGl2(document, ui)).toBe(true);
      expect(document.getElementById(UNSUPPORTED_ID)).toBeNull();
      expect(document.getElementById("game")).not.toBeNull();
    } finally {
      HTMLCanvasElement.prototype.getContext = original;
    }
  });
});
