import type { MissionDef, MissionHud } from "@city-drive/core";
import { loadCityMap, parseCityManifest } from "@city-drive/core/city";
import district1 from "@city-drive/core/maps/district-1.json";
import { describe, expect, it } from "vitest";
import { DISTRICT_MISSIONS } from "../../src/game/missions";
import { ARRIVED_M, arrowAnchor, objectiveArrow, VIEW_HALF_ANGLE } from "../../src/ui/model/arrow";
import { missionMeter } from "../../src/ui/model/meters";
import {
  buildMinimapModel,
  drawMinimap,
  type Minimap2D,
  minimapProjector,
} from "../../src/ui/model/minimap";
import { readManifest } from "../assets/helpers";

const NORTH = { x: 0, z: -1 };
const SOUTH = { x: 0, z: 1 };
const ORIGIN = { x: 0, z: 0 };

describe("objectiveArrow", () => {
  it("straight ahead is angle 0 and not off-screen", () => {
    const a = objectiveArrow(ORIGIN, SOUTH, { x: 0, z: 50 });
    expect(a.angle).toBeCloseTo(0);
    expect(a.distanceM).toBeCloseTo(50);
    expect(a.offscreen).toBe(false);
  });

  it("behind the car is +-PI and off-screen", () => {
    const a = objectiveArrow(ORIGIN, SOUTH, { x: 0, z: -50 });
    expect(Math.abs(a.angle)).toBeCloseTo(Math.PI);
    expect(a.offscreen).toBe(true);
  });

  it("right of the player is positive, in the right-handed scene for any heading", () => {
    // Facing +z the player's right is -x; facing -z it is +x; facing +x it is +z... (-fz, fx).
    expect(objectiveArrow(ORIGIN, SOUTH, { x: -10, z: 0 }).angle).toBeCloseTo(Math.PI / 2);
    expect(objectiveArrow(ORIGIN, SOUTH, { x: 10, z: 0 }).angle).toBeCloseTo(-Math.PI / 2);
    expect(objectiveArrow(ORIGIN, NORTH, { x: 10, z: 0 }).angle).toBeCloseTo(Math.PI / 2);
    expect(objectiveArrow(ORIGIN, { x: 1, z: 0 }, { x: 0, z: 10 }).angle).toBeCloseTo(Math.PI / 2);
  });

  it("is off-screen only beyond the view half-angle", () => {
    const at = (angle: number) =>
      objectiveArrow(ORIGIN, SOUTH, { x: -Math.sin(angle) * 30, z: Math.cos(angle) * 30 });
    expect(at(VIEW_HALF_ANGLE - 0.05).offscreen).toBe(false);
    expect(at(VIEW_HALF_ANGLE + 0.05).offscreen).toBe(true);
    expect(at(-VIEW_HALF_ANGLE - 0.05).offscreen).toBe(true);
  });

  it("hides the arrow once the car has arrived, and handles a target on the car", () => {
    expect(objectiveArrow(ORIGIN, SOUTH, { x: ARRIVED_M - 0.5, z: -1 }).offscreen).toBe(false);
    const here = objectiveArrow(ORIGIN, SOUTH, ORIGIN);
    expect(here).toEqual({ angle: 0, distanceM: 0, offscreen: false });
  });
});

describe("arrowAnchor", () => {
  it("puts the arrow at the top for ahead, the sides for left and right, the bottom for behind", () => {
    expect(arrowAnchor(0).left).toBeCloseTo(0.5);
    expect(arrowAnchor(0).top).toBeLessThan(0.2);
    const right = arrowAnchor(Math.PI / 2);
    expect(right.left).toBeGreaterThan(0.85);
    expect(right.top).toBeCloseTo(0.5);
    expect(arrowAnchor(-Math.PI / 2).left).toBeLessThan(0.15);
    expect(arrowAnchor(Math.PI).top).toBeGreaterThan(0.8);
  });

  it("always stays inside the screen", () => {
    for (let i = -32; i <= 32; i++) {
      const a = arrowAnchor((i / 32) * Math.PI);
      expect(a.left).toBeGreaterThanOrEqual(0.05);
      expect(a.left).toBeLessThanOrEqual(0.95);
      expect(a.top).toBeGreaterThanOrEqual(0.05);
      expect(a.top).toBeLessThanOrEqual(0.95);
    }
  });
});

function hud(over: Partial<MissionHud> = {}): MissionHud {
  return {
    phase: "active",
    missionId: "x",
    title: "x",
    objective: undefined,
    progress: { done: 0, total: 0 },
    elapsedS: 0,
    timeLeftS: 60,
    damage: 0,
    comfort: null,
    paused: false,
    ...over,
  };
}

const ofType = (type: string): MissionDef =>
  Object.values(DISTRICT_MISSIONS)
    .flat()
    .find((m) => (m as MissionDef).type === type) as MissionDef;

