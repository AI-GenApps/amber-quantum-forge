import type { Draw2D } from "./Draw2D";
import {
  type DrawOptions,
  drawBackground,
  drawCanals,
  drawDepthLabels,
  drawFields,
  drawHaze,
  drawShore,
  drawTerrain,
  drawWater,
} from "./draw";
import { drawBadges, drawCursor, drawGhost, drawSelection } from "./drawOverlay";
import { drawHouses, drawPieces, drawScenery } from "./drawPieces";
import type { Geometry } from "./geometry";
import type { BoardView } from "./model";

export function renderBoard(
  ctx: Draw2D,
  view: BoardView,
  geom: Geometry,
  options: DrawOptions,
): void {
  drawBackground(ctx, geom, options);
  drawTerrain(ctx, view, geom, options);
  drawFields(ctx, view, geom, options);
  drawCanals(ctx, view, geom, options);
  drawWater(ctx, view, geom, options);
  drawShore(ctx, view, geom, options);
  drawHaze(ctx, view, geom, options);
  drawScenery(ctx, view, geom, options);
  drawHouses(ctx, view, geom, options);
  drawPieces(ctx, view, geom, options);
  drawDepthLabels(ctx, view, geom, options);
  drawGhost(ctx, view.ghost, view, geom, options);
  drawBadges(ctx, view, geom, options);
  drawSelection(ctx, view.selected, geom, options);
  drawCursor(ctx, view.cursor, geom, options);
}
