import { steerLimit, wheelbase } from "../../src/cars/controls";
import {
  BASELINE_CAR,
  type BayGeometry,
  type CarInput,
  type CarSpec,
  type CarState,
  type MissionRoute,
  type Objective,
  rotateVec,
  toBayFrame,
} from "../../src/index";

interface Pt {
  x: number;
  z: number;
}

export interface AutopilotOptions {
  spec?: CarSpec;
  cruiseKmh?: number;
  /** Largest throttle, 0..1. */
  maxThrottle?: number;
  /** Largest brake as a negative-throttle magnitude, 0..1. */
  maxBrake?: number;
  /** Lateral acceleration (m/s2) the corner speed is planned for. */
  cornerAccel?: number;
  /** Deceleration (m/s2) the speed profile plans with. */
  planBrake?: number;
}

const SAMPLE_STEP_M = 1;
const PLAN_HORIZON_M = 45;
const CURVE_SPAN_M = 2;
const MIN_CORNER_MS = 3;
/** Below this forward speed a negative throttle would select reverse gear. */
const REVERSE_GUARD_MS = 0.8;
const BAY_ENTRY_M = 16;
const BAY_BLEND_START_M = 11;
const BAY_BLEND_SPAN_M = 10;
const BAY_STOP_M = 0.25;
/** Speed (m/s) the car should have on reaching the bay entry. */
const BAY_ENTRY_MS = 3;

/** Point at arc length `s` along a polyline (clamped to its ends). */
export function pointAlong(points: readonly Pt[], s: number): Pt {
  let left = s;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1] as Pt;
    const b = points[i] as Pt;
    const len = Math.hypot(b.x - a.x, b.z - a.z);
    if (left <= len && len > 0)
      return { x: a.x + ((b.x - a.x) * left) / len, z: a.z + ((b.z - a.z) * left) / len };
    left -= len;
  }
  return points[points.length - 1] as Pt;
}

function heading(points: readonly Pt[], s: number): number {
  const a = pointAlong(points, s - CURVE_SPAN_M);
  const b = pointAlong(points, s + CURVE_SPAN_M);
  return Math.atan2(b.x - a.x, b.z - a.z);
}

function wrap(angle: number): number {
  return angle - 2 * Math.PI * Math.round(angle / (2 * Math.PI));
}

function smooth(t: number): number {
  const c = Math.min(Math.max(t, 0), 1);
  return c * c * (3 - 2 * c);
}

/** Path into a bay: from the lane, drifting sideways, then straight in to the bay centre. */
export function bayApproach(geo: BayGeometry, lateral: number): Pt[] {
  const out: Pt[] = [];
  for (let u = -BAY_ENTRY_M; u <= 0.001; u += 0.5) {
    const blend = smooth((u + BAY_BLEND_START_M) / BAY_BLEND_SPAN_M);
    const v = -lateral * (1 - blend);
    out.push({
      x: geo.centre.x + geo.axis.x * u + geo.right.x * v,
      z: geo.centre.z + geo.axis.z * u + geo.right.z * v,
    });
  }
  return out;
}

/**
 * Test-only driver: pure pursuit on the mission route (a lane polyline) with a curvature-limited
 * speed profile, plus a parallel-park manoeuvre for bay objectives. It reads only the car state.
 */
export class Autopilot {
  private readonly spec: CarSpec;
  private readonly cruiseMs: number;
  private readonly maxThrottle: number;
  private readonly maxBrake: number;
  private readonly cornerAccel: number;
  private readonly planBrake: number;

  constructor(options: AutopilotOptions = {}) {
    this.spec = options.spec ?? BASELINE_CAR;
    this.cruiseMs = (options.cruiseKmh ?? 40) / 3.6;
    this.maxThrottle = options.maxThrottle ?? 0.55;
    this.maxBrake = options.maxBrake ?? 0.28;
    this.cornerAccel = options.cornerAccel ?? 2.4;
    this.planBrake = options.planBrake ?? 1.8;
  }

