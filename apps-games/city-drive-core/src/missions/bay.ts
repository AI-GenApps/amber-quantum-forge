import type { Vec2 } from "../city/coords";
import type { RoadGraph } from "../city/graph";
import { pointOnEdge } from "../city/lane-index";
import type { Vec3 } from "../physics/math";
import type { BayDef, CarFootprint, LanePointRef } from "./types";

/** Half extents of a static parked car beside a bay. */
export const PARKED_CAR_HALF: Vec3 = { x: 0.85, y: 0.6, z: 2.1 };
/** Default free space between the bay and each parked car, along the lane. */
export const PARKED_CAR_GAP_M = 6;
/** How far outside the bay a car corner may poke and still count as inside. */
export const BAY_TOLERANCE_M = 0.15;

export interface ParkedCar {
  center: Vec3;
  /** Half extents in world axes (lanes are axis-aligned, so no rotation is needed). */
  half: Vec3;
  /** Unit direction the car points in, on the ground plane. */
  forward: Vec2;
}

export interface BayGeometry {
  centre: Vec2;
  /** Unit direction of the lane the bay sits beside. */
  axis: Vec2;
  /** Unit vector to the right of the lane direction. */
  right: Vec2;
  halfLength: number;
  halfWidth: number;
  /** One parked car in front of the bay and one behind it. */
  parkedCars: ParkedCar[];
}

export interface WorldLanePoint extends Vec2 {
  dirX: number;
  dirZ: number;
}

/** World position and travel direction of a lane point. Throws on an unknown edge. */
export function resolveLanePoint(graph: RoadGraph, ref: LanePointRef): WorldLanePoint {
  const edge = graph.edges.get(ref.edgeId);
  if (!edge) throw new Error(`lane point refers to unknown edge "${ref.edgeId}"`);
  return pointOnEdge(edge, ref.s);
}

function parkedCar(centre: Vec2, axis: Vec2, along: number): ParkedCar {
  const alongX = Math.abs(axis.x) > Math.abs(axis.z);
  const half = alongX
    ? { x: PARKED_CAR_HALF.z, y: PARKED_CAR_HALF.y, z: PARKED_CAR_HALF.x }
    : { ...PARKED_CAR_HALF };
  return {
    center: {
      x: centre.x + axis.x * along,
      y: PARKED_CAR_HALF.y,
      z: centre.z + axis.z * along,
    },
    half,
    forward: { x: axis.x, z: axis.z },
  };
}

/** Where a bay is in the world, and the parked cars that flank it. */
export function bayGeometry(graph: RoadGraph, bay: BayDef): BayGeometry {
  const at = resolveLanePoint(graph, bay.lane_point);
  const axis = { x: at.dirX, z: at.dirZ };
  const right = { x: -axis.z, z: axis.x };
  const centre = {
    x: at.x + right.x * bay.lateral_offset_m,
    z: at.z + right.z * bay.lateral_offset_m,
  };
  const halfLength = bay.length_m / 2;
  const reach = halfLength + (bay.flank_gap_m ?? PARKED_CAR_GAP_M) + PARKED_CAR_HALF.z;
  return {
    centre,
    axis,
    right,
    halfLength,
    halfWidth: bay.width_m / 2,
    parkedCars: [parkedCar(centre, axis, reach), parkedCar(centre, axis, -reach)],
  };
}

/** Furthest distance from the bay centre that the bay or a parked car reaches along the lane. */
export function bayReach(bay: BayDef): number {
  return bay.length_m / 2 + (bay.flank_gap_m ?? PARKED_CAR_GAP_M) + 2 * PARKED_CAR_HALF.z;
}

/** Coordinates of a ground point in the bay's frame: u along the lane, v to the right. */
export function toBayFrame(geo: BayGeometry, x: number, z: number): { u: number; v: number } {
  const dx = x - geo.centre.x;
  const dz = z - geo.centre.z;
  return {
    u: dx * geo.axis.x + dz * geo.axis.z,
    v: dx * geo.right.x + dz * geo.right.z,
  };
}

/** The four ground corners of a car footprint. */
export function carCorners(
  position: Vec3,
  forward: Vec2,
  car: CarFootprint,
): [Vec2, Vec2, Vec2, Vec2] {
  const rx = -forward.z;
  const rz = forward.x;
  const corner = (f: number, s: number): Vec2 => ({
    x: position.x + forward.x * car.halfLength * f + rx * car.halfWidth * s,
    z: position.z + forward.z * car.halfLength * f + rz * car.halfWidth * s,
  });
  return [corner(1, 1), corner(1, -1), corner(-1, 1), corner(-1, -1)];
}

/** True when every corner of the car lies inside the bay (with a small tolerance). */
export function carInsideBay(
  geo: BayGeometry,
  position: Vec3,
  forward: Vec2,
  car: CarFootprint,
): boolean {
  return carCorners(position, forward, car).every((c) => {
    const { u, v } = toBayFrame(geo, c.x, c.z);
    return (
      Math.abs(u) <= geo.halfLength + BAY_TOLERANCE_M &&
      Math.abs(v) <= geo.halfWidth + BAY_TOLERANCE_M
    );
  });
}

/** |cos| of the angle between the car and the bay axis, ignoring which way the car faces. */
export function bayAlignment(geo: BayGeometry, forward: Vec2): number {
  return Math.abs(forward.x * geo.axis.x + forward.z * geo.axis.z);
}
