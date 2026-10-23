import {
  budgetLeft,
  getMap,
  hashSeason,
  MAPS,
  type Placement,
  runSeason,
} from "@web-games/floodplain-dispatch-core";
import { describe, expect, it } from "vitest";
import {
  cellAt,
  cellCenter,
  FALLBACK_VIEWPORT,
  fitCellSize,
  linePath,
  makeGeometry,
  nextZoom,
  panToReveal,
  zoomLabel,
} from "../src/board/geometry";
import { nextHint } from "../src/session/hint";
import { keyAction } from "../src/session/keys";
import {
  beginStroke,
  canRedo,
  canUndo,
  clearPlan,
  emptyPlan,
  endStroke,
  erasePiece,
  placePiece,
  redo,
  rotateAt,
  setGateAt,
  undo,
} from "../src/session/plan";
import {
  advance,
  finished,
  scrubTo,
  setSpeed,
  startPlayback,
  tickDelay,
  togglePlaying,
} from "../src/session/playback";
import { badgesAt, buildTimeline, frameAt } from "../src/session/timeline";
import { availableTools, toolCost, toolForKey } from "../src/session/tools";

const v01 = getMap("v01");
const d01 = getMap("d01");

describe("plan", () => {
  it("places a piece, charges the budget and refuses illegal moves", () => {
    let plan = emptyPlan();
    const placed = placePiece(plan, v01, "canal", 1, 1);
    expect(placed.change).toBe("placed");
    plan = placed.state;
    expect(budgetLeft(v01, plan.placements)).toBe(v01.budget - 1);
    expect(placePiece(plan, v01, "canal", 1, 1).error).toBe("OCCUPIED");
    expect(placePiece(plan, v01, "canal", 0, 2).error).toBe("NOT_BUILDABLE");
    expect(placePiece(plan, v01, "canal", 1, 0).error).toBe("NOT_BUILDABLE");
    expect(placePiece(plan, v01, "pump", 3, 3).error).toBe("PIECE_UNAVAILABLE");
    expect(placePiece(plan, v01, "canal", 99, 0).error).toBe("OUT_OF_BOUNDS");
    let broke = emptyPlan();
    const cells: (readonly [number, number])[] = [
      [0, 1],
      [1, 1],
      [2, 1],
      [3, 1],
      [4, 1],
      [5, 1],
      [1, 3],
      [2, 3],
      [3, 3],
    ];
    for (const [x, y] of cells) broke = placePiece(broke, v01, "canal", x, y).state;
    expect(budgetLeft(v01, broke.placements)).toBe(0);
    expect(placePiece(broke, v01, "canal", 4, 3).error).toBe("OVER_BUDGET");
  });

  it("undoes and redoes without limit and drops redo after a new edit", () => {
    let plan = emptyPlan();
    for (const x of [1, 2, 3]) plan = placePiece(plan, v01, "canal", x, 1).state;
    expect(plan.placements).toHaveLength(3);
    expect(canUndo(plan)).toBe(true);
    plan = undo(undo(plan));
    expect(plan.placements).toHaveLength(1);
    expect(canRedo(plan)).toBe(true);
    plan = redo(plan);
    expect(plan.placements).toHaveLength(2);
    plan = placePiece(plan, v01, "canal", 4, 1).state;
    expect(canRedo(plan)).toBe(false);
    expect(undo(emptyPlan())).toEqual(emptyPlan());
    expect(redo(emptyPlan())).toEqual(emptyPlan());
  });

  it("groups a drag stroke into one undo step", () => {
    let plan = beginStroke(emptyPlan());
    for (const x of [1, 2, 3, 4]) plan = placePiece(plan, v01, "canal", x, 1).state;
    plan = endStroke(plan);
    expect(plan.placements).toHaveLength(4);
    expect(plan.past).toHaveLength(1);
    expect(undo(plan).placements).toHaveLength(0);
  });

  it("erases with a full refund and clears the plan", () => {
    let plan = placePiece(emptyPlan(), v01, "canal", 1, 1).state;
    const erased = erasePiece(plan, 1, 1);
    expect(erased.change).toBe("removed");
    expect(budgetLeft(v01, erased.state.placements)).toBe(v01.budget);
    expect(erasePiece(plan, 5, 5).change).toBe("none");
    plan = placePiece(plan, v01, "canal", 2, 1).state;
    const cleared = clearPlan(plan);
    expect(cleared.state.placements).toEqual([]);
    expect(undo(cleared.state).placements).toHaveLength(2);
    expect(clearPlan(emptyPlan()).change).toBe("none");
  });

  it("rotates pumps clockwise and edits gate weeks", () => {
    const pumpMap = getMap("v06");
    const spot = findLand(pumpMap);
    let plan = placePiece(emptyPlan(), pumpMap, "pump", spot.x, spot.y).state;
    expect(plan.placements[0]?.dir).toBe("E");
    plan = rotateAt(plan, spot.x, spot.y).state;
    expect(plan.placements[0]?.dir).toBe("S");
    expect(rotateAt(plan, 7, 11).change).toBe("none");

    const gateSpot = findLand(d01);
    let gated = placePiece(emptyPlan(), d01, "gate", gateSpot.x, gateSpot.y).state;
    gated = setGateAt(gated, d01, gateSpot.x, gateSpot.y, 3, 9).state;
    expect(gated.placements[0]).toMatchObject({ opensWeek: 3, closesWeek: 9 });
    expect(setGateAt(gated, d01, gateSpot.x, gateSpot.y, 9, 3).error).toBe("BAD_GATE_WEEKS");
    expect(setGateAt(gated, d01, gateSpot.x, gateSpot.y, 3, 9).change).toBe("none");
  });
});

