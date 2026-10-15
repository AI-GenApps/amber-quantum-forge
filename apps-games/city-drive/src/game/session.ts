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
  RespawnDetector,
  type RespawnReason,
  spawnPose,
} from "@city-drive/core";
import { type InputSource, toCarInput } from "../input";
import { type CarPose, interpolateCar } from "./interpolate";

/** Chassis centre height used when the car is placed on the road. */
const DROP_HEIGHT_M = 1.1;

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
  ) {
    this.laneIndex = new LaneIndex(graph);
    this.curr = car.state();
    this.prev = this.curr;
  }

  static async create(
    map: CityMap,
    manifest: CityManifest,
    input: InputSource,
    spec: CarSpec = BASELINE_CAR,
  ): Promise<GameSession> {
    const physics = await createPhysicsWorld();
    const plan = buildColliders(map, manifest);
    installColliders(physics, plan);
    const car = createCar(physics, spec, spawnPose(map, DROP_HEIGHT_M));
    return new GameSession(physics, car, plan, map, buildRoadGraph(map), input);
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

  dispose(): void {
    this.input.dispose();
    this.physics.dispose();
  }
}
