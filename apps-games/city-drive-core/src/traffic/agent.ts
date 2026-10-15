import type { LaneEdge, RoadGraph } from "../city/graph";
import { pointOnEdge } from "../city/lane-index";
import type { KinematicBox } from "../physics/kinematic";
import { type Quat, quatFromForward } from "../physics/math";
import { AGENT_CENTRE_Y_M, HEADING_BLEND, PLAN_EDGES, WHEEL_RADIUS_M } from "./constants";
import type { Rng } from "./rng";

export type AgentBlocker = "none" | "stop-line" | "leader" | "player" | "stun";

/** What the renderer needs to draw one agent at one tick. */
export interface AgentPose {
  x: number;
  z: number;
  rotation: Quat;
  /** Wheel spin angle in radians. Visual only; never hashed. */
  spin: number;
  speed: number;
}

export interface TrafficAgent {
  readonly id: number;
  readonly modelIndex: number;
  /** Target cruise speed in m/s. */
  readonly cruise: number;
  readonly rng: Rng;
  readonly body: KinematicBox;
  /** `path[0]` is the edge the agent is on; the rest is its plan. */
  path: LaneEdge[];
  /** Distance of the car centre along `path[0]`, m. */
  s: number;
  speed: number;
  x: number;
  z: number;
  headX: number;
  headZ: number;
  spin: number;
  /** Edge just left whose reservation is held until the rear bumper clears it. */
  trailing: LaneEdge | undefined;
  stunTicks: number;
  /** Ticks spent asking for a turn without getting it. */
  waitTicks: number;
  blocker: AgentBlocker;
  /** Consecutive ticks at (almost) zero speed. */
  stoppedTicks: number;
  /** Bumper gap to the nearest thing ahead on the plan, last tick (Infinity when clear). */
  leaderGap: number;
  /** Id of that obstacle (-1 for the player), or undefined when the way is clear. */
  leaderId: number | undefined;
  travelled: number;
  prev: AgentPose;
  curr: AgentPose;
}

export function poseOf(a: TrafficAgent): AgentPose {
  return {
    x: a.x,
    z: a.z,
    rotation: quatFromForward(a.headX, a.headZ),
    spin: a.spin,
    speed: a.speed,
  };
}

/** Extend the plan to PLAN_EDGES by choosing random allowed turns from the agent's own stream. */
export function extendPlan(agent: TrafficAgent, graph: RoadGraph): void {
  while (agent.path.length < PLAN_EDGES) {
    const last = agent.path[agent.path.length - 1] as LaneEdge;
    const node = graph.nodes.get(last.to);
    if (!node || node.outEdges.length === 0) {
      throw new Error(`traffic: lane node "${last.to}" has no way on (agent ${agent.id})`);
    }
    const nextId = agent.rng.pick(node.outEdges);
    const next = graph.edges.get(nextId);
    if (!next) throw new Error(`traffic: unknown lane edge "${nextId}"`);
    agent.path.push(next);
  }
}

/**
 * Move `distance` metres along the plan. Returns the edge that was left behind when the car
 * crossed a tile border (at most one: edges are longer than a car step).
 */
export function advance(agent: TrafficAgent, distance: number): LaneEdge | undefined {
  agent.s += distance;
  agent.travelled += distance;
  agent.spin += distance / WHEEL_RADIUS_M;
  const here = agent.path[0] as LaneEdge;
  if (agent.s < here.length) return undefined;
  agent.s -= here.length;
  agent.path.shift();
  return here;
}

/** Place the agent on its lane at `s` and blend the heading toward the lane tangent. */
export function updateGeometry(agent: TrafficAgent, snapHeading = false): void {
  const edge = agent.path[0] as LaneEdge;
  const p = pointOnEdge(edge, agent.s);
  agent.x = p.x;
  agent.z = p.z;
  if (snapHeading) {
    agent.headX = p.dirX;
    agent.headZ = p.dirZ;
    return;
  }
  const hx = agent.headX + (p.dirX - agent.headX) * HEADING_BLEND;
  const hz = agent.headZ + (p.dirZ - agent.headZ) * HEADING_BLEND;
  const len = Math.sqrt(hx * hx + hz * hz) || 1;
  agent.headX = hx / len;
  agent.headZ = hz / len;
}

export function bodyPosition(agent: TrafficAgent): { x: number; y: number; z: number } {
  return { x: agent.x, y: AGENT_CENTRE_Y_M, z: agent.z };
}

export interface NewAgent {
  id: number;
  modelIndex: number;
  cruise: number;
  rng: Rng;
  body: KinematicBox;
  edge: LaneEdge;
  s: number;
  speed: number;
}

/** A fresh agent standing on `edge` at `s`, facing along the lane. Call extendPlan next. */
export function createAgent(init: NewAgent): TrafficAgent {
  const p = pointOnEdge(init.edge, init.s);
  const agent: TrafficAgent = {
    id: init.id,
    modelIndex: init.modelIndex,
    cruise: init.cruise,
    rng: init.rng,
    body: init.body,
    path: [init.edge],
    s: init.s,
    speed: init.speed,
    x: p.x,
    z: p.z,
    headX: p.dirX,
    headZ: p.dirZ,
    spin: 0,
    trailing: undefined,
    stunTicks: 0,
    waitTicks: 0,
    blocker: "none",
    stoppedTicks: 0,
    leaderGap: Number.POSITIVE_INFINITY,
    leaderId: undefined,
    travelled: 0,
    prev: { x: p.x, z: p.z, rotation: quatFromForward(p.dirX, p.dirZ), spin: 0, speed: init.speed },
    curr: { x: p.x, z: p.z, rotation: quatFromForward(p.dirX, p.dirZ), spin: 0, speed: init.speed },
  };
  return agent;
}