function findLand(def: typeof v01): { x: number; y: number } {
  const rows = def.layout.map((row) => row.split(" "));
  for (let y = 0; y < rows.length; y++) {
    for (let x = 0; x < (rows[y]?.length ?? 0); x++) {
      if (rows[y]?.[x]?.startsWith(".")) return { x, y };
    }
  }
  throw new Error("no land");
}

describe("hint", () => {
  it("returns the first reference piece that the plan lacks", () => {
    const reference = v01.reference;
    expect(nextHint(reference, [])).toEqual(reference[0]);
    expect(nextHint(reference, [reference[0] as Placement])).toEqual(reference[1]);
    expect(nextHint(reference, reference)).toBeNull();
  });

  it("treats a pump turned the wrong way as missing", () => {
    const pump: Placement = { x: 1, y: 1, kind: "pump", dir: "N" };
    expect(nextHint([pump], [{ ...pump, dir: "E" }])).toEqual(pump);
    expect(nextHint([pump], [{ ...pump }])).toBeNull();
  });
});

describe("timeline", () => {
  it.each(["v01", "v04", "d01", "h01", "e08"])("ends exactly where runSeason ends on %s", (id) => {
    const map = getMap(id);
    const timeline = buildTimeline(map, map.reference);
    expect(timeline.steps).toBe(map.weeks * 4);
    expect(timeline.frames).toHaveLength(timeline.steps + 1);
    const last = frameAt(timeline, timeline.steps);
    expect(Array.from(last.depths)).toEqual(
      Array.from(runSeason(map, map.reference).weekFrames.at(-1) ?? []),
    );
    expect(Array.from(last.houseFlooded)).toEqual(
      timeline.result.metrics.houses.map((h) => h.floodedSteps),
    );
    expect(Array.from(last.houseSupplied)).toEqual(
      timeline.result.metrics.houses.map((h) => h.suppliedSteps),
    );
    expect(Array.from(last.fieldWet)).toEqual(
      timeline.result.metrics.fields.map((f) => f.wetSteps),
    );
    expect(hashSeason(timeline.result)).toBe(hashSeason(runSeason(map, map.reference)));
    expect(timeline.evaluation.stars).toBe(3);
  });

  it("clamps the frame lookup and shows badges that agree with the evaluation", () => {
    const timeline = buildTimeline(v01, v01.reference);
    expect(frameAt(timeline, -5)).toBe(timeline.frames[0]);
    expect(frameAt(timeline, 9999)).toBe(timeline.frames.at(-1));
    const houses = timeline.result.metrics.houses.map(({ x, y }) => ({ x, y }));
    const fields = timeline.result.metrics.fields.map(({ x, y }) => ({ x, y }));
    expect(badgesAt(timeline, houses, fields, 0)).toEqual([]);
    const end = badgesAt(timeline, houses, fields, timeline.steps);
    expect(end.filter((b) => b.kind === "supplied")).toHaveLength(
      timeline.evaluation.housesSupplied,
    );
    expect(end.filter((b) => b.kind === "irrigated")).toHaveLength(
      timeline.evaluation.fieldsIrrigated,
    );
    const empty = buildTimeline(v01, []);
    const dry = badgesAt(empty, houses, fields, empty.steps);
    expect(dry.some((b) => b.kind === "supplied" || b.kind === "irrigated")).toBe(false);
    expect(dry.length).toBe(houses.length + fields.length);
  });

  it("flags a flooded house as soon as it floods", () => {
    const timeline = buildTimeline(v01, []);
    const houses = timeline.result.metrics.houses.map(({ x, y }) => ({ x, y }));
    const first = timeline.frames.findIndex((frame) => (frame.houseFlooded[0] ?? 0) >= 1);
    expect(first).toBeGreaterThan(0);
    expect(badgesAt(timeline, houses, [], first - 1).some((b) => b.kind === "flooded")).toBe(false);
    expect(badgesAt(timeline, houses, [], first).some((b) => b.kind === "flooded")).toBe(true);
    expect(MAPS).toHaveLength(40);
  });
});

