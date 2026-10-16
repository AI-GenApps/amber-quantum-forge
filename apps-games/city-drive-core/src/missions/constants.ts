/** Contact impulse (N*s, force times the 1/60 s step) a single step needs to count as a hit. */
export const HIT_IMPULSE_NS = 400;
/** Steps after a counted hit during which further contacts belong to the same crash. */
export const HIT_COOLDOWN_TICKS = 30;

/** Default distance (m) at which a pickup or drop-off counts as reached. */
export const POINT_RADIUS_M = 6;
/** Default checkpoint radius (m). */
export const CHECKPOINT_RADIUS_M = 8;

/** cos(15 degrees): a parked car must be at least this aligned with the bay axis. */
export const PARK_ALIGN_COS = 0.9659258262890683;
export const PARK_MAX_SPEED_KMH = 1;
/** Steps the parking conditions must hold in a row (1 s). */
export const PARK_HOLD_TICKS = 60;

export const COMFORT_START = 100;
/** Longitudinal acceleration (g) above which passengers are uncomfortable. */
export const COMFORT_LONG_G = 0.35;
/** Lateral acceleration (g) above which passengers are uncomfortable. */
export const COMFORT_LAT_G = 0.4;
/** Comfort lost per second for each g above the limits. */
export const COMFORT_DRAIN_PER_G_S = 100;
/** Comfort lost per hit. */
export const COMFORT_HIT_PENALTY = 25;

/** Free-roam marker: the briefing opens inside this radius (m)... */
export const START_RADIUS_M = 8;
/** ...at or below this speed. */
export const START_MAX_SPEED_KMH = 15;
/** After a briefing is dismissed the player must leave this radius before it can reopen. */
export const START_REARM_M = 14;

/** Ticks between route refreshes while a mission is active. */
export const ROUTE_REFRESH_TICKS = 15;
