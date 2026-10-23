import type { MapDef, Placement } from "@web-games/floodplain-dispatch-core";
import { describe, expect, it } from "vitest";
import {
  type DrawOptions,
  drawBackground,
  drawCanals,
  drawDepthLabels,
  drawFields,
  drawShore,
  drawTerrain,
  drawWater,
} from "../src/board/draw";
import {
  BADGE_FILL,
  drawBadge,
  drawCursor,
  drawGhost,
  drawSelection,
} from "../src/board/drawOverlay";
import { drawHouses, drawPlacedPiece, drawPumpArrow, gateIsOpen } from "../src/board/drawPieces";
import { cellOrigin, makeGeometry } from "../src/board/geometry";
import { buildView } from "../src/board/model";
import { renderBoard } from "../src/board/render";
import { DEFAULT_MAP_THEME, landColor, mapThemeFor } from "../src/theme/mapThemes";
import { RecordingContext } from "./helpers";

const fixture: MapDef = {
  layout: ["I3 .2 .1 S0", ".2 H1 F1 .0"],
  inlets: [2],
  houseKinds: ["cottage"],
  events: [],
  tide: null,
  weeks: 4,
  pieces: ["canal", "pump", "gate"],
  par: 1,
  budget: 4,
};

const geom = makeGeometry(4, 2, { width: 160, height: 100 });
const options: DrawOptions = {
  theme: DEFAULT_MAP_THEME,
  highContrast: false,
  reducedMotion: true,
  time: 0,
};
const highOptions: DrawOptions = { ...options, highContrast: true };

function depthsWith(entries: Record<number, number>): Uint8Array {
  const depths = new Uint8Array(8);
  for (const [index, depth] of Object.entries(entries)) depths[Number(index)] = depth;
  return depths;
}

describe("geometry of the fixture", () => {
  it("uses a whole-pixel cell and centres the board", () => {
    expect(geom.cell).toBe(37);
    expect(geom.originX).toBe(6);
    expect(geom.originY).toBe(13);
  });
});

describe("terrain, fields and water", () => {
  it("paints each cell by height with top-left light strips", () => {
    const view = buildView({ def: fixture, placements: [] });
    const ctx = new RecordingContext();
    drawBackground(ctx, geom, options);
    expect(ctx.ops[0]).toEqual({ op: "clearRect", args: [0, 0, 160, 100] });
    expect(ctx.calls("fillRect")[0]).toEqual([0, 0, 160, 100, options.theme.background]);
    ctx.reset();
    drawTerrain(ctx, view, geom, options);
    const rects = ctx.calls("fillRect");
    expect(rects[0]).toEqual([6, 13, 37, 37, landColor(options.theme, 3)]);
    const edge = 4;
    expect(rects[1]).toEqual([6 + 37 - edge, 13, edge, 37, options.theme.lightShadow]);
    expect(rects[2]).toEqual([6, 13 + 37 - edge, 37, edge, options.theme.lightShadow]);
    expect(ctx.calls("fillRect").filter((r) => r[4] === options.theme.lightHighlight)).toHaveLength(
      0,
    );
  });

  it("lights the west and north edges of a cell that rises above its neighbours", () => {
    const rise = { ...fixture, layout: ["I1 .4 .1 S0", ".1 H1 F1 .0"] };
    const ctx = new RecordingContext();
    drawTerrain(ctx, buildView({ def: rise, placements: [] }), geom, options);
    const lit = ctx.calls("fillRect").filter((r) => r[4] === options.theme.lightHighlight);
    const origin = cellOrigin(geom, 1, 0);
    expect(lit).toContainEqual([origin.px, origin.py, 4, 37, options.theme.lightHighlight]);
  });

  it("draws crop rows on field cells", () => {
    const view = buildView({ def: fixture, placements: [] });
    const ctx = new RecordingContext();
    drawFields(ctx, view, geom, options);
    const origin = cellOrigin(geom, 2, 1);
    expect(ctx.calls("fillRect")).toEqual([
      [origin.px, origin.py, 37, 37, options.theme.fieldBase],
    ]);
    expect(ctx.count("moveTo")).toBe(4);
    expect(ctx.calls("stroke")[0]?.[0]).toBe(options.theme.fieldRow);
  });

  it("colours water by depth, draws sea waves and the inlet spring, and no hatching normally", () => {
    const view = buildView({ def: fixture, placements: [], depths: depthsWith({ 5: 1, 6: 3 }) });
    const ctx = new RecordingContext();
    drawWater(ctx, view, geom, options);
    const fills = ctx.calls("fillRect").map((r) => r[4]);
    expect(fills).toContain(options.theme.sea);
    expect(fills).toContain(options.theme.waterMid);
    expect(fills).toContain(options.theme.waterShallow);
    expect(ctx.count("clip")).toBe(0);
    expect(ctx.count("arc")).toBeGreaterThanOrEqual(3);
  });

  it("adds hatching and thicker shores in high contrast", () => {
    const view = buildView({
      def: fixture,
      placements: [],
      depths: depthsWith({ 5: 1, 6: 3, 4: 6 }),
    });
    const normal = new RecordingContext();
    const high = new RecordingContext();
    drawWater(normal, view, geom, options);
    drawWater(high, view, geom, highOptions);
    expect(normal.count("clip")).toBe(0);
    expect(high.count("clip")).toBe(3);
    expect(high.count("lineTo")).toBeGreaterThan(normal.count("lineTo"));
    const shoreNormal = new RecordingContext();
    const shoreHigh = new RecordingContext();
    drawShore(shoreNormal, view, geom, options);
    drawShore(shoreHigh, view, geom, highOptions);
    expect(shoreNormal.calls("stroke")[0]?.[1]).toBe(2);
    expect(shoreHigh.calls("stroke")[0]?.[1]).toBeCloseTo(3.6);
  });

  it("outlines only the edges where water meets land", () => {
    const view = buildView({ def: fixture, placements: [] });
    const ctx = new RecordingContext();
    drawShore(ctx, view, geom, options);
    expect(ctx.count("moveTo")).toBe(4);
    expect(ctx.calls("stroke")[0]?.[0]).toBe(options.theme.shore);
  });

  it("writes depth numbers on paper chips only in high contrast", () => {
    const view = buildView({ def: fixture, placements: [], depths: depthsWith({ 5: 2, 6: 7 }) });
    const normal = new RecordingContext();
    drawDepthLabels(normal, view, geom, options);
    expect(normal.ops).toEqual([]);
    const high = new RecordingContext();
    drawDepthLabels(high, view, geom, highOptions);
    expect(high.calls("fillText").map((c) => c[0])).toEqual(["2", "7"]);
    expect(high.calls("fillRect")).toHaveLength(2);
  });

  it("animates the sea only when motion is allowed", () => {
    const view = buildView({ def: fixture, placements: [] });
    const still = (time: number) => {
      const ctx = new RecordingContext();
      drawWater(ctx, view, geom, { ...options, reducedMotion: true, time });
      return ctx.calls("moveTo");
    };
    expect(still(0)).toEqual(still(300));
    const moving = (time: number) => {
      const ctx = new RecordingContext();
      drawWater(ctx, view, geom, { ...options, reducedMotion: false, time });
      return ctx.calls("moveTo");
    };
    expect(moving(0)).not.toEqual(moving(300));
  });
});

