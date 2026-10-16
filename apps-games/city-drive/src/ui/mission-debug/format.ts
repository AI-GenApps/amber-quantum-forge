import type { FailReason, MissionHud, MissionResult, MissionType } from "@city-drive/core";

export const TYPE_LABELS: Readonly<Record<MissionType, string>> = {
  delivery: "Delivery",
  taxi: "Taxi",
  time_trial: "Time trial",
  parking: "Parking",
};

const FAIL_TEXT: Readonly<Record<FailReason, string>> = {
  time_out: "Out of time",
  damage_limit: "Too much damage",
  comfort_zero: "The passenger got out",
  quit: "Mission abandoned",
};

export function formatClock(seconds: number): string {
  const whole = Math.max(0, Math.ceil(seconds));
  const m = Math.floor(whole / 60);
  const s = whole % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function starText(stars: number): string {
  return "★".repeat(stars) + "☆".repeat(Math.max(0, 3 - stars));
}

export function outcomeTitle(result: MissionResult): string {
  if (result.success) return "Mission complete";
  return result.failReason ? FAIL_TEXT[result.failReason] : "Mission failed";
}

/** One short line describing what the HUD shows about the objective. */
export function objectiveLine(hud: MissionHud): string {
  if (!hud.objective) return "";
  const { done, total } = hud.progress;
  return total > 1 ? `${hud.objective.label} (${done + 1}/${total})` : hud.objective.label;
}
