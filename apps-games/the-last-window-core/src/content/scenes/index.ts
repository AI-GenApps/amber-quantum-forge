import type { SceneDef } from "../types";
import { ABEL_SCENES } from "./abel";
import { HENRIK_SCENES } from "./henrik";
import { JUNO_SCENES } from "./juno";
import { LEONA_SCENES } from "./leona";
import { ODILE_SCENES } from "./odile";
import { PRIYA_SCENES } from "./priya";
import { SUNNIVA_SCENES } from "./sunniva";
import { TOBIAS_SCENES } from "./tobias";

export const SCENES: readonly SceneDef[] = [
  ...ODILE_SCENES,
  ...TOBIAS_SCENES,
  ...PRIYA_SCENES,
  ...JUNO_SCENES,
  ...HENRIK_SCENES,
  ...LEONA_SCENES,
  ...ABEL_SCENES,
  ...SUNNIVA_SCENES,
];