describe("missionMeter", () => {
  it("has no meter without a mission", () => {
    expect(missionMeter(undefined, hud())).toBeUndefined();
  });

  it("delivery: a damage bar that fills toward the mission limit", () => {
    const mission = ofType("delivery");
    const max = mission.type === "delivery" ? mission.params.max_damage : 0;
    expect(missionMeter(mission, hud({ damage: 0 }))).toMatchObject({
      kind: "damage",
      fraction: 0,
      tone: "ok",
      text: `0/${max}`,
    });
    expect(missionMeter(mission, hud({ damage: max }))).toMatchObject({ fraction: 1, tone: "bad" });
    expect(missionMeter(mission, hud({ damage: max * 10 }))?.fraction).toBe(1);
    const half = missionMeter(mission, hud({ damage: max * 0.6 }));
    expect(half?.tone).toBe("warn");
  });

  it("taxi: a comfort bar that drains, red near zero", () => {
    const mission = ofType("taxi");
    expect(missionMeter(mission, hud({ comfort: 100 }))).toMatchObject({
      kind: "comfort",
      fraction: 1,
      tone: "ok",
      text: "100%",
    });
    expect(missionMeter(mission, hud({ comfort: 40 }))?.tone).toBe("warn");
    expect(missionMeter(mission, hud({ comfort: 5 }))?.tone).toBe("bad");
    expect(missionMeter(mission, hud({ comfort: null }))?.fraction).toBe(1);
  });

  it("parking: touches against the allowed touches", () => {
    const mission = ofType("parking");
    const max = mission.type === "parking" ? mission.params.max_touches : 0;
    expect(missionMeter(mission, hud({ damage: 1 }))).toMatchObject({
      kind: "touches",
      text: `1/${max}`,
    });
  });

  it("time trial: checkpoint progress", () => {
    expect(
      missionMeter(ofType("time_trial"), hud({ progress: { done: 1, total: 4 } })),
    ).toMatchObject({ kind: "checkpoints", fraction: 0.25, text: "1/4" });
    expect(missionMeter(ofType("time_trial"), hud())?.fraction).toBe(0);
  });
});

describe("minimap", () => {
  const manifest = readManifest();
  const map = loadCityMap(district1, parseCityManifest(manifest));
  const model = buildMinimapModel(map);

  it("has one square per road tile and bounds that cover them", () => {
    expect(model.roads).toHaveLength(map.tiles.filter((t) => t.kind === "road").length);
    expect(model.roads.length).toBeGreaterThan(20);
    for (const r of model.roads) {
      expect(r.x).toBeGreaterThan(model.minX);
      expect(r.x).toBeLessThan(model.maxX);
      expect(r.z).toBeGreaterThan(model.minZ);
      expect(r.z).toBeLessThan(model.maxZ);
    }
  });

  it("projects into the canvas, north up, keeping the aspect ratio", () => {
    const fit = minimapProjector(model, 160, 160);
    const topLeft = fit.project({ x: model.minX, z: model.minZ });
    const bottomRight = fit.project({ x: model.maxX, z: model.maxZ });
    expect(topLeft.x).toBeGreaterThanOrEqual(0);
    expect(topLeft.y).toBeGreaterThanOrEqual(0);
    expect(bottomRight.x).toBeLessThanOrEqual(160);
    expect(bottomRight.y).toBeLessThanOrEqual(160);
    expect(bottomRight.x - topLeft.x).toBeCloseTo((model.maxX - model.minX) * fit.scale);
    expect(bottomRight.y - topLeft.y).toBeCloseTo((model.maxZ - model.minZ) * fit.scale);
    const north = fit.project({ x: 0, z: model.minZ });
    const south = fit.project({ x: 0, z: model.maxZ });
    expect(north.y).toBeLessThan(south.y);
  });

  function recorder() {
    const calls: string[] = [];
    const ctx: Minimap2D = {
      fillStyle: "",
      strokeStyle: "",
      lineWidth: 1,
      clearRect: () => calls.push("clear"),
      fillRect: () => calls.push(`rect:${ctx.fillStyle}`),
      beginPath: () => calls.push("begin"),
      closePath: () => calls.push("close"),
      moveTo: () => calls.push("move"),
      lineTo: () => calls.push("line"),
      arc: () => calls.push(`arc:${ctx.fillStyle}`),
      fill: () => calls.push("fill"),
      stroke: () => calls.push("stroke"),
    };
    return { ctx, calls };
  }

  const colours = { road: "road", player: "player", objective: "objective", marker: "marker" };
  const size = { width: 160, height: 160 };

  it("draws the roads, markers, objective and the player's arrow", () => {
    const { ctx, calls } = recorder();
    drawMinimap(
      ctx,
      model,
      {
        player: { x: 0, z: 0 },
        forward: { x: 0, z: 1 },
        objective: { x: 10, z: 10 },
        markers: [
          { x: 5, z: 5 },
          { x: -5, z: 5 },
        ],
      },
      size,
      colours,
    );
    expect(calls[0]).toBe("clear");
    expect(calls.filter((c) => c === "rect:road")).toHaveLength(model.roads.length);
    expect(calls.filter((c) => c === "arc:marker")).toHaveLength(2);
    expect(calls.filter((c) => c === "arc:objective")).toHaveLength(1);
    expect(calls.slice(-6)).toEqual(["begin", "move", "line", "line", "close", "fill"]);
  });

  it("draws no objective dot in free roam", () => {
    const { ctx, calls } = recorder();
    drawMinimap(
      ctx,
      model,
      { player: { x: 0, z: 0 }, forward: { x: 1, z: 0 }, objective: undefined, markers: [] },
      size,
      colours,
    );
    expect(calls.some((c) => c.startsWith("arc"))).toBe(false);
  });
});
