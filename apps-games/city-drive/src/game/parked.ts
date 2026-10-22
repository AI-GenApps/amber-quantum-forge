import {
  type ParkedCar,
  quatFromForward,
  type TrafficPose,
  trafficConstants,
} from "@city-drive/core";

/** Which traffic car model the parked cars use (index into the traffic visual). */
const PARKED_MODEL_INDEX = 3;

/** Static parked cars as poses for the traffic car renderer. Ids are negative so they never clash. */
export function parkedCarPoses(cars: readonly ParkedCar[]): TrafficPose[] {
  return cars.map((car, i) => ({
    id: -(i + 1),
    modelIndex: PARKED_MODEL_INDEX,
    position: { x: car.center.x, y: trafficConstants.AGENT_CENTRE_Y_M, z: car.center.z },
    rotation: quatFromForward(car.forward.x, car.forward.z),
    wheelRotation: 0,
    speedKmh: 0,
  }));
}
