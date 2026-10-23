import { FP_CAP, FRIENDSHIP_THRESHOLDS } from "../constants";

export function levelForFp(fp: number): number {
  return FRIENDSHIP_THRESHOLDS.filter((threshold) => fp >= threshold).length;
}

export function addFp(current: number, gain: number): number {
  return Math.min(FP_CAP, Math.max(0, current + gain));
}

export function nextThreshold(fp: number): number | null {
  return FRIENDSHIP_THRESHOLDS.find((threshold) => threshold > fp) ?? null;
}
