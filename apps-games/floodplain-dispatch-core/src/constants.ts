import type { PieceKind } from "./types";

export const STEPS_PER_WEEK = 4 as const;

export const CANAL_EDGE_CAP = 4 as const;
export const OTHER_EDGE_CAP = 2 as const;
export const FLOW_MIN_DIFF = 2 as const;
export const PUMP_RATE = 4 as const;
export const RESERVOIR_CAPACITY = 10 as const;
export const MAX_CELL_DEPTH = 99 as const;

export const CREST_CANAL = -2 as const;
export const CREST_RESERVOIR = -3 as const;
export const CREST_BARRIER = 3 as const;

export const FLOOD_DEPTH = 2 as const;
export const SUPPLY_DEPTH = 2 as const;
export const NEED_STEPS = 6 as const;
export const FIELD_WET_MIN = 1 as const;
export const FIELD_WET_MAX = 4 as const;

export const MAX_HEIGHT = 7 as const;
export const ENGINE_MIN_WIDTH = 2 as const;
export const ENGINE_MIN_HEIGHT = 2 as const;
export const ENGINE_MAX_WIDTH = 16 as const;
export const ENGINE_MAX_HEIGHT = 20 as const;

export const PIECE_COSTS: Readonly<Record<PieceKind, number>> = Object.freeze({
  canal: 1,
  barrier: 1,
  gate: 2,
  pump: 3,
  reservoir: 4,
});

export const SCORE_STAR_ONE = 200 as const;
export const SCORE_PER_SUPPLIED_HOUSE = 100 as const;
export const SCORE_PER_IRRIGATED_FIELD = 50 as const;
export const SCORE_PER_FLOODED_HOUSE = 150 as const;
export const SCORE_PER_UNSPENT_POINT = 20 as const;
