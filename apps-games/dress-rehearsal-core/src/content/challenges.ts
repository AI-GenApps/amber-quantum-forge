import { GALA_CHALLENGES } from "./challenges-gala";
import { MOUNTAIN_CHALLENGES } from "./challenges-mountain";
import { RAINY_CITY_CHALLENGES } from "./challenges-rainy-city";
import { RIVIERA_CHALLENGES } from "./challenges-riviera";
import { STUDIO_CHALLENGES } from "./challenges-studio";
import { VINTAGE_CHALLENGES } from "./challenges-vintage";
import type { ChallengeDef } from "./types";

export const CHALLENGES: readonly ChallengeDef[] = [
  ...RIVIERA_CHALLENGES,
  ...RAINY_CITY_CHALLENGES,
  ...GALA_CHALLENGES,
  ...MOUNTAIN_CHALLENGES,
  ...STUDIO_CHALLENGES,
  ...VINTAGE_CHALLENGES,
];
