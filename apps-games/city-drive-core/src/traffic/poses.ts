import type { Quat } from "../physics/math";
import type { AgentPose } from "./agent";
import { AGENT_CENTRE_Y_M } from "./constants";
import type { TrafficPose } from "./types";

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

function nlerp(a: Quat, b: Quat, t: number): Quat {
  const sign = a.x * b.x + a.y * b.y + a.z * b.z + a.w * b.w < 0 ? -1 : 1;
  const x = lerp(a.x, sign * b.x, t);
  const y = lerp(a.y, sign * b.y, t);
  const z = lerp(a.z, sign * b.z, t);
  const w = lerp(a.w, sign * b.w, t);
  const len = Math.sqrt(x * x + y * y + z * z + w * w) || 1;
  return { x: x / len, y: y / len, z: z / len, w: w / len };
}

/** Blend two simulated poses; alpha 0 gives `prev`, 1 gives `curr`. */
export function blendPose(
  id: number,
  modelIndex: number,
  prev: AgentPose,
  curr: AgentPose,
  alpha: number,
): TrafficPose {
  const t = Math.min(Math.max(alpha, 0), 1);
  return {
    id,
    modelIndex,
    position: { x: lerp(prev.x, curr.x, t), y: AGENT_CENTRE_Y_M, z: lerp(prev.z, curr.z, t) },
    rotation: nlerp(prev.rotation, curr.rotation, t),
    wheelRotation: lerp(prev.spin, curr.spin, t),
    speedKmh: lerp(prev.speed, curr.speed, t) * 3.6,
  };
}