describe("pieces", () => {
  const canal: Placement = { x: 1, y: 0, kind: "canal" };

  it("carves a canal groove that joins the neighbouring inlet", () => {
    const view = buildView({ def: fixture, placements: [canal] });
    const ctx = new RecordingContext();
    drawCanals(ctx, view, geom, options);
    const rects = ctx.calls("fillRect");
    expect(rects.length).toBeGreaterThanOrEqual(4);
    const origin = cellOrigin(geom, 1, 0);
    expect(
      rects.every(
        (r) => (r[0] as number) >= origin.px - 0.01 && (r[0] as number) <= origin.px + 37,
      ),
    ).toBe(true);
  });

  it("draws houses from their fallback shapes at the cell, or from a loaded image", () => {
    const view = buildView({ def: fixture, placements: [] });
    const shapes = new RecordingContext();
    drawHouses(shapes, view, geom, options);
    const origin = cellOrigin(geom, 1, 1);
    expect(shapes.calls("translate")[0]).toEqual([origin.px, origin.py]);
    expect(shapes.count("drawImage")).toBe(0);
    const image = { name: "cottage" };
    const art = new RecordingContext();
    drawHouses(art, view, geom, { ...options, images: { "house-cottage": image } });
    expect(art.calls("drawImage")[0]?.[0]).toBe(image);
    expect(art.count("fill")).toBe(0);
  });

  it("lights windows only on the night theme", () => {
    const view = buildView({ def: fixture, placements: [] });
    const night = new RecordingContext();
    drawHouses(night, view, geom, { ...options, theme: mapThemeFor("night-lantern") });
    const day = new RecordingContext();
    drawHouses(day, view, geom, options);
    expect(night.count("arc")).toBe(day.count("arc") + 2);
  });

  it("turns the pump arrow to face N, E, S and W", () => {
    const angles = (["N", "E", "S", "W"] as const).map((dir) => {
      const ctx = new RecordingContext();
      drawPumpArrow(ctx, 0, 0, 40, dir, options);
      return ctx.calls("rotate")[0]?.[0];
    });
    expect(angles).toEqual([0, Math.PI / 2, Math.PI, -Math.PI / 2]);
  });

  it("shows a gate as open or closed from the week", () => {
    const gate: Placement = { x: 1, y: 0, kind: "gate", opensWeek: 1, closesWeek: 3 };
    expect(gateIsOpen(gate, 4, 0)).toBe(false);
    expect(gateIsOpen(gate, 4, 1)).toBe(true);
    expect(gateIsOpen(gate, 4, 3)).toBe(false);
    expect(gateIsOpen({ x: 0, y: 0, kind: "gate" }, 4, 3)).toBe(true);
    expect(gateIsOpen(gate, 4, null)).toBe(true);
    const open = new RecordingContext();
    const closed = new RecordingContext();
    drawPlacedPiece(open, gate, 4, 1, geom, options);
    drawPlacedPiece(closed, gate, 4, 0, geom, options);
    expect(open.count("moveTo")).toBeLessThan(closed.count("moveTo"));
  });

  it("skips canals (drawn as grooves) and draws a pump with its arrow", () => {
    const ctx = new RecordingContext();
    drawPlacedPiece(ctx, canal, 4, null, geom, options);
    expect(ctx.ops).toEqual([]);
    drawPlacedPiece(ctx, { x: 1, y: 0, kind: "pump", dir: "S" }, 4, null, geom, options);
    expect(ctx.count("rotate")).toBe(1);
  });
});

