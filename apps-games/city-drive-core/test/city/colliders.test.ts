import { describe, expect, it } from "vitest";
import {
  BASELINE_CAR,
  buildColliders,
  buildingFitScale,
  buildRoadGraph,
  createCar,
  createPhysicsWorld,
  installColliders,
  spawnPose,
  tileCenter,
} from "../../src/index";
import { loadDistrict1, loadManifest, miniMap } from "./helpers";

const map = loadDistrict1();
const manifest = loadManifest();
const plan = buildColliders(map, manifest);
const buildings = plan.boxes.filter((b) => b.kind === "building");
const walls = plan.boxes.filter((b) => b.kind === "wall");

describe("buildColliders", () => {
  it("makes one cuboid per building tile, built from the manifest bounding box", () => {
    expect(buildings).toHaveLength(map.tiles.filter((t) => t.kind === "building").length);
    const first = map.tiles.find(
      (t) => t.kind === "building" && t.model === "bld-commercial-skyscraper-a",
    );
    const box = buildings.find((b) => b.tile?.x === first?.x && b.tile?.y === first?.y);
    const model = manifest.models.find((m) => m.id === "bld-commercial-skyscraper-a");
    expect(box).toBeDefined();
    if (!box || !model || !first) return;
    const scale = map.tile_size_m * buildingFitScale(model.bbox);
    expect(box.half.y).toBeCloseTo(((model.bbox.max.y - model.bbox.min.y) / 2) * scale, 9);
    expect(box.center.y).toBeCloseTo(box.half.y, 9);
    expect(box.half.x).toBeCloseTo(((model.bbox.max.x - model.bbox.min.x) / 2) * scale, 9);
    const c = tileCenter(map, first.x, first.y);
    expect(box.center.x).toBeCloseTo(c.x, 9);
    expect(box.center.z).toBeCloseTo(c.z, 9);
  });

  it("keeps every building footprint inside its own tile, so roads stay clear", () => {
    for (const box of buildings) {
      const c = tileCenter(map, box.tile?.x ?? 0, box.tile?.y ?? 0);
      expect(Math.abs(box.center.x - c.x) + box.half.x).toBeLessThanOrEqual(
        map.tile_size_m / 2 + 1e-9,
      );
      expect(Math.abs(box.center.z - c.z) + box.half.z).toBeLessThanOrEqual(
        map.tile_size_m / 2 + 1e-9,
      );
    }
  });

  it("never overlaps a lane polyline", () => {
    const graph = buildRoadGraph(map);
    for (const edge of graph.edgeList) {
      for (const p of edge.points) {
        const hit = buildings.find(
          (b) => Math.abs(p.x - b.center.x) < b.half.x && Math.abs(p.z - b.center.z) < b.half.z,
        );
        expect(hit).toBeUndefined();
      }
    }
  });

  it("swaps the footprint for 90 and 270 degree tiles", () => {
    const base = miniMap();
    const rotated = base.tiles.map((t) =>
      t.x === 0 && t.y === 0 ? { ...t, model: "bld-commercial-e", rot: 90 as const } : t,
    );
    const upright = base.tiles.map((t) =>
      t.x === 0 && t.y === 0 ? { ...t, model: "bld-commercial-e", rot: 0 as const } : t,
    );
    const a = buildColliders({ ...base, tiles: upright }, manifest).boxes.find(
      (b) => b.tile?.x === 0 && b.tile?.y === 0,
    );
    const b = buildColliders({ ...base, tiles: rotated }, manifest).boxes.find(
      (b2) => b2.tile?.x === 0 && b2.tile?.y === 0,
    );
    expect(b?.half.x).toBeCloseTo(a?.half.z ?? NaN, 9);
    expect(b?.half.z).toBeCloseTo(a?.half.x ?? NaN, 9);
  });

  it("adds four boundary walls that enclose the map, and a ground that covers it", () => {
    expect(walls).toHaveLength(4);
    const hx = (map.width * map.tile_size_m) / 2;
    const hz = (map.height * map.tile_size_m) / 2;
    expect(walls.some((w) => w.center.x - w.half.x >= hx - 1e-9)).toBe(true);
    expect(walls.some((w) => w.center.x + w.half.x <= -hx + 1e-9)).toBe(true);
    expect(walls.some((w) => w.center.z - w.half.z >= hz - 1e-9)).toBe(true);
    expect(walls.some((w) => w.center.z + w.half.z <= -hz + 1e-9)).toBe(true);
    expect(plan.groundHalfSize).toBeGreaterThanOrEqual(hx);
  });

  it("is deterministic and reports an unknown model by tile", () => {
    expect(JSON.stringify(buildColliders(map, manifest))).toBe(JSON.stringify(plan));
    const bad = {
      ...miniMap(),
      tiles: miniMap().tiles.map((t) =>
        t.kind === "building" && t.x === 0 && t.y === 0 ? { ...t, model: "nope" } : t,
      ),
    };
    expect(() => buildColliders(bad, manifest)).toThrow(
      /building tile \(0,0\): unknown model "nope"/,
    );
  });
});

describe("spawn and static colliders in the physics world", () => {
  const pose = spawnPose(map);
  const target = buildings.find((b) => b.tile?.x === 0 && b.tile?.y === 5);

  it("spawns on the right-hand lane facing a building within 40 m on the drive line", () => {
    expect(pose.heading).toBe("W");
    expect(target).toBeDefined();
    if (!target) return;
    const face = target.center.x + target.half.x;
    const distance = pose.position.x - face;
    expect(distance).toBeGreaterThan(20);
    expect(distance).toBeLessThanOrEqual(40);
    expect(Math.abs(pose.position.z - target.center.z)).toBeLessThan(target.half.z);
    const centre = tileCenter(map, map.spawn.x, map.spawn.y);
    expect(pose.position.z).toBeCloseTo(centre.z - map.tile_size_m * 0.15, 9);
  });

  it("does not drive through the building at full throttle: 3 s, then until it stops", async () => {
    if (!target) throw new Error("no target building");
    const face = target.center.x + target.half.x;
    const world = await createPhysicsWorld();
    installColliders(world, plan);
    const car = createCar(world, BASELINE_CAR, pose);
    car.applyInput({ throttle: 1, steer: 0, handbrake: false });
    const startX = pose.position.x;
    const impulses = [];
    let frontAt3s = 0;
    for (let i = 0; i < 12 * 60; i++) {
      world.step();
      impulses.push(...world.drainCollisionImpulses());
      const front = car.state().position.x - BASELINE_CAR.chassisHalfExtents.z;
      expect(front).toBeGreaterThan(face - 0.5);
      if (i === 3 * 60 - 1) frontAt3s = front;
    }
    const end = car.state();
    expect(frontAt3s).toBeLessThan(startX);
    expect(end.position.x).toBeLessThan(startX - 10);
    expect(impulses.length).toBeGreaterThan(0);
    expect(Math.abs(end.speedKmh)).toBeLessThan(5);
    expect(end.position.y).toBeGreaterThan(0);
  });

  it("is stopped by the boundary wall outside the last building row", async () => {
    const world = await createPhysicsWorld();
    installColliders(world, plan);
    const hx = (map.width * map.tile_size_m) / 2;
    const car = createCar(world, BASELINE_CAR, {
      position: { x: hx - 30, y: 1, z: 0 },
      rotation: { x: 0, y: Math.SQRT1_2, z: 0, w: Math.SQRT1_2 },
    });
    car.applyInput({ throttle: 1, steer: 0, handbrake: false });
    for (let i = 0; i < 8 * 60; i++) world.step();
    expect(car.state().position.x).toBeLessThan(hx + 1);
  });
});
