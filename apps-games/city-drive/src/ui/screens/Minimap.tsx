import { useLayoutEffect, useRef } from "preact/hooks";
import type { AppController } from "../controller";
import {
  drawMinimap,
  type Minimap2D,
  type MinimapColours,
  type MinimapModel,
} from "../model/minimap";
import { MINIMAP_HZ, RateLimiter } from "../model/rate";

/** Canvas size in device-independent pixels; CSS scales it with the root font size. */
const MINIMAP_PX = 160;

const FALLBACK: MinimapColours = {
  road: "#5d6a99",
  player: "#ffc21a",
  objective: "#3ddc97",
  marker: "#f5f7ff",
};

/** Reads the minimap colours from the design tokens so the stylesheet stays the one source. */
function coloursFrom(element: Element): MinimapColours {
  const style = getComputedStyle(element);
  const read = (name: string, fallback: string): string =>
    style.getPropertyValue(name).trim() || fallback;
  return {
    road: read("--color-road", FALLBACK.road),
    player: read("--color-accent", FALLBACK.player),
    objective: read("--color-ok", FALLBACK.objective),
    marker: read("--color-text", FALLBACK.marker),
  };
}

/**
 * Top-down map drawn on a 2D canvas from the district's road tiles, at 10 Hz and independent of
 * how often the rest of the HUD re-renders. It is fed by the controller's frame hook.
 */
export function Minimap({ controller, model }: { controller: AppController; model: MinimapModel }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const element = canvas.current;
    const ctx = element?.getContext("2d") as Minimap2D | null | undefined;
    if (!element || !ctx) return undefined;
    const colours = coloursFrom(element);
    const limiter = new RateLimiter(MINIMAP_HZ);
    return controller.onFrame((play, nowMs) => {
      if (!play || !limiter.due(nowMs)) return;
      drawMinimap(
        ctx,
        model,
        {
          player: play.player.position,
          forward: play.player.forward,
          objective: play.hud.objective,
          markers: play.markers,
        },
        { width: MINIMAP_PX, height: MINIMAP_PX },
        colours,
      );
    });
  }, [controller, model]);
  return (
    <canvas
      ref={canvas}
      class="cd-minimap"
      width={MINIMAP_PX}
      height={MINIMAP_PX}
      role="img"
      aria-label="Minimap"
    />
  );
}
