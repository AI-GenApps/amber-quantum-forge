import { type Pose, quatFromForward } from "../physics/math";
import type { Vec2 } from "./coords";
import type { RoadGraph } from "./graph";
import { type LaneIndex, pointOnEdge } from "./lane-index";

export interface LaneRespawn extends Pose {
  edgeId: string;
  /** Unit travel direction of the lane at the respawn point. */
  forward: Vec2;
}

/**
 * Where to put the car back on the road: the lane point nearest to `position`, facing the way
 * traffic travels there. Returns undefined only when the graph has no lanes at all.
 */
export function laneRespawn(
  graph: RoadGraph,
  index: LaneIndex,
  position: Vec2,
  height = 1,
): LaneRespawn | undefined {
  const hit = index.nearest(position);
  if (!hit) return undefined;
  const edge = graph.edges.get(hit.edgeId);
  if (!edge) throw new Error(`respawn: lane index returned unknown edge "${hit.edgeId}"`);
  const at = pointOnEdge(edge, hit.s);
  return {
    edgeId: hit.edgeId,
    position: { x: at.x, y: height, z: at.z },
    rotation: quatFromForward(at.dirX, at.dirZ),
    forward: { x: at.dirX, z: at.dirZ },
  };
}