describe("playback", () => {
  it("steps one frame at a time, or a week at a time when motion is reduced", () => {
    const smooth = advance(startPlayback(), 80, false);
    expect(smooth.pos).toBe(1);
    const reduced = advance(startPlayback(), 80, true);
    expect(reduced.pos).toBe(4);
    expect(tickDelay(1, false)).toBeGreaterThan(tickDelay(4, false));
    expect(tickDelay(2, true)).toBeGreaterThan(tickDelay(2, false));
  });

  it("stops at the end, scrubs, changes speed and restarts", () => {
    let state = { ...startPlayback(), pos: 79 };
    state = advance(state, 80, false);
    expect(state).toMatchObject({ pos: 80, playing: false });
    expect(finished(state, 80)).toBe(true);
    expect(advance(state, 80, false)).toBe(state);
    expect(togglePlaying(state, 80)).toMatchObject({ pos: 0, playing: true });
    expect(scrubTo(startPlayback(), 40, 80)).toMatchObject({ pos: 40, playing: false });
    expect(scrubTo(startPlayback(), 999, 80).pos).toBe(80);
    expect(scrubTo(startPlayback(), -4, 80).pos).toBe(0);
    expect(setSpeed(startPlayback(), 4).speed).toBe(4);
    expect(togglePlaying(startPlayback(), 80).playing).toBe(false);
  });
});

