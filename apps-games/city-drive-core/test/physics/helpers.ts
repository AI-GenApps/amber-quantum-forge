import {
  type Car,
  type CarInput,
  type CarSpec,
  createCar,
  createPhysicsWorld,
  type PhysicsWorld,
} from "../../src/index";

export const COAST: CarInput = { throttle: 0, steer: 0, handbrake: false };
export const FULL_THROTTLE: CarInput = { throttle: 1, steer: 0, handbrake: false };
export const STEPS_PER_SECOND = 60;

export interface Rig {
  world: PhysicsWorld;
  car: Car;
}

/** Fresh world with ground and one car, already settled on its suspension. */
export async function createRig(spec: CarSpec): Promise<Rig> {
  const world = await createPhysicsWorld();
  world.addGround();
  const car = createCar(world, spec, { position: { x: 0, y: 1, z: 0 } });
  car.applyInput(COAST);
  runSteps(world, STEPS_PER_SECOND);
  return { world, car };
}

export function runSteps(world: PhysicsWorld, steps: number): void {
  for (let i = 0; i < steps; i++) world.step();
}

/** Hold `input` for `seconds`. */
export function drive(rig: Rig, input: CarInput, seconds: number): void {
  rig.car.applyInput(input);
  runSteps(rig.world, Math.round(seconds * STEPS_PER_SECOND));
}

/** Hold `input` until `done()` is true or `maxSeconds` pass. Returns elapsed seconds. */
export function driveUntil(
  rig: Rig,
  input: CarInput,
  done: () => boolean,
  maxSeconds: number,
): number {
  rig.car.applyInput(input);
  let steps = 0;
  const max = Math.round(maxSeconds * STEPS_PER_SECOND);
  while (!done() && steps < max) {
    rig.world.step();
    steps++;
  }
  return steps / STEPS_PER_SECOND;
}

export function accelerateTo(rig: Rig, kmh: number, maxSeconds = 40): void {
  driveUntil(rig, FULL_THROTTLE, () => rig.car.state().speedKmh >= kmh, maxSeconds);
}

/** World-space Y component of the car's up vector: 1 upright, 0 on its side, -1 upside down. */
export function uprightness(rig: Rig): number {
  const q = rig.car.state().rotation;
  return 1 - 2 * (q.x * q.x + q.z * q.z);
}

export function distance(a: { x: number; z: number }, b: { x: number; z: number }): number {
  return Math.hypot(a.x - b.x, a.z - b.z);
}