  drive(
    state: CarState,
    route: MissionRoute | undefined,
    objective: Objective | undefined,
    bay?: BayGeometry,
    bayLateral = 3,
  ): CarInput {
    if (bay && objective?.kind === "bay") {
      const frame = toBayFrame(bay, state.position.x, state.position.z);
      if (frame.u > -BAY_ENTRY_M && frame.u < 2) return this.park(state, bay, bayLateral);
    }
    if (!route || route.points.length < 2) return { throttle: 0, steer: 0, handbrake: false };
    let allowed = this.profile(route.points);
    if (objective?.kind === "bay") {
      const toEntry = Math.max(0, route.length - BAY_ENTRY_M);
      allowed = Math.min(allowed, Math.sqrt(BAY_ENTRY_MS ** 2 + 2 * this.planBrake * toEntry));
    }
    return this.follow(state, route.points, allowed);
  }

  private forwardSpeed(state: CarState): number {
    return state.speedKmh / 3.6;
  }

  private follow(state: CarState, points: readonly Pt[], allowedMs: number): CarInput {
    const v = this.forwardSpeed(state);
    const lookahead = Math.min(Math.max(3.5 + 0.45 * v, 4), 11);
    const target = pointAlong(points, lookahead);
    return {
      throttle: this.throttle(v, allowedMs),
      steer: this.steer(state, target, lookahead),
      handbrake: false,
    };
  }

  private steer(state: CarState, target: Pt, lookahead: number): number {
    const f = rotateVec(state.rotation, { x: 0, y: 0, z: 1 });
    const len = Math.hypot(f.x, f.z) || 1;
    const fx = f.x / len;
    const fz = f.z / len;
    const tx = target.x - state.position.x;
    const tz = target.z - state.position.z;
    const dist = Math.hypot(tx, tz) || 1;
    const sinAlpha = (-fz * tx + fx * tz) / dist;
    const angle = Math.atan2(2 * wheelbase(this.spec) * sinAlpha, Math.max(lookahead, dist));
    const limit = steerLimit(this.spec, Math.abs(this.forwardSpeed(state)));
    return Math.min(Math.max(angle / limit, -1), 1);
  }

  private throttle(v: number, allowed: number): number {
    const raw = Math.min(Math.max((allowed - v) * 0.6, -this.maxBrake), this.maxThrottle);
    return raw < 0 && v < REVERSE_GUARD_MS ? 0 : raw;
  }

  /** Fastest safe speed now: cruise, limited by every corner within the horizon. */
  private profile(points: readonly Pt[]): number {
    let allowed = this.cruiseMs;
    for (let d = SAMPLE_STEP_M; d <= PLAN_HORIZON_M; d += SAMPLE_STEP_M) {
      const turn = Math.abs(
        wrap(heading(points, d + CURVE_SPAN_M) - heading(points, d - CURVE_SPAN_M)),
      );
      const curvature = turn / (2 * CURVE_SPAN_M);
      if (curvature < 1e-3) continue;
      const corner = Math.max(MIN_CORNER_MS, Math.sqrt(this.cornerAccel / curvature));
      allowed = Math.min(allowed, Math.sqrt(corner * corner + 2 * this.planBrake * d));
    }
    return allowed;
  }

  private park(state: CarState, geo: BayGeometry, lateral: number): CarInput {
    const frame = toBayFrame(geo, state.position.x, state.position.z);
    const remaining = -frame.u;
    const path = bayApproach(geo, lateral);
    let nearest = 0;
    let best = Number.POSITIVE_INFINITY;
    path.forEach((p, i) => {
      const d = Math.hypot(p.x - state.position.x, p.z - state.position.z);
      if (d < best) {
        best = d;
        nearest = i;
      }
    });
    const ahead = path.slice(nearest);
    const v = this.forwardSpeed(state);
    if (remaining <= BAY_STOP_M) {
      const stopped = Math.abs(v) < REVERSE_GUARD_MS;
      return { throttle: stopped ? 0 : -0.5, steer: 0, handbrake: stopped };
    }
    const allowed = Math.min(Math.sqrt(2 * 1.2 * (remaining - BAY_STOP_M)) + 0.5, 3);
    const lookahead = Math.min(Math.max(3 + 0.4 * v, 3), 6);
    const target = ahead.length > 1 ? pointAlong(ahead, lookahead) : (ahead[0] as Pt);
    return {
      throttle: this.throttle(v, allowed),
      steer: this.steer(state, target, lookahead),
      handbrake: false,
    };
  }
}