describe("keys and tools", () => {
  const tools = availableTools(["canal", "barrier", "pump"]);

  it("lists pieces in tray order followed by the eraser and select", () => {
    expect(tools).toEqual(["canal", "barrier", "pump", "erase", "select"]);
    expect(toolCost("pump")).toBe(3);
    expect(toolCost("erase")).toBe(0);
    expect(toolForKey("2", tools)).toBe("barrier");
    expect(toolForKey("9", tools)).toBeNull();
    expect(toolForKey("e", tools)).toBe("erase");
  });

  it("maps the documented keys", () => {
    expect(keyAction({ key: "ArrowLeft" }, tools)).toEqual({ type: "move", dx: -1, dy: 0 });
    expect(keyAction({ key: "ArrowDown" }, tools)).toEqual({ type: "move", dx: 0, dy: 1 });
    expect(keyAction({ key: "Enter" }, tools)).toEqual({ type: "activate" });
    expect(keyAction({ key: " " }, tools)).toEqual({ type: "run" });
    expect(keyAction({ key: "Backspace" }, tools)).toEqual({ type: "remove" });
    expect(keyAction({ key: "r" }, tools)).toEqual({ type: "rotate" });
    expect(keyAction({ key: "z", ctrlKey: true }, tools)).toEqual({ type: "undo" });
    expect(keyAction({ key: "z", ctrlKey: true, shiftKey: true }, tools)).toEqual({ type: "redo" });
    expect(keyAction({ key: "3" }, tools)).toEqual({ type: "tool", tool: "pump" });
    expect(keyAction({ key: "q" }, tools)).toBeNull();
    expect(keyAction({ key: "3", ctrlKey: true }, tools)).toBeNull();
  });
});

describe("geometry", () => {
  it("fits the board, centres it and finds cells under a point", () => {
    const geom = makeGeometry(8, 12, FALLBACK_VIEWPORT);
    expect(geom.cell).toBe(fitCellSize(8, 12, FALLBACK_VIEWPORT));
    expect(geom.originX).toBeGreaterThanOrEqual(0);
    for (const [x, y] of [
      [0, 0],
      [7, 11],
      [3, 5],
    ] as const) {
      const { px, py } = cellCenter(geom, x, y);
      expect(cellAt(geom, px, py)).toEqual({ x, y });
    }
    expect(cellAt(geom, -4, 10)).toBeNull();
    expect(cellAt(geom, geom.originX + geom.cols * geom.cell + 1, 10)).toBeNull();
  });

  it("zooms in steps and clamps the pan", () => {
    expect(nextZoom(0)).toBe(1);
    expect(nextZoom(2)).toBe(0);
    expect(zoomLabel(0)).toBe("Fit");
    expect(zoomLabel(2)).toBe("2x");
    const fit = makeGeometry(12, 16, FALLBACK_VIEWPORT, 0);
    const big = makeGeometry(12, 16, FALLBACK_VIEWPORT, 2, { x: 99999, y: -99999 });
    expect(big.cell).toBe(Math.round(fit.fitCell * 2));
    expect(big.originX).toBeLessThanOrEqual(8);
    expect(big.originY).toBeGreaterThanOrEqual(FALLBACK_VIEWPORT.height - 16 * big.cell - 8);
  });

  it("pans to reveal an off-screen cell", () => {
    const zoomed = makeGeometry(12, 16, FALLBACK_VIEWPORT, 2);
    const pan = panToReveal(zoomed, 11, 15);
    const moved = makeGeometry(12, 16, FALLBACK_VIEWPORT, 2, pan);
    const { px, py } = cellCenter(moved, 11, 15);
    expect(px).toBeLessThanOrEqual(FALLBACK_VIEWPORT.width);
    expect(py).toBeLessThanOrEqual(FALLBACK_VIEWPORT.height);
  });

  it("joins dragged cells edge to edge without diagonal gaps", () => {
    const path = linePath({ x: 0, y: 0 }, { x: 3, y: 2 });
    let prev = { x: 0, y: 0 };
    for (const step of path) {
      expect(Math.abs(step.x - prev.x) + Math.abs(step.y - prev.y)).toBe(1);
      prev = step;
    }
    expect(prev).toEqual({ x: 3, y: 2 });
    expect(linePath({ x: 2, y: 2 }, { x: 2, y: 2 })).toEqual([{ x: 2, y: 2 }]);
  });
});
