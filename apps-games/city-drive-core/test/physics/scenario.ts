import {
  BASELINE_CAR,
  type Car,
  type CarInput,
  createCar,
  createPhysicsWorld,
  type PhysicsWorld,
} from "../../src/index";

/** Scripted 30 s drive: throttle, steering and handbrake as pure functions of the tick. */
export const SCENARIO_SECONDS = 30;
export const SCENARIO_STEPS = SCENARIO_SECONDS * 60;

export function scriptedInput(tick: number): CarInput {
  const second = Math.floor(tick / 60);
  const phase = Math.floor(tick / 20) % 8;
  // Integer-derived steering triangle wave; no trig in the script either.
  const tri = Math.abs(((tick % 240) - 120) / 120);
  const steer = second < 4 ? 0 : (tri * 2 - 1) * (phase < 6 ? 0.8 : 1);
  const throttle = second < 12 ? 1 : second < 16 ? 0.4 : second < 18 ? -1 : second < 22 ? 0.8 : 1;
  const handbrake = (second >= 9 && second < 10) || (second >= 25 && second < 26);
  return { throttle, steer, handbrake };
}

export interface ScenarioRig {
  world: PhysicsWorld;
  car: Car;
}

export async function createScenarioRig(): Promise<ScenarioRig> {
  const world = await createPhysicsWorld();
  world.addGround();
  world.addStaticBox({ x: 30, y: 1, z: 200 }, { x: 4, y: 1, z: 4 });
  const car = createCar(world, BASELINE_CAR, { position: { x: 0, y: 1, z: 0 } });
  return { world, car };
}

/** Run ticks [from, to) of the script. */
export function runScenario(
  rig: ScenarioRig,
  from: number,
  to: number,
  onTick?: (tick: number) => void,
): void {
  for (let tick = from; tick < to; tick++) {
    rig.car.applyInput(scriptedInput(tick));
    rig.world.step();
    onTick?.(tick + 1);
  }
}

/** Car state hash at the end of every simulated second. */
export async function hashPerSecond(): Promise<string[]> {
  const rig = await createScenarioRig();
  const hashes: string[] = [];
  runScenario(rig, 0, SCENARIO_STEPS, (tick) => {
    if (tick % 60 === 0) hashes.push(rig.car.hash());
  });
  return hashes;
}