describe("overlays", () => {
  it("draws badges with a distinct fill and glyph per kind", () => {
    const fills = new Set<string>();
    const shapes = new Set<number>();
    for (const kind of ["supplied", "irrigated", "flooded", "dry"] as const) {
      const ctx = new RecordingContext();
      drawBadge(ctx, { x: 1, y: 1, kind, target: "house" }, geom, options);
      fills.add(BADGE_FILL[kind]);
      expect(ctx.calls("fill").map((c) => c[0])).toContain(BADGE_FILL[kind]);
      shapes.add(ctx.count("lineTo") * 100 + ctx.count("moveTo"));
    }
    expect(fills.size).toBe(4);
    expect(shapes.size).toBeGreaterThanOrEqual(3);
  });

  it("draws the ghost with a dashed outline and the cursor with a double ring", () => {
    const view = buildView({ def: fixture, placements: [] });
    const ghost = new RecordingContext();
    drawGhost(ghost, { x: 1, y: 0, kind: "canal" }, view, geom, options);
    expect(ghost.calls("setLineDash")[0]).toEqual([[4, 3]]);
    expect(ghost.count("strokeRect")).toBe(1);
    const none = new RecordingContext();
    drawGhost(none, null, view, geom, options);
    expect(none.ops).toEqual([]);
    const cursor = new RecordingContext();
    drawCursor(cursor, { x: 2, y: 0 }, geom, options);
    expect(cursor.count("strokeRect")).toBe(2);
    drawSelection(cursor, { x: 2, y: 0 }, geom, highOptions);
    expect(cursor.count("strokeRect")).toBe(4);
    const empty = new RecordingContext();
    drawCursor(empty, null, geom, options);
    drawSelection(empty, null, geom, options);
    expect(empty.ops).toEqual([]);
  });
});

describe("renderBoard", () => {
  const placements: Placement[] = [{ x: 1, y: 0, kind: "canal" }];
  const view = buildView({
    def: fixture,
    placements,
    depths: depthsWith({ 1: 2 }),
    cursor: { x: 1, y: 1 },
    ghost: { x: 2, y: 0, kind: "canal" },
    badges: [{ x: 1, y: 1, kind: "supplied", target: "house" }],
  });

  it("paints in a fixed layer order ending with the cursor", () => {
    const ctx = new RecordingContext();
    renderBoard(ctx, view, geom, options);
    expect(ctx.ops[0]?.op).toBe("clearRect");
    const rings = ctx.ops.filter((o) => o.op === "strokeRect");
    expect(rings.at(-1)?.args[4]).toBe("#f4ecd8");
    expect(rings.at(-2)?.args[4]).toBe("#1f2b22");
    expect(ctx.count("save")).toBe(ctx.count("restore"));
  });

  it("produces different draw calls with the high-contrast flag", () => {
    const normal = new RecordingContext();
    const high = new RecordingContext();
    renderBoard(normal, view, geom, options);
    renderBoard(high, view, geom, highOptions);
    expect(normal.count("clip")).toBe(0);
    expect(high.count("clip")).toBeGreaterThan(0);
    expect(normal.count("fillText")).toBe(0);
    expect(high.count("fillText")).toBe(1);
    const widths = (ctx: RecordingContext) => ctx.calls("stroke").map((c) => c[1] as number);
    expect(Math.max(...widths(high))).toBeGreaterThan(Math.max(...widths(normal)));
  });

  it("changes the terrain colours with the selected theme", () => {
    const meadow = new RecordingContext();
    const blueprint = new RecordingContext();
    renderBoard(meadow, view, geom, options);
    renderBoard(blueprint, view, geom, { ...options, theme: mapThemeFor("paper-blueprint") });
    const firstTerrain = (ctx: RecordingContext) => ctx.calls("fillRect")[1]?.[4];
    expect(firstTerrain(meadow)).not.toBe(firstTerrain(blueprint));
  });

  it("is deterministic for the same input", () => {
    const a = new RecordingContext();
    const b = new RecordingContext();
    renderBoard(a, view, geom, options);
    renderBoard(b, view, geom, options);
    expect(a.ops).toEqual(b.ops);
  });
});
