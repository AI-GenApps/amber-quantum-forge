import { laneOffset, tileCenter, type Vec2 } from "./coords";
import { DIR_VEC, type Dir, oppositeDir } from "./direction";
import { type LaneKind, laneEdgePoint, laneShape, polylineLength } from "./lane-geometry";
import { tileSockets } from "./road-sockets";
import type { CityMap } from "./types";

export interface LaneNode {
  /** `c:<x>,<y>><dir>`: the lane crossing out of tile (x,y) through edge dir. Stable across builds. */
  id: string;
  x: number;
  z: number;
  inEdges: string[];
  outEdges: string[];
}

export interface LaneEdge {
  /** `e:<x>,<y>:<in><out>`: the pass through tile (x,y) from edge in to edge out. */
  id: string;
  kind: LaneKind;
  from: string;
  to: string;
  tileX: number;
  tileY: number;
  inDir: Dir;
  outDir: Dir;
  points: Vec2[];
  /** Cumulative length at each point; cum[0] = 0. */
  cum: number[];
  length: number;
}

export interface RoadGraph {
  tileSize: number;
  laneOffset: number;
  nodes: Map<string, LaneNode>;
  edges: Map<string, LaneEdge>;
  /** Insertion order is row-major by tile, so iteration is deterministic. */
  nodeList: LaneNode[];
  edgeList: LaneEdge[];
}

export function crossingNodeId(x: number, y: number, dir: Dir): string {
  return `c:${x},${y}>${dir}`;
}

export function laneEdgeId(x: number, y: number, inDir: Dir, outDir: Dir): string {
  return `e:${x},${y}:${inDir}${outDir}`;
}

/**
 * Build the lane-level graph (right-hand traffic, one lane each way). Assumes the map passed
 * validateCityMap. Every road tile contributes one edge per (entry edge, exit edge) pair; a
 * road-end adds a U-turn so that it is not a dead end.
 */
export function buildRoadGraph(map: CityMap): RoadGraph {
  const size = map.tile_size_m;
  const lane = laneOffset(map);
  const graph: RoadGraph = {
    tileSize: size,
    laneOffset: lane,
    nodes: new Map(),
    edges: new Map(),
    nodeList: [],
    edgeList: [],
  };
  const node = (id: string, p: Vec2): LaneNode => {
    let found = graph.nodes.get(id);
    if (!found) {
      found = { id, x: p.x, z: p.z, inEdges: [], outEdges: [] };
      graph.nodes.set(id, found);
      graph.nodeList.push(found);
    }
    return found;
  };
  const roads = map.tiles.filter((t) => t.kind === "road").sort((a, b) => a.y - b.y || a.x - b.x);
  for (const tile of roads) {
    const sockets = tileSockets(tile);
    const frame = { centre: tileCenter(map, tile.x, tile.y), tileSize: size, lane };
    for (const inDir of sockets) {
      for (const outDir of sockets) {
        if (inDir === outDir && sockets.length > 1) continue;
        const nb = DIR_VEC[inDir];
        const entry = node(
          crossingNodeId(tile.x + nb.dx, tile.y + nb.dz, oppositeDir(inDir)),
          laneEdgePoint(frame, inDir, oppositeDir(inDir)),
        );
        const exit = node(
          crossingNodeId(tile.x, tile.y, outDir),
          laneEdgePoint(frame, outDir, outDir),
        );
        const shape = laneShape(frame, inDir, outDir);
        const { cum, length } = polylineLength(shape.points);
        const edge: LaneEdge = {
          id: laneEdgeId(tile.x, tile.y, inDir, outDir),
          kind: shape.kind,
          from: entry.id,
          to: exit.id,
          tileX: tile.x,
          tileY: tile.y,
          inDir,
          outDir,
          points: shape.points,
          cum,
          length,
        };
        graph.edges.set(edge.id, edge);
        graph.edgeList.push(edge);
        entry.outEdges.push(edge.id);
        exit.inEdges.push(edge.id);
      }
    }
  }
  return graph;
}
