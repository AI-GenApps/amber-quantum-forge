import {
  BASELINE_CAR,
  bayGeometry,
  buildColliders,
  buildRoadGraph,
  type Car,
  type CarState,
  createCar,
  createPhysicsWorld,
  installColliders,
  LaneIndex,
  type MissionDef,
  type MissionResult,
  MissionSystem,
  type PhysicsWorld,
  pointOnEdge,
  quatFromForward,
  type RoadGraph,
} from "../../src/index";
import { loadDistrict1, loadManifest } from "../city/helpers";
import { Autopilot, type AutopilotOptions } from "./autopilot";

const SETTLE_TICKS = 45;
const DROP_HEIGHT_M = 1.1;

export interface MissionRig {
  physics: PhysicsWorld;
  car: Car;
  graph: RoadGraph;
  system: MissionSystem;
  ticks: number;
  /** Every state of the car, one per step, when `record` was set. */
  trail: CarState[];
}

export interface RigOptions {
  /** Place the car on this mission's start marker (default: yes). */
  at?: MissionDef;
  missions: readonly MissionDef[];
}

export async function createMissionRig(options: RigOptions): Promise<MissionRig> {
  const map = loadDistrict1();
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
  return { physics, car, graph, system, ticks: 0, trail: [] };
}

export function stepRig(rig: MissionRig, input?: Parameters<Car["applyInput"]>[0]): void {
  if (input) rig.car.applyInput(input);
  rig.physics.step();
  rig.ticks++;
  rig.system.step(rig.car.state(), rig.physics.drainCollisionImpulses());
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
  rig.system.accept();
  const pilot = new Autopilot(options);
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
    );
    stepRig(rig, input);
  }
  rig.system.advance();
  const result = rig.system.advance();
  if (!result) throw new Error(`mission did not finish within ${limit} ticks`);
  return { result, ticks: rig.ticks };
}
