import type { RoadGraph } from "../city/graph";
import { pointOnEdge } from "../city/lane-index";
import { KinematicBox } from "../physics/kinematic";
import { quatFromForward } from "../physics/math";
import type { CollisionImpulse, PhysicsWorld, SteppedBody } from "../physics/world";
import {
  advance,
  bodyPosition,
  createAgent,
  extendPlan,
  poseOf,
  type TrafficAgent,
  updateGeometry,
} from "./agent";
import { buildIntersectionPlan } from "./conflicts";
import {
  AGENT_CENTRE_Y_M,
  AGENT_HALF_HEIGHT_M,
  AGENT_HALF_LENGTH_M,
  AGENT_HALF_WIDTH_M,
  CRUISE_MAX_KMH,
  CRUISE_MIN_KMH,
  DESPAWN_FORCED_M,
  DESPAWN_M,
  KMH_TO_MS,
  LANE_REACH_AI_M,
  LANE_REACH_PLAYER_M,
  MAX_AGENTS_DEFAULT,
  RELEASE_MARGIN_M,
  SPAWN_INTERVAL_TICKS,
  STUN_TICKS,
  VIEW_HALF_COS,
} from "./constants";
import { surplusAgent } from "./density";
import { drive, noseToLine, unreservedTurn } from "./driving";
import { DEFAULT_IDM, type IdmParams } from "./idm";
import { reserveTurns } from "./intersections";
import type { Obstacle } from "./leader";
import { inView, type PlayerProbe, type TrafficPlayer } from "./player";
import { blendPose } from "./poses";
import { ReservationTable } from "./reservations";
import { deriveSeed, Rng } from "./rng";
import { pickSpawnSpot, spawnEdges } from "./spawn";
import type { TrafficCollision, TrafficOptions, TrafficPose, TrafficStats } from "./types";

const AGENT_HALF = { x: AGENT_HALF_WIDTH_M, y: AGENT_HALF_HEIGHT_M, z: AGENT_HALF_LENGTH_M };
const STOPPED_MS = 0.05;
const DEFAULT_MODEL_COUNT = 4;

/**
 * Deterministic lane-following traffic. Each agent follows a plan of lane edges, brakes with a
 * simplified IDM for whatever is ahead (other agents, the player, an unreserved stop line), and
 * must reserve each intersection turn before entering it. Agents are kinematic Rapier bodies
 * moved along the lane polylines; nothing here reads a clock or an unseeded random source.
 */
export class TrafficManager implements SteppedBody {
  readonly stats: TrafficStats = { spawned: 0, despawned: 0, forcedStops: 0, collisions: 0 };
  readonly table: ReservationTable;
  private agents: TrafficAgent[] = [];
  private nextId = 0;
  private readonly rng: Rng;
  private readonly idm: IdmParams;
  private maxAgents: number;
  private readonly modelCount: number;
  private readonly player: PlayerProbe;
  private readonly playerCollider: number | undefined;
  private readonly spawnPoints;
  private collisionLog: TrafficCollision[] = [];

  constructor(
    private readonly physics: PhysicsWorld,
    private readonly graph: RoadGraph,
    private readonly options: TrafficOptions,
  ) {
    this.table = new ReservationTable(buildIntersectionPlan(graph));
    this.rng = new Rng(deriveSeed(options.seed, 0x7a11));
    this.idm = { ...DEFAULT_IDM, ...options.idm };
    this.maxAgents = options.maxAgents ?? MAX_AGENTS_DEFAULT;
    this.modelCount = options.modelCount ?? DEFAULT_MODEL_COUNT;
    this.player = options.player;
    this.playerCollider = options.playerColliderHandle;
    this.spawnPoints = spawnEdges(graph, this.table);
    if (this.spawnPoints.length === 0) throw new Error("traffic: the road graph has no spawn lane");
    physics.register(this);
  }

  get list(): readonly TrafficAgent[] {
    return this.agents;
  }

  /**
   * Changes how many agents may be alive at once. Lowering it removes one surplus car per tick
   * (unseen and far ones first); raising it lets the normal spawner refill, one car per interval.
   */
  setMaxAgents(count: number): void {
    if (!Number.isInteger(count) || count < 0) {
      throw new Error(`traffic: maxAgents must be a non-negative integer, got ${count}`);
    }
    this.maxAgents = count;
  }

  preStep(dt: number): void {
    const player = this.player();
    const obstacles = this.obstacles(player);
    this.cull(player);
    this.spawn(player, obstacles);
    const live = this.obstacles(player);
    reserveTurns(this.agents, this.table, live);
    for (const agent of this.agents) this.move(agent, live, dt);
  }

  private obstacles(player: TrafficPlayer): Obstacle[] {
    const out: Obstacle[] = this.agents.map((a) => ({
      id: a.id,
      x: a.x,
      z: a.z,
      vx: a.headX * a.speed,
      vz: a.headZ * a.speed,
      halfLength: AGENT_HALF_LENGTH_M,
      reach: LANE_REACH_AI_M,
    }));
    out.push({
      id: -1,
      x: player.x,
      z: player.z,
      vx: player.vx,
      vz: player.vz,
      halfLength: player.halfLength,
      reach: LANE_REACH_PLAYER_M,
    });
    return out;
  }

  private cull(player: TrafficPlayer): void {
    this.agents = this.agents.filter((agent) => {
      const dist = Math.hypot(agent.x - player.x, agent.z - player.z);
      const gone =
        dist > DESPAWN_FORCED_M ||
        (dist > DESPAWN_M && !inView(player, agent.x, agent.z, VIEW_HALF_COS));
      if (gone) this.remove(agent);
      return !gone;
    });
    const surplus = surplusAgent(this.agents, player, this.maxAgents);
    if (surplus) {
      this.remove(surplus);
      this.agents = this.agents.filter((agent) => agent !== surplus);
    }
  }

