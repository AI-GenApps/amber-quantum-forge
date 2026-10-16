export type CanvasLike = { getContext(id: string): unknown };

export type WebGlSupport = { supported: true } | { supported: false; reason: string };

/** The game needs WebGL2. This probes it on a throwaway canvas, never on the game canvas. */
export function detectWebGl2(createCanvas: () => CanvasLike): WebGlSupport {
  try {
    const context = createCanvas().getContext("webgl2");
    if (context) return { supported: true };
    return { supported: false, reason: "This browser did not give the game a WebGL2 context." };
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    return { supported: false, reason: `WebGL2 could not be started (${detail}).` };
  }
}
