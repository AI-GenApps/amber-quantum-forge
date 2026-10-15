import {
  BASELINE_CAR,
  buildColliders,
  buildRoadGraph,
  type Car,
  type CityMap,
  createCar,
  createPhysicsWorld,
  installColliders,
  type PhysicsWorld,
  type Pose,
  playerFromCar,
  type RoadGraph,
  spawnPose,
  TrafficManager,
  type TrafficOptions,
  type TrafficPlayer,
  tileCenter,
} from "../../src/index";
import { loadDistrict1, loadManifest } from "../city/helpers";

export interface TrafficRig {
  map: CityMap;
  graph: RoadGraph;
  physics: PhysicsWorld;
  traffic: TrafficManager;
  player: TrafficPlayer;
}

export function parkedPlayer(x: number, z: number, heading = { x: 0, z: -1 }): TrafficPlayer {
  return { x, z, vx: 0, vz: 0, forwardX: heading.x, forwardZ: heading.z, halfLength: 2.1 };
}

/** A building tile of district-1 beside the road, a safe place to park the player. */
export function offRoadSpot(map: CityMap): { x: number; z: number } {
  return tileCenter(map, 2, 3);
}

export async function createRig(
  options: Partial<Omit<TrafficOptions, "player">> & {
    player?: TrafficPlayer;
    walls?: boolean;
  } = {},
): Promise<TrafficRig> {
  const map = loadDistrict1();
  const physics = await createPhysicsWorld();
  physics.addGround();
  if (options.walls) installColliders(physics, buildColliders(map, loadManifest()));
  const graph = buildRoadGraph(map);
  const spot = offRoadSpot(map);
  const player = options.player ?? parkedPlayer(spot.x, spot.z);
  const { player: _ignored, walls: _walls, ...rest } = options;
  const traffic = new TrafficManager(physics, graph, {
    seed: 1,
    ...rest,
    player: () => player,
  });
  return { map, graph, physics, traffic, player };
}

export function runTicks(rig: TrafficRig, ticks: number): void {
  for (let i = 0; i < ticks; i++) rig.physics.step();
}

export interface CarRig {
  map: CityMap;
  graph: RoadGraph;
  physics: PhysicsWorld;
  traffic: TrafficManager;
  car: Car;
}

/** The full stack as the game builds it: city colliders, a real car, traffic that watches it. */
export async function createCarRig(
  options: Partial<Omit<TrafficOptions, "player">> & { pose?: Pose } = {},
): Promise<CarRig> {
  const map = loadDistrict1();
  const physics = await createPhysicsWorld();
  installColliders(physics, buildColliders(map, loadManifest()));
  const graph = buildRoadGraph(map);
  const car = createCar(physics, BASELINE_CAR, options.pose ?? spawnPose(map, 1.1));
  const traffic = new TrafficManager(physics, graph, {
    seed: 1,
    ...options,
    player: () => playerFromCar(car.state(), BASELINE_CAR.chassisHalfExtents.z),
    playerColliderHandle: car.colliderHandle,
  });
  return { map, graph, physics, traffic, car };
}