  private remove(agent: TrafficAgent): void {
    this.table.releaseAll(agent.id);
    agent.body.dispose();
    this.stats.despawned++;
  }

  private spawn(player: TrafficPlayer, obstacles: Obstacle[]): void {
    const first = this.physics.tick === 0;
    if (!first && this.physics.tick % SPAWN_INTERVAL_TICKS !== 0) return;
    const budget = first ? this.maxAgents : 1;
    for (let i = 0; i < budget && this.agents.length < this.maxAgents; i++) {
      const spot = pickSpawnSpot(this.spawnPoints, player, obstacles, this.rng);
      if (!spot) continue;
      const id = this.nextId++;
      const rng = new Rng(deriveSeed(this.options.seed, id + 1));
      const cruise = rng.range(CRUISE_MIN_KMH, CRUISE_MAX_KMH) * KMH_TO_MS;
      const dir = pointOnEdge(spot.edge, spot.s);
      const body = new KinematicBox(
        this.physics,
        AGENT_HALF,
        {
          position: { x: spot.x, y: AGENT_CENTRE_Y_M, z: spot.z },
          rotation: quatFromForward(dir.dirX, dir.dirZ),
        },
        { contactEvents: true },
      );
      const agent = createAgent({
        id,
        modelIndex: rng.int(this.modelCount),
        cruise,
        rng,
        body,
        edge: spot.edge,
        s: spot.s,
        speed: cruise * 0.5,
      });
      extendPlan(agent, this.graph);
      this.agents.push(agent);
      obstacles.push({
        id,
        x: agent.x,
        z: agent.z,
        vx: agent.headX * agent.speed,
        vz: agent.headZ * agent.speed,
        halfLength: AGENT_HALF_LENGTH_M,
        reach: LANE_REACH_AI_M,
      });
      this.stats.spawned++;
    }
  }

  private move(agent: TrafficAgent, obstacles: readonly Obstacle[], dt: number): void {
    if (agent.stunTicks > 0) {
      agent.stunTicks--;
      agent.speed = 0;
      agent.blocker = "stun";
    } else {
      const result = drive(agent, this.table, obstacles, this.idm);
      agent.blocker = result.blocker;
      agent.leaderGap = result.leaderGap;
      agent.leaderId = result.leaderId;
      agent.speed = Math.max(0, agent.speed + result.accel * dt);
      let step = agent.speed * dt;
      if (unreservedTurn(agent, this.table)) {
        const room = Math.max(0, noseToLine(agent));
        if (step > room) {
          step = room;
          agent.speed = 0;
          this.stats.forcedStops++;
        }
      }
      this.travel(agent, step);
    }
    agent.stoppedTicks = agent.speed < STOPPED_MS ? agent.stoppedTicks + 1 : 0;
    updateGeometry(agent);
    agent.prev = agent.curr;
    agent.curr = poseOf(agent);
    agent.body.setNext(bodyPosition(agent), agent.curr.rotation);
  }

  private travel(agent: TrafficAgent, step: number): void {
    const left = advance(agent, step);
    if (left) {
      if (agent.trailing) this.table.release(agent.id, agent.trailing.id);
      agent.trailing = this.table.isIntersectionEdge(left.id) ? left : undefined;
      extendPlan(agent, this.graph);
    }
    if (agent.trailing && agent.s >= AGENT_HALF_LENGTH_M + RELEASE_MARGIN_M) {
      this.table.release(agent.id, agent.trailing.id);
      agent.trailing = undefined;
    }
  }

  /** Agents drawn at `alpha` (0..1) between their last two simulated poses. */
  poses(alpha: number): TrafficPose[] {
    return this.agents.map((a) => blendPose(a.id, a.modelIndex, a.prev, a.curr, alpha));
  }

  /**
   * Feed in the collision impulses drained from the physics world. An agent the player's chassis
   * hit stops for 3 s and then resumes. Returns one event per fresh hit (not per tick of contact).
   */
  processCollisions(impulses: readonly CollisionImpulse[]): TrafficCollision[] {
    const events: TrafficCollision[] = [];
    for (const impulse of impulses) {
      const agent = this.agents.find(
        (a) =>
          a.body.colliderHandle === impulse.colliderA ||
          a.body.colliderHandle === impulse.colliderB,
      );
      if (!agent) continue;
      const other =
        agent.body.colliderHandle === impulse.colliderA ? impulse.colliderB : impulse.colliderA;
      if (this.playerCollider !== undefined && other !== this.playerCollider) continue;
      const fresh = agent.stunTicks === 0;
      agent.stunTicks = STUN_TICKS;
      if (!fresh) continue;
      const event = {
        tick: impulse.tick,
        agentId: agent.id,
        force: impulse.force,
        impulse: impulse.impulse,
      };
      events.push(event);
      this.collisionLog.push(event);
      this.stats.collisions++;
    }
    return events;
  }

  /** Return and clear every collision event logged since the last drain. */
  drainCollisions(): TrafficCollision[] {
    const out = this.collisionLog;
    this.collisionLog = [];
    return out;
  }

  rebind(world: Parameters<SteppedBody["rebind"]>[0]): void {
    for (const agent of this.agents) agent.body.rebind(world);
  }

  dispose(): void {
    for (const agent of this.agents) this.remove(agent);
    this.agents = [];
    this.physics.unregister(this);
  }
}
