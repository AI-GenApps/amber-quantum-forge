import { FIXED_DT } from "../physics/clock";

export { FIXED_DT };

export const MAX_AGENTS_DEFAULT = 16;
/** Traffic car footprint (m): the baseline hatchback. */
export const AGENT_HALF_LENGTH_M = 2.1;
export const AGENT_HALF_WIDTH_M = 0.85;
export const AGENT_HALF_HEIGHT_M = 0.45;
/** Chassis centre height above the road. */
export const AGENT_CENTRE_Y_M = 0.87;
export const WHEEL_RADIUS_M = 0.35;

export const CRUISE_MIN_KMH = 30;
export const CRUISE_MAX_KMH = 45;
export const KMH_TO_MS = 1 / 3.6;

/** Look-ahead range for the car in front (bumper to bumper), m. */
export const LOOKAHEAD_M = 25;
/** How many edges ahead an agent plans. */
export const PLAN_EDGES = 5;
/** Obstacle centres further than this from the lane centreline are not in the way. */
export const LANE_REACH_AI_M = 2;
export const LANE_REACH_PLAYER_M = 2.4;

/** Speed caps on bends, m/s. */
export const TURN_SPEED_MS = { right: 6, left: 7, uturn: 3.5 } as const;
/** Deceleration assumed when slowing for a bend or a stop line, m/s^2. */
export const PLAN_BRAKE_MS2 = 2.5;

/** The stop-line obstacle sits this far beyond the line, so the IDM minimum gap puts the nose at it. */
export const STOP_LINE_BIAS_M = 1.7;
/** Seconds of travel before the stop line at which an agent asks for its turn. */
export const REQUEST_HORIZON_S = 2;
export const REQUEST_MIN_M = 6;
/** Exit space an agent needs past an intersection before it may enter, m. */
export const EXIT_POCKET_M = 8;
/** A reservation is held until the rear bumper is this far past the intersection edge, m. */
export const RELEASE_MARGIN_M = 0.6;

export const SPAWN_MIN_M = 60;
export const SPAWN_MAX_M = 150;
export const DESPAWN_M = 170;
export const DESPAWN_FORCED_M = 260;
/** Cosine of the half field of view (55 degrees): spawns happen outside it. */
export const VIEW_HALF_COS = 0.57;
export const SPAWN_CLEARANCE_M = 14;
export const SPAWN_INTERVAL_TICKS = 20;
export const SPAWN_ATTEMPTS = 24;

export const STUN_TICKS = Math.round(3 / FIXED_DT);
/** Per-step blend of the drawn heading toward the lane tangent. */
export const HEADING_BLEND = 0.3;
