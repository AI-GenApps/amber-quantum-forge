import { boonEffects } from "./catalog";
import { RULES } from "./constants";
import { clampValue } from "./numbers";
import type { Catalog, GameEvent, GameState, Rejection } from "./types";

export interface EclipseResult {
  readonly ok: true;
  readonly state: GameState;
  readonly events: readonly GameEvent[];
  readonly shardsGained: number;
}

export function pendingShards(cycleStarlight: number): number {
  if (!Number.isFinite(cycleStarlight) || cycleStarlight <= 0) return 0;
  return Math.floor(Math.sqrt(cycleStarlight / RULES.ECLIPSE_DIVISOR));
}

export function canEclipse(state: GameState): boolean {
  return pendingShards(state.cycleStarlight) >= RULES.ECLIPSE_MIN_SHARDS;
}

export function eclipse(state: GameState, catalog: Catalog): EclipseResult | Rejection {
  if (!canEclipse(state)) return { ok: false, reason: "eclipse-unavailable" };
  const shardsGained = pendingShards(state.cycleStarlight);
  let starlight = 0;
  const owned: Record<string, number> = {};
  for (const effect of boonEffects(state, catalog)) {
    if (effect.kind === "start-starlight") starlight += effect.amount;
    if (effect.kind === "start-owned") {
      for (const [id, count] of Object.entries(effect.owned)) {
        owned[id] = (owned[id] ?? 0) + count;
      }
    }
  }
  const eclipses = state.eclipses + 1;
  return {
    ok: true,
    state: {
      ...state,
      starlight: clampValue(starlight),
      cycleStarlight: 0,
      cycleSeconds: 0,
      owned,
      upgrades: [],
      shards: state.shards + shardsGained,
      shardsEarned: state.shardsEarned + shardsGained,
      eclipses,
    },
    events: [{ type: "eclipsed", shards: shardsGained, eclipses }],
    shardsGained,
  };
}
