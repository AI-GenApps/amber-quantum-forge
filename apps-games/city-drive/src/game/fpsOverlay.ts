export interface FpsReadout {
  fps: number;
  drawCalls: number;
  triangles: number;
}

export function formatFps(readout: FpsReadout): string {
  const tris =
    readout.triangles >= 1000
      ? `${(readout.triangles / 1000).toFixed(1)}k`
      : `${readout.triangles}`;
  return `${Math.round(readout.fps)} fps | ${readout.drawCalls} draws | ${tris} tris`;
}

/** Small corner readout for `?fps`. Refreshes at most every `intervalMs`. */
export class FpsOverlay {
  private readonly element: HTMLElement;
  private lastMs = Number.NEGATIVE_INFINITY;

  constructor(
    host: HTMLElement,
    private readonly read: () => FpsReadout,
    private readonly intervalMs = 500,
  ) {
    this.element = host.ownerDocument.createElement("div");
    this.element.setAttribute("data-testid", "fps-overlay");
    this.element.style.cssText =
      "position:fixed;top:8px;left:8px;padding:4px 8px;border-radius:6px;" +
      "background:rgba(0,0,0,0.55);color:#9f9;font:12px/1.2 monospace;pointer-events:none;z-index:20";
    host.appendChild(this.element);
  }

  update(nowMs: number): void {
    if (nowMs - this.lastMs < this.intervalMs) return;
    this.lastMs = nowMs;
    this.element.textContent = formatFps(this.read());
  }

  dispose(): void {
    this.element.remove();
  }
}
