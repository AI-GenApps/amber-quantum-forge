import { type CarEntry, type CarRoster, findCar, parseRoster } from "@city-drive/core";
import cars from "@city-drive/core/cars.json";

/** The car roster, parsed and checked once when the app starts. */
export const ROSTER: CarRoster = parseRoster(cars);

export function carEntry(id: string): CarEntry {
  return findCar(ROSTER, id);
}
