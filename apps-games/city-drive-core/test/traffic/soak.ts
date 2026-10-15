import { LaneIndex, type TrafficAgent } from "../../src/index";
import { obbOverlap } from "./obb";
import { createRig, offRoadSpot, parkedPlayer, type TrafficRig } from "./rig";

const TICKS_PER_S = 60;
const STOPPED_MS = 0.05;
const PROGRESS_WINDOW_S = 60;

export interface SoakResult {
  seed: number;
  simulatedSeconds: number;
  maxAgents: number;
  agentMinutes: number;
  runSeconds: number;
  spawned: number;
  despawned: number;
  forcedStops: number;
  aiAiOverlaps: number;
  centreDistanceViolations: number;
  minCentreDistanceM: number;
  maxLaneDeviationM: number;
  maxUnexplainedStuckS: number;
  maxReservedWaitS: number;
  maxStoppedS: number;
  reservationViolations: number;
  minProgressM: number;
  progressWindows: number;
}

function box(a: TrafficAgent) {
  return { x: a.x, z: a.z, hx: a.headX, hz: a.headZ, halfLength: 2.1, halfWidth: 0.85 };
}

type Root = "reserved-wait" | "excused" | "unexplained";

/** Why a stopped agent is stopped: follow the chain of leaders to whatever is holding the head. */
function rootCause(agent: TrafficAgent, byId: Map<number, TrafficAgent>): Root {
  const seen = new Set<number>();
  let current: TrafficAgent | undefined = agent;
  while (current) {
    if (seen.has(current.id)) return "unexplained";
    seen.add(current.id);
    if (current.blocker === "stop-line") return "reserved-wait";
    if (current.blocker === "player" || current.blocker === "stun") return "excused";
    if (current.blocker !== "leader" || current.leaderId === undefined) return "unexplained";
    current = byId.get(current.leaderId);
  }
  return "unexplained";
}

/** Run `seconds` of traffic with the player parked beside the road and measure the invariants. */
export async function runSoak(seed: number, seconds: number, maxAgents = 16): Promise<SoakResult> {
  const rig: TrafficRig = await createRig({ seed, maxAgents, walls: true });
  const spot = offRoadSpot(rig.map);
  Object.assign(rig.player, parkedPlayer(spot.x, spot.z));
  const lanes = new LaneIndex(rig.graph);
  const started = Date.now();
  const stuck = new Map<number, number>();
  const waiting = new Map<number, number>();
  const windowStart = new Map<number, number>();
  const r: SoakResult = {
    seed,
    simulatedSeconds: seconds,
    maxAgents,
    agentMinutes: 0,
    runSeconds: 0,
    spawned: 0,
    despawned: 0,
    forcedStops: 0,
    aiAiOverlaps: 0,
    centreDistanceViolations: 0,
    minCentreDistanceM: Number.POSITIVE_INFINITY,
    maxLaneDeviationM: 0,
    maxUnexplainedStuckS: 0,
    maxReservedWaitS: 0,
    maxStoppedS: 0,
    reservationViolations: 0,
    minProgressM: Number.POSITIVE_INFINITY,
    progressWindows: 0,
  };
  let agentTicks = 0;
  const total = seconds * TICKS_PER_S;
  for (let tick = 1; tick <= total; tick++) {
    rig.physics.step();
    const agents = rig.traffic.list;
    const byId = new Map(agents.map((a) => [a.id, a]));
    agentTicks += agents.length;
    for (const a of agents) {
      const pos = a.body.position();
      const lane = lanes.nearest({ x: pos.x, z: pos.z });
      r.maxLaneDeviationM = Math.max(
        r.maxLaneDeviationM,
        lane?.distance ?? Number.POSITIVE_INFINITY,
      );
      const edge = a.path[0];
      if (
        edge &&
        rig.traffic.table.isIntersectionEdge(edge.id) &&
        !rig.traffic.table.holds(a.id, edge.id)
      ) {
        r.reservationViolations++;
      }
      if (a.speed < STOPPED_MS) {
        r.maxStoppedS = Math.max(r.maxStoppedS, a.stoppedTicks / TICKS_PER_S);
        const cause = rootCause(a, byId);
        stuck.set(a.id, cause === "unexplained" ? (stuck.get(a.id) ?? 0) + 1 : 0);
        waiting.set(a.id, cause === "reserved-wait" ? (waiting.get(a.id) ?? 0) + 1 : 0);
        r.maxUnexplainedStuckS = Math.max(
          r.maxUnexplainedStuckS,
          (stuck.get(a.id) ?? 0) / TICKS_PER_S,
        );
        r.maxReservedWaitS = Math.max(r.maxReservedWaitS, (waiting.get(a.id) ?? 0) / TICKS_PER_S);
      } else {
        stuck.set(a.id, 0);
        waiting.set(a.id, 0);
      }
    }
    for (let p = 0; p < agents.length; p++) {
      for (let q = p + 1; q < agents.length; q++) {
        const a = agents[p] as TrafficAgent;
        const b = agents[q] as TrafficAgent;
        const d = Math.hypot(a.x - b.x, a.z - b.z);
        r.minCentreDistanceM = Math.min(r.minCentreDistanceM, d);
        if (d < 2) r.centreDistanceViolations++;
        if (obbOverlap(box(a), box(b))) r.aiAiOverlaps++;
      }
    }
    if (tick % (PROGRESS_WINDOW_S * TICKS_PER_S) === 0) {
      for (const a of agents) {
        const start = windowStart.get(a.id);
        if (start !== undefined) {
          r.minProgressM = Math.min(r.minProgressM, a.travelled - start);
          r.progressWindows++;
        }
      }
      windowStart.clear();
      for (const a of agents) windowStart.set(a.id, a.travelled);
    }
  }
  r.agentMinutes = agentTicks / TICKS_PER_S / 60;
  r.runSeconds = (Date.now() - started) / 1000;
  r.spawned = rig.traffic.stats.spawned;
  r.despawned = rig.traffic.stats.despawned;
  r.forcedStops = rig.traffic.stats.forcedStops;
  return r;
}
