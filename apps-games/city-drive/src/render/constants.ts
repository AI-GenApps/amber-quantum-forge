export const CHUNK_TILES = 4;

/** A (model, chunk) pair with at least this many placements becomes a thin-instance host. */
export const THIN_INSTANCE_MIN = 3;

export const PROP_SCALE_FACTOR = 0.7;
export const GROUND_Y = -0.05;
export const GROUND_MARGIN_M = 600;

export const CAMERA_MAX_Z = 240;
export const FOG_START = 90;
export const FOG_END = 220;

export const SKY_COLOR = { r: 0.55, g: 0.72, b: 0.9 } as const;
export const GRASS_COLOR = { r: 0.36, g: 0.55, b: 0.3 } as const;
export const PLAZA_COLOR = { r: 0.72, g: 0.7, b: 0.64 } as const;

/** Chase camera assumption of task 07: 6 m up, 10 m behind the car. */
export const CHASE_HEIGHT_M = 6;
export const CHASE_DISTANCE_M = 10;

export const RENDER_BUDGETS = {
  maxDrawCalls: 100,
  targetDrawCalls: 60,
  maxTriangles: 150_000,
} as const;
