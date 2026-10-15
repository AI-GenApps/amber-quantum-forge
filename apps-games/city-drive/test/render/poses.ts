import { quatFromForward } from "@city-drive/core";
import { CHASE_DISTANCE_M, CHASE_HEIGHT_M } from "../../src/render/constants";

export interface Pose {
  name: string;
  /** Camera position in world metres. */
  position: { x: number; y: number; z: number };
  /** Point the camera looks at. */
  target: { x: number; y: number; z: number };
  /** Where the player's car stands for this pose, and the way it faces (unit x/z). */
  car: { x: number; z: number };
  forward: { x: number; z: number };
}

/** Where the car stands, measured inward from the map edge. */
const EDGE_INSET_M = 10;
const LOOK_AHEAD_M = 15;
const LOOK_HEIGHT_M = 1;

function chasePose(name: string, car: { x: number; z: number }, forward: { x: number; z: number }) {
  const len = Math.hypot(forward.x, forward.z) || 1;
  const fx = forward.x / len;
  const fz = forward.z / len;
  return {
    name,
    position: {
      x: car.x - fx * CHASE_DISTANCE_M,
      y: CHASE_HEIGHT_M,
      z: car.z - fz * CHASE_DISTANCE_M,
    },
    target: { x: car.x + fx * LOOK_AHEAD_M, y: LOOK_HEIGHT_M, z: car.z + fz * LOOK_AHEAD_M },
    car: { x: car.x, z: car.z },
    forward: { x: fx, z: fz },
  } satisfies Pose;
}

const COMPASS = [
  { name: "N", dx: 0, dz: -1 },
  { name: "NE", dx: 1, dz: -1 },
  { name: "E", dx: 1, dz: 0 },
  { name: "SE", dx: 1, dz: 1 },
  { name: "S", dx: 0, dz: 1 },
  { name: "SW", dx: -1, dz: 1 },
  { name: "W", dx: -1, dz: 0 },
  { name: "NW", dx: -1, dz: -1 },
] as const;

/**
 * The 9 budget poses: a chase camera with the car at each of the 8 compass points of the map
 * (inset from the edge) facing the centre, plus the centre facing north.
 */
export function budgetPoses(halfX: number, halfZ: number): Pose[] {
  const poses: Pose[] = COMPASS.map(({ name, dx, dz }) => {
    const car = { x: dx * (halfX - EDGE_INSET_M), z: dz * (halfZ - EDGE_INSET_M) };
    return chasePose(`edge-${name}`, car, { x: -dx, z: -dz });
  });
  poses.push(chasePose("centre", { x: 0, z: 0 }, { x: 0, z: -1 }));
  return poses;
}

/** Extra sweep: the car on a grid inside the map, facing the four headings. Informational. */
export function sweepPoses(halfX: number, halfZ: number, step: number): Pose[] {
  const poses: Pose[] = [];
  const headings = [
    { name: "N", x: 0, z: -1 },
    { name: "E", x: 1, z: 0 },
    { name: "S", x: 0, z: 1 },
    { name: "W", x: -1, z: 0 },
  ];
  for (let x = -halfX + EDGE_INSET_M; x <= halfX - EDGE_INSET_M; x += step) {
    for (let z = -halfZ + EDGE_INSET_M; z <= halfZ - EDGE_INSET_M; z += step) {
      for (const h of headings) poses.push(chasePose(`grid(${x},${z})-${h.name}`, { x, z }, h));
    }
  }
  return poses;
}

/** Seconds-free stand-in for 16 traffic cars: a 4 x 4 block of cars filling the view ahead. */
export function trafficCrowd(
  pose: Pose,
  count = 16,
): {
  id: number;
  modelIndex: number;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number; w: number };
  wheelRotation: number;
  speedKmh: number;
}[] {
  const rotation = quatFromForward(pose.forward.x, pose.forward.z);
  const side = { x: -pose.forward.z, z: pose.forward.x };
  return Array.from({ length: count }, (_, i) => {
    const row = Math.floor(i / 4);
    const col = i % 4;
    const ahead = 8 + row * 9;
    const lateral = (col - 1.5) * 3.2;
    return {
      id: i,
      modelIndex: i % 4,
      position: {
        x: pose.car.x + pose.forward.x * ahead + side.x * lateral,
        y: 0.87,
        z: pose.car.z + pose.forward.z * ahead + side.z * lateral,
      },
      rotation,
      wheelRotation: i * 0.7,
      speedKmh: 30,
    };
  });
}
