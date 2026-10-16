import {
  BASELINE_CAR,
  bayGeometry,
  buildColliders,
  buildRoadGraph,
  type Car,
  type CarState,
  type CityMap,
  createCar,
  createPhysicsWorld,
  installColliders,
  LaneIndex,
  type MissionDef,
  type MissionResult,
  MissionSystem,
  type PhysicsWorld,
  playerFromCar,
  pointOnEdge,
  quatFromForward,
  type RoadGraph,
  TrafficManager,
} from "../../src/index";
import { loadDistrict1, loadManifest } from "../city/helpers";
import { Autopilot, type AutopilotOptions } from "./autopilot";
import { junctionBoxes, TrafficWatch } from "./traffic-watch";

const SETTLE_TICKS = 45;
const DROP_HEIGHT_M = 1.1;

export interface MissionRig {
  physics: PhysicsWorld;
  car: Car;
  graph: RoadGraph;
  system: MissionSystem;
  /** The AI traffic, when the rig was created with `traffic`. */
  traffic: TrafficManager | undefined;
  ticks: number;
  /** Every state of the car, one per step, when `record` was set. */
  trail: CarState[];
  /** Junction rectangles for the autopilot's road sense. */
  watch: TrafficWatch;
}

export interface RigOptions {
  /** Place the car on this mission's start marker (default: yes). */
  at?: MissionDef;
  missions: readonly MissionDef[];
  /** The district map (default: district-1). */
  map?: CityMap;
  /** Run AI traffic with this seed and agent count. Omit for an empty city. */
  traffic?: { seed: number; maxAgents: number };
}

export async function createMissionRig(options: RigOptions): Promise<MissionRig> {
  const map = options.map ?? loadDistrict1();
  const physics = await createPhysicsWorld();
  installColliders(physics, buildColliders(map, loadManifest()));
  const graph = buildRoadGraph(map);
  const first = options.at ?? options.missions[0];
  if (!first) throw new Error("createMissionRig needs a mission");
  const edge = graph.edges.get(first.start.lane_point.edgeId);
  if (!edge) throw new Error("unknown start edge");
  const at = pointOnEdge(edge, first.start.lane_point.s);
  const car = createCar(physics, BASELINE_CAR, {
    position: { x: at.x, y: DROP_HEIGHT_M, z: at.z },
    rotation: quatFromForward(at.dirX, at.dirZ),
  });
  const system = new MissionSystem({
    graph,
    laneIndex: new LaneIndex(graph),
    missions: options.missions,
    car: {
      halfLength: BASELINE_CAR.chassisHalfExtents.z,
      halfWidth: BASELINE_CAR.chassisHalfExtents.x,
    },
    carCollider: car.colliderHandle,
  });
  system.installParkedCars(physics);
  const traffic = options.traffic
    ? new TrafficManager(physics, graph, {
        seed: options.traffic.seed,
        maxAgents: options.traffic.maxAgents,
        player: () => playerFromCar(car.state(), BASELINE_CAR.chassisHalfExtents.z),
        playerColliderHandle: car.colliderHandle,
      })
    : undefined;
  return {
    physics,
    car,
    graph,
    system,
    traffic,
    ticks: 0,
    trail: [],
    watch: new TrafficWatch(junctionBoxes(map, graph)),
  };
}

export function stepRig(rig: MissionRig, input?: Parameters<Car["applyInput"]>[0]): void {
  if (input) rig.car.applyInput(input);
  rig.physics.step();
  rig.ticks++;
  const impulses = rig.physics.drainCollisionImpulses();
  rig.traffic?.processCollisions(impulses);
  rig.system.step(rig.car.state(), impulses);
}

export interface DriveOutcome {
  result: MissionResult;
  ticks: number;
}

function isActive(rig: MissionRig): boolean {
  return rig.system.run.phase === "active";
}

/** Let the car settle on its start marker, accept the briefing, drive the autopilot to the end. */
export function driveMission(
  rig: MissionRig,
  mission: MissionDef,
  options: AutopilotOptions & { maxTicks?: number } = {},
): DriveOutcome {
  for (let i = 0; i < SETTLE_TICKS && rig.system.run.phase === "idle"; i++) stepRig(rig);
  if (rig.system.run.phase !== "briefing") {
    throw new Error(
      `expected the briefing to open on the start marker, phase is ${rig.system.run.phase}`,
    );
  }
  if (rig.system.run.mission?.id !== mission.id) {
    throw new Error(
      `the briefing that opened is ${rig.system.run.mission?.id}, not ${mission.id}: two start markers overlap`,
    );
  }
  rig.system.accept();
  const pilot = new Autopilot({ ...(rig.traffic ? { watch: rig.watch } : {}), ...options });
  const bay = mission.type === "parking" ? bayGeometry(rig.graph, mission.params.bay) : undefined;
  const lateral = mission.type === "parking" ? mission.params.bay.lateral_offset_m : 3;
  const limit = options.maxTicks ?? 60 * 200;
  for (let i = 0; i < limit && isActive(rig); i++) {
    const input = pilot.drive(
      rig.car.state(),
      rig.system.route,
      rig.system.objective,
      bay,
      lateral,
      rig.traffic?.list.map((a) => ({ x: a.x, z: a.z, speed: a.speed })),
    );
    stepRig(rig, input);
  }
  rig.system.advance();
  const result = rig.system.advance();
  if (!result) throw new Error(`mission did not finish within ${limit} ticks`);
  return { result, ticks: rig.ticks };
}
