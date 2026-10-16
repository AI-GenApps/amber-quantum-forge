import { type Content, loadContent } from "../../tool/content";
import { starTimeS } from "../../tool/table";

let cached: Content | undefined;

/** Every shipped map, mission and the progression, read once per test file. */
export function content(): Content {
  cached ??= loadContent();
  return cached;
}

export function allMissions() {
  return content().districts.flatMap((d) => d.missions);
}

export { starTimeS };
