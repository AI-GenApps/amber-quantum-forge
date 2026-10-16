import { readFileSync } from "node:fs";
import { join } from "node:path";
import { type CarRoster, parseRoster } from "../../src/index";

export function readRoster(): CarRoster {
  const path = join(import.meta.dirname, "../../content/cars.json");
  return parseRoster(JSON.parse(readFileSync(path, "utf8")));
}
