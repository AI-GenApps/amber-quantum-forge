import type { MissionDef, MissionHud } from "@city-drive/core";

export type MeterTone = "ok" | "warn" | "bad";

/** The type-specific bar on the HUD. `fraction` is how full the bar is drawn, 0 to 1. */
export interface Meter {
  kind: "damage" | "comfort" | "touches" | "checkpoints";
  label: string;
  fraction: number;
  text: string;
  tone: MeterTone;
}

const clamp01 = (v: number): number => Math.min(1, Math.max(0, v));

/** Tone for a bar that fills up as things get worse (damage, touches). */
function usedTone(fraction: number): MeterTone {
  if (fraction >= 0.85) return "bad";
  return fraction >= 0.5 ? "warn" : "ok";
}

/**
 * The meter for the running mission: damage for deliveries, comfort for taxis, touches for
 * parking and checkpoints for time trials. Undefined when there is no mission.
 */
export function missionMeter(mission: MissionDef | undefined, hud: MissionHud): Meter | undefined {
  if (!mission) return undefined;
  switch (mission.type) {
    case "delivery": {
      const max = Math.max(1, mission.params.max_damage);
      const fraction = clamp01(hud.damage / max);
      return {
        kind: "damage",
        label: "Damage",
        fraction,
        text: `${Math.round(hud.damage)}/${max}`,
        tone: usedTone(fraction),
      };
    }
    case "taxi": {
      const comfort = clamp01((hud.comfort ?? 100) / 100);
      return {
        kind: "comfort",
        label: "Comfort",
        fraction: comfort,
        text: `${Math.round(comfort * 100)}%`,
        tone: comfort <= 0.15 ? "bad" : comfort <= 0.5 ? "warn" : "ok",
      };
    }
    case "parking": {
      const max = Math.max(1, mission.params.max_touches);
      const fraction = clamp01(hud.damage / max);
      return {
        kind: "touches",
        label: "Touches",
        fraction,
        text: `${Math.round(hud.damage)}/${max}`,
        tone: usedTone(fraction),
      };
    }
    case "time_trial": {
      const { done, total } = hud.progress;
      return {
        kind: "checkpoints",
        label: "Checkpoints",
        fraction: total === 0 ? 0 : clamp01(done / total),
        text: `${done}/${total}`,
        tone: "ok",
      };
    }
  }
}

/** The mission clock shows in red under this many seconds. */
export const URGENT_SECONDS = 10;
