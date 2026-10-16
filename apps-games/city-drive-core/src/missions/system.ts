import type { CarState } from "../cars/car";
import type { RoadGraph } from "../city/graph";
import type { LaneIndex } from "../city/lane-index";
import { rotateVec } from "../physics/math";
import type { CollisionImpulse, PhysicsWorld } from "../physics/world";
import { type BayGeometry, bayGeometry, type ParkedCar, resolveLanePoint } from "./bay";
import {
  ROUTE_REFRESH_TICKS,
  START_MAX_SPEED_KMH,
  START_RADIUS_M,
  START_REARM_M,
} from "./constants";
import { ParkingEvaluator } from "./eval-parking";
import { HitDetector } from "./hits";
import { type MissionRoute, RoutePlanner } from "./route";
import { type MissionHud, MissionRun } from "./run";
import type {
  CarFootprint,
  MissionDef,
  MissionResult,
  MissionSample,
  MissionType,
  Objective,
} from "./types";

/** A free-roam mission start marker. */
export interface StartMarker {
  missionId: string;
  type: MissionType;
  title: string;
  x: number;
  z: number;
}

export interface MissionSystemOptions {
  graph: RoadGraph;
  laneIndex: LaneIndex;
  missions: readonly MissionDef[];
  car: CarFootprint;
  /** Collider handle of the player's chassis, to recognise its collisions. */
  carCollider: number;
  /** Only this district's start markers are active. Defaults to every district. */
  district?: string;
}

/** Ground-plane sample of the car for the mission evaluators. */
export function sampleFromCar(state: CarState, hits: number): MissionSample {
  const f = rotateVec(state.rotation, { x: 0, y: 0, z: 1 });
  const len = Math.hypot(f.x, f.z) || 1;
  return {
    position: state.position,
    speedKmh: state.speedKmh,
    longitudinalG: state.longitudinalG,
    lateralG: state.lateralG,
    forward: { x: f.x / len, z: f.z / len },
    hits,
  };
}

/**
 * Glue between the simulation and the mission state machine. Call `step()` once after every
 * physics step. In free roam it opens a briefing when the car slows down on a start marker; while a
 * mission is active it feeds the evaluator and keeps an A* route to the objective.
 */
export class MissionSystem {
  readonly run: MissionRun;
  private readonly missions: readonly MissionDef[];
  private readonly planner: RoutePlanner;
  private readonly detector: HitDetector;
  private readonly graph: RoadGraph;
  private readonly district: string | undefined;
  private readonly starts: StartMarker[];
  private routeValue: MissionRoute | undefined;
  private routeKey = "";
  private routeAge = 0;
  private armed = true;
  private tickCount = 0;

  constructor(options: MissionSystemOptions) {
    this.graph = options.graph;
    this.missions = options.missions;
    this.district = options.district;
    this.run = new MissionRun({ graph: options.graph, car: options.car });
    this.planner = new RoutePlanner(options.graph, options.laneIndex);
    this.detector = new HitDetector(options.carCollider);
    this.starts = options.missions.map((m) => {
      const at = resolveLanePoint(options.graph, m.start.lane_point);
      return { missionId: m.id, type: m.type, title: m.title, x: at.x, z: at.z };
    });
  }

  /** Start markers to draw and trigger in free roam. */
  markers(): StartMarker[] {
    return this.starts.filter((s) => this.inDistrict(s.missionId));
  }

  /** Static parked cars of every parking mission; the caller adds them to the physics world. */
  parkedCars(): ParkedCar[] {
    return this.missions.flatMap((m) =>
      m.type === "parking" ? bayGeometry(this.graph, m.params.bay).parkedCars : [],
    );
  }

  /** Add the parked cars as static colliders. Returns their collider handles. */
  installParkedCars(world: PhysicsWorld): number[] {
    return this.parkedCars().map((car) => world.addStaticBox(car.center, car.half).handle);
  }

  get route(): MissionRoute | undefined {
    return this.routeValue;
  }

  /** The current objective while a mission is active. */
  get objective(): Objective | undefined {
    return this.run.hud().objective;
  }

  /** The bay of the running parking mission. */
  get bay(): BayGeometry | undefined {
    const evaluator = this.run.activeEvaluator;
    return this.run.phase === "active" && evaluator instanceof ParkingEvaluator
      ? evaluator.bay
      : undefined;
  }

  /** How much of the one-second parking hold is done, 0..1, while a parking mission runs. */
  get parkHold(): number | undefined {
    const evaluator = this.run.activeEvaluator;
    return this.run.phase === "active" && evaluator instanceof ParkingEvaluator
      ? evaluator.holdProgress()
      : undefined;
  }

  hud(): MissionHud {
    return this.run.hud();
  }

  /** briefing to active. */
  accept(): void {
    this.run.start();
    this.detector.reset();
    this.routeValue = undefined;
    this.routeKey = "";
    this.routeAge = ROUTE_REFRESH_TICKS;
  }

  /** briefing to idle. */
  decline(): void {
    this.run.cancel();
    this.armed = false;
  }

  quit(): void {
    this.run.quit();
    this.routeValue = undefined;
  }

  setPaused(paused: boolean): void {
    this.run.setPaused(paused);
  }

  /**
   * Leave the end screen: success or fail goes to results, results go back to free roam. Returns the
   * result on the call that closes the results, so the economy can take it; otherwise undefined.
   */
  advance(): MissionResult | undefined {
    if (this.run.phase === "success" || this.run.phase === "fail") {
      this.run.showResults();
      return undefined;
    }
    this.armed = false;
    return this.run.close();
  }

  step(state: CarState, impulses: readonly CollisionImpulse[]): void {
    this.tickCount++;
    const sample = sampleFromCar(state, this.detector.update(impulses));
    switch (this.run.phase) {
      case "idle":
        this.watchMarkers(sample);
        break;
      case "active":
        this.run.step(sample);
        if (this.run.phase === "active") this.refreshRoute(sample);
        else this.routeValue = undefined;
        break;
      default:
        break;
    }
  }

  get tick(): number {
    return this.tickCount;
  }

  private inDistrict(missionId: string): boolean {
    if (this.district === undefined) return true;
    return this.missions.find((m) => m.id === missionId)?.district === this.district;
  }

  private watchMarkers(sample: MissionSample): void {
    let nearest: { marker: StartMarker; distance: number } | undefined;
    for (const marker of this.markers()) {
      const distance = Math.hypot(sample.position.x - marker.x, sample.position.z - marker.z);
      if (!nearest || distance < nearest.distance) nearest = { marker, distance };
    }
    if (!nearest) return;
    if (!this.armed) {
      if (nearest.distance > START_REARM_M) this.armed = true;
      return;
    }
    if (nearest.distance > START_RADIUS_M || Math.abs(sample.speedKmh) > START_MAX_SPEED_KMH)
      return;
    const mission = this.missions.find((m) => m.id === nearest.marker.missionId);
    if (mission) this.run.open(mission);
  }

  private refreshRoute(sample: MissionSample): void {
    const objective = this.run.hud().objective;
    if (!objective) return;
    const key = `${objective.lane.edgeId}@${objective.lane.s}`;
    this.routeAge++;
    if (key === this.routeKey && this.routeAge < ROUTE_REFRESH_TICKS) return;
    const keep = key === this.routeKey ? this.routeValue : undefined;
    this.routeKey = key;
    this.routeAge = 0;
    this.routeValue = this.planner.plan(
      { x: sample.position.x, z: sample.position.z },
      objective.lane,
      keep,
    );
  }
}
