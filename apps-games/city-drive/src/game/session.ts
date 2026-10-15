import {
  BASELINE_CAR,
  buildColliders,
  buildRoadGraph,
  type Car,
  type CarSpec,
  type CarState,
  type CityManifest,
  type CityMap,
  type ColliderPlan,
  createCar,
  createPhysicsWorld,
  FIXED_DT,
  installColliders,
  LaneIndex,
  laneRespawn,
  type PhysicsWorld,
  type Pose,
  playerFromCar,
  RespawnDetector,
  type RespawnReason,
  spawnPose,
  type TrafficCollision,
  TrafficManager,
  type TrafficPose,
} from "@city-drive/core";
import { type InputSource, toCarInput } from "../input";
import { type CarPose, interpolateCar } from "./interpolate";

/** Chassis centre height used when the car is placed on the road. */
const DROP_HEIGHT_M = 1.1;

/** Traffic settings. Omit them and the city has no AI cars (the default for tests and tools). */
interface TrafficSettings {
  seed: number;
  /** Agents alive at once. Defaults to 16. */
  maxAgents?: number;
}

export interface SessionOptions {
  traffic?: TrafficSettings;
}

export type RespawnCause = RespawnReason | "manual";

export interface RespawnEvent {
  cause: RespawnCause;
  tick: number;
}

/**
 * The player's car in a city: owns the physics world, the car, the respawn detector and the last
 * two simulated states used for interpolation. One `step()` is one fixed 1/60 s tick.
 */
export class GameSession {
  readonly respawns: RespawnEvent[] = [];
  /** Every time the player's car hit an AI car, in order. Missions (task 10) read this. */
  readonly trafficHits: TrafficCollision[] = [];
  readonly traffic: TrafficManager | undefined;
  private prev: CarState;
  private curr: CarState;
  private readonly detector = new RespawnDetector();
  private readonly laneIndex: LaneIndex;
  private lastThrottle = 0;

  private constructor(
    readonly physics: PhysicsWorld,
    readonly car: Car,
    readonly plan: ColliderPlan,
    readonly map: CityMap,
    private readonly graph: ReturnType<typeof buildRoadGraph>,
    private readonly input: InputSource,
    options: SessionOptions,
  ) {
    this.laneIndex = new LaneIndex(graph);
    this.curr = car.state();
    this.prev = this.curr;
    if (options.traffic) {
      this.traffic = new TrafficManager(physics, graph, {
        seed: options.traffic.seed,
        maxAgents: options.traffic.maxAgents,
        player: () => playerFromCar(this.curr, car.spec.chassisHalfExtents.z),
        playerColliderHandle: car.colliderHandle,
      });
    }
  }

  static async create(
    map: CityMap,
    manifest: CityManifest,
    input: InputSource,
    spec: CarSpec = BASELINE_CAR,
    options: SessionOptions = {},
  ): Promise<GameSession> {
    const physics = await createPhysicsWorld();
    const plan = buildColliders(map, manifest);
    installColliders(physics, plan);
    const car = createCar(physics, spec, spawnPose(map, DROP_HEIGHT_M));
    return new GameSession(physics, car, plan, map, buildRoadGraph(map), input, options);
  }

  get state(): CarState {
    return this.curr;
  }

  /** One fixed step: read input, apply it, step the world, watch for flips and stuck cars. */
  step(): void {
    const input = this.input.read(FIXED_DT);
    this.lastThrottle = input.throttle;
    this.car.applyInput(toCarInput(input));
    this.physics.step();
    const impulses = this.physics.drainCollisionImpulses();
    if (this.traffic) this.trafficHits.push(...this.traffic.processCollisions(impulses));
    this.prev = this.curr;
    this.curr = this.car.state();
    if (input.reset) {
      this.respawn("manual");
      return;
    }
    const reason = this.detector.update(FIXED_DT, {
      rotation: this.curr.rotation,
      speedKmh: this.curr.speedKmh,
      throttle: this.lastThrottle,
    });
    if (reason) this.respawn(reason);
  }

  /** Put the car on the nearest lane point, facing the lane direction, at rest. */
  respawn(cause: RespawnCause): void {
    const here = this.curr.position;
    const lane = laneRespawn(this.graph, this.laneIndex, { x: here.x, z: here.z }, DROP_HEIGHT_M);
    const pose: Pose = lane ?? spawnPose(this.map, DROP_HEIGHT_M);
    this.car.respawn(pose);
    this.detector.reset();
    this.curr = this.car.state();
    this.prev = this.curr;
    this.respawns.push({ cause, tick: this.physics.tick });
  }

  /** The car blended between the last two states, for drawing. */
  pose(alpha: number): CarPose {
    return interpolateCar(this.prev, this.curr, alpha);
  }

  /** The AI cars blended between their last two states, for drawing. */
  trafficPoses(alpha: number): TrafficPose[] {
    return this.traffic ? this.traffic.poses(alpha) : [];
  }

  dispose(): void {
    this.input.dispose();
    this.physics.dispose();
  }
}
