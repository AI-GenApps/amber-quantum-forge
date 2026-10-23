import type { ResultHeadline, ResultStars } from "./types";

export const GAME_TITLE = "Floodplain Dispatch";
export const TAGLINE = "Water the town before the water finds it.";

export const RESULT_HEADLINES: readonly ResultHeadline[] = [
  { stars: 3, text: "Dry feet, full barns." },
  { stars: 2, text: "Everyone drinks. Mind the mud." },
  { stars: 1, text: "The town is watered, mostly." },
  { stars: 0, text: "The season got away from us." },
];

export function headlineFor(stars: ResultStars): string {
  const found = RESULT_HEADLINES.find((entry) => entry.stars === stars);
  return found ? found.text : "";
}
