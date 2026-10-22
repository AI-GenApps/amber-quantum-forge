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
  type DailyChallenge,
  FIXED_DT,
  installColliders,
  LaneIndex,
  laneRespawn,
  loadMissionCatalog,
  type MissionDef,
  type MissionPayoutInfo,
  type MissionResult,
  MissionSystem,
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
import type { Profile } from "../save";
import { type CarPose, interpolateCar } from "./interpolate";
import { parkedCarPoses } from "./parked";
import { type DailyPayout, type DailyRun, MissionCredit } from "./sessionCredit";
import { makeStepReport, playerImpactNs, type StepReport } from "./stepReport";

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
  /** Raw mission JSON files. Omit them and the city has no missions (the default for tests). */
  missions?: readonly unknown[];
  /**
   * The player's progress. With it the selected car is the one that spawns (unless a spec is
   * passed explicitly) and every finished mission pays coins and is saved.
   */
  profile?: Profile;
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
  /** The mission system, when the session was created with missions. */
  readonly missions: MissionSystem | undefined;
  /** Results of missions the player has closed, oldest first. Coins are paid when a mission ends. */
  readonly missionResults: MissionResult[] = [];
  /** What the last fixed step did (input, speed, slip, hardest hit). Undefined before the first step. */
  lastReport: StepReport | undefined;
  private readonly credit: MissionCredit | undefined;
  private readonly catalog: readonly MissionDef[] = [];
  private pausedValue = false;
  private parkedPosesCache: TrafficPose[] | undefined;
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
    if (options.missions) {
      const catalog = loadMissionCatalog(options.missions, { graph, laneIndex: this.laneIndex });
      this.catalog = catalog;
      if (options.profile) this.credit = new MissionCredit(options.profile, catalog);
      this.missions = new MissionSystem({
        graph,
        laneIndex: this.laneIndex,
        missions: catalog,
        car: {
          halfLength: car.spec.chassisHalfExtents.z,
          halfWidth: car.spec.chassisHalfExtents.x,
        },
        carCollider: car.colliderHandle,
      });
      this.missions.installParkedCars(physics);
    }
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
    spec?: CarSpec,
    options: SessionOptions = {},
  ): Promise<GameSession> {
    const carSpec = spec ?? options.profile?.selectedSpec() ?? BASELINE_CAR;
    const physics = await createPhysicsWorld();
    const plan = buildColliders(map, manifest);
    installColliders(physics, plan);
    const car = createCar(physics, carSpec, spawnPose(map, DROP_HEIGHT_M));
    return new GameSession(physics, car, plan, map, buildRoadGraph(map), input, options);
  }

  get state(): CarState {
    return this.curr;
  }

  /** What the last finished mission paid. Undefined without a profile or before any mission ends. */
  get lastPayout(): MissionPayoutInfo | undefined {
    return this.credit?.lastPayout;
  }

  get dailyRun(): DailyRun | undefined {
    return this.credit?.dailyRun;
  }

  get lastDaily(): DailyPayout | undefined {
    return this.credit?.lastDaily;
  }

  get paused(): boolean {
    return this.pausedValue;
  }

  /** Pausing stops the whole simulation, so the mission clock stops with it. */
  setPaused(paused: boolean): void {
    this.pausedValue = paused;
    this.missions?.setPaused(paused);
  }

  /** One fixed step: read input, apply it, step the world, watch for flips and stuck cars. */
  step(): void {
    if (this.pausedValue) return;
    const input = this.input.read(FIXED_DT);
    this.lastThrottle = input.throttle;
    this.car.applyInput(toCarInput(input));
    this.physics.step();
    const impulses = this.physics.drainCollisionImpulses();
    if (this.traffic) this.trafficHits.push(...this.traffic.processCollisions(impulses));
    this.prev = this.curr;
    this.curr = this.car.state();
    const impact = playerImpactNs(impulses, this.car.colliderHandle);
    this.lastReport = makeStepReport(input, this.curr, impact, this.car.spec.topSpeedKmh);
    this.missions?.step(this.curr, impulses);
    this.credit?.check(this.missions?.run.result);
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
    this.placeOnLane(this.curr.position, true, cause);
  }

  private placeOnLane(at: { x: number; z: number }, fallback: boolean, cause: RespawnCause): void {
    const lane = laneRespawn(this.graph, this.laneIndex, at, DROP_HEIGHT_M);
    const pose: Pose | undefined =
      lane ?? (fallback ? spawnPose(this.map, DROP_HEIGHT_M) : undefined);
    if (!pose) return;
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

  /** Static parked cars beside parking bays, as poses for the traffic car renderer. */
  parkedPoses(): TrafficPose[] {
    if (!this.missions) return [];
    this.parkedPosesCache ??= parkedCarPoses(this.missions.parkedCars());
    return this.parkedPosesCache;
  }

  /** Leave the end screens: success or fail, then results. Logs the result when it is closed. */
  advanceMission(): MissionResult | undefined {
    const result = this.missions?.advance();
    if (result) this.missionResults.push(result);
    return result;
  }

  /**
   * Bring the mission system back to free roam from any phase: a running mission is abandoned and
   * the end screens are skipped. Finished missions have already paid their coins.
   */
  leaveMission(): void {
    const missions = this.missions;
    if (!missions) return;
    if (missions.run.phase === "briefing") missions.decline();
    if (missions.run.phase === "active") missions.quit();
    while (missions.run.phase !== "idle") this.advanceMission();
    this.credit?.endDaily();
  }

  /**
   * Drive-to-start shortcut for the map, retry and next: leave any mission, put the car on the
   * lane at the mission's start marker and open its briefing (or start it at once).
   */
  openMission(missionId: string, start: boolean): void {
    const mission = this.catalog.find((m) => m.id === missionId);
    if (!mission) throw new Error(`session: cannot open unknown mission "${missionId}"`);
    this.launch(mission, start);
  }

  /** Today's challenge: the catalog mission with the day's par times, paid as the daily. */
  openDaily(challenge: DailyChallenge, start: boolean): void {
    if (!this.catalog.some((m) => m.id === challenge.missionId)) {
      throw new Error(`session: daily mission "${challenge.missionId}" is not in this district`);
    }
    this.launch(challenge.mission, start);
    this.credit?.beginDaily({ date: challenge.date, missionId: challenge.missionId });
  }

  private launch(mission: MissionDef, start: boolean): void {
    const missions = this.missions;
    const marker = missions?.markers().find((m) => m.missionId === mission.id);
    if (!missions || !marker) {
      throw new Error(`session: cannot open unknown mission "${mission.id}"`);
    }
    this.leaveMission();
    this.placeOnLane(marker, false, "manual");
    missions.run.open(mission);
    if (start) missions.accept();
  }

  /** The mission definition with this id, if the city has it. */
  missionDef(missionId: string): MissionDef | undefined {
    return this.catalog.find((m) => m.id === missionId);
  }

  dispose(): void {
    this.input.dispose();
    this.physics.dispose();
  }
}
