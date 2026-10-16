import { type CityMap, tileCenter } from "@city-drive/core/city";
import type { Point2 } from "./arrow";

/** The static part of the minimap: where the road tiles are. Built once per district. */
export interface MinimapModel {
  /** World-space centre of every road tile. */
  roads: Point2[];
  tileSize: number;
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export function buildMinimapModel(map: CityMap): MinimapModel {
  const roads = map.tiles
    .filter((t) => t.kind === "road")
    .map((t) => {
      const c = tileCenter(map, t.x, t.y);
      return { x: c.x, z: c.z };
    });
  const half = map.tile_size_m / 2;
  const xs = roads.map((p) => p.x);
  const zs = roads.map((p) => p.z);
  return {
    roads,
    tileSize: map.tile_size_m,
    minX: Math.min(...xs) - half,
    maxX: Math.max(...xs) + half,
    minZ: Math.min(...zs) - half,
    maxZ: Math.max(...zs) + half,
  };
}

export interface Projector {
  /** Pixels per metre. */
  scale: number;
  project(point: Point2): { x: number; y: number };
}

const PADDING_PX = 4;

/** Fits the model into a `width` x `height` canvas, centred, north up (world -z is up). */
export function minimapProjector(model: MinimapModel, width: number, height: number): Projector {
  const w = Math.max(1, model.maxX - model.minX);
  const h = Math.max(1, model.maxZ - model.minZ);
  const scale = Math.min((width - PADDING_PX * 2) / w, (height - PADDING_PX * 2) / h);
  const offsetX = (width - w * scale) / 2;
  const offsetY = (height - h * scale) / 2;
  return {
    scale,
    project: (p) => ({
      x: offsetX + (p.x - model.minX) * scale,
      y: offsetY + (p.z - model.minZ) * scale,
    }),
  };
}

/** The slice of CanvasRenderingContext2D the minimap uses, so tests can pass a recorder. */
export interface Minimap2D {
  fillStyle: string | CanvasGradient | CanvasPattern;
  strokeStyle: string | CanvasGradient | CanvasPattern;
  lineWidth: number;
  clearRect(x: number, y: number, w: number, h: number): void;
  fillRect(x: number, y: number, w: number, h: number): void;
  beginPath(): void;
  closePath(): void;
  moveTo(x: number, y: number): void;
  lineTo(x: number, y: number): void;
  arc(x: number, y: number, r: number, start: number, end: number): void;
  fill(): void;
  stroke(): void;
}

export interface MinimapFrame {
  player: Point2;
  /** Unit heading on the ground plane. */
  forward: Point2;
  objective: Point2 | undefined;
  /** Free-roam mission starts. */
  markers: readonly Point2[];
}

export interface MinimapColours {
  road: string;
  player: string;
  objective: string;
  marker: string;
}

/** Draws roads, markers, the objective and the player's arrow. Clears the canvas first. */
export function drawMinimap(
  ctx: Minimap2D,
  model: MinimapModel,
  frame: MinimapFrame,
  size: { width: number; height: number },
  colours: MinimapColours,
): void {
  const fit = minimapProjector(model, size.width, size.height);
  ctx.clearRect(0, 0, size.width, size.height);
  ctx.fillStyle = colours.road;
  const side = model.tileSize * fit.scale;
  for (const road of model.roads) {
    const at = fit.project(road);
    ctx.fillRect(at.x - side / 2, at.y - side / 2, side, side);
  }
  ctx.fillStyle = colours.marker;
  for (const marker of frame.markers) {
    const at = fit.project(marker);
    ctx.beginPath();
    ctx.arc(at.x, at.y, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  if (frame.objective) {
    const at = fit.project(frame.objective);
    ctx.fillStyle = colours.objective;
    ctx.beginPath();
    ctx.arc(at.x, at.y, 5, 0, Math.PI * 2);
    ctx.fill();
  }
  const me = fit.project(frame.player);
  const { x: fx, z: fz } = frame.forward;
  const len = Math.hypot(fx, fz) || 1;
  const ux = fx / len;
  const uy = fz / len;
  ctx.fillStyle = colours.player;
  ctx.beginPath();
  ctx.moveTo(me.x + ux * 7, me.y + uy * 7);
  ctx.lineTo(me.x - ux * 5 - uy * 4.5, me.y - uy * 5 + ux * 4.5);
  ctx.lineTo(me.x - ux * 5 + uy * 4.5, me.y - uy * 5 - ux * 4.5);
  ctx.closePath();
  ctx.fill();
}
