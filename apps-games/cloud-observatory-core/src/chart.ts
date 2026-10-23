import { findConstellation, ownedCount } from "./catalog";
import { RULES } from "./constants";
import { chartCost } from "./economy";
import type {
  Catalog,
  ConstellationDef,
  ConstellationId,
  GameEvent,
  GameState,
  Point,
  Rejection,
} from "./types";

export interface ChartSession {
  readonly constellationId: ConstellationId;
  readonly starCount: number;
  readonly next: number;
  readonly mistakes: number;
}

export type TapResult = "correct" | "wrong" | "repeat" | "complete" | "invalid";

export interface TapOutcome {
  readonly session: ChartSession;
  readonly result: TapResult;
}

export type ChartCheck = { readonly ok: true; readonly cost: number } | Rejection;

export interface ChartCompletion {
  readonly ok: true;
  readonly state: GameState;
  readonly events: readonly GameEvent[];
  readonly flawless: boolean;
  readonly mistakes: number;
  readonly cost: number;
}

export function canChart(
  state: GameState,
  constellationId: ConstellationId,
  catalog: Catalog,
): ChartCheck {
  const def = findConstellation(catalog, constellationId);
  if (def === undefined) return { ok: false, reason: "unknown-id" };
  if (state.charted.includes(def.id)) return { ok: false, reason: "already-charted" };
  if (ownedCount(state, def.requires.instrumentId) < def.requires.count) {
    return { ok: false, reason: "prerequisite-not-met" };
  }
  const cost = chartCost(def, state, catalog);
  if (state.starlight < cost) return { ok: false, reason: "insufficient-starlight" };
  return { ok: true, cost };
}

export function startChart(constellation: ConstellationDef): ChartSession {
  return {
    constellationId: constellation.id,
    starCount: constellation.stars.length,
    next: 0,
    mistakes: 0,
  };
}

export function isSessionComplete(session: ChartSession): boolean {
  return session.starCount > 0 && session.next >= session.starCount;
}

export function tapStar(session: ChartSession, index: number): TapOutcome {
  if (!Number.isInteger(index) || index < 0 || index >= session.starCount) {
    return { session, result: "invalid" };
  }
  if (index < session.next) return { session, result: "repeat" };
  if (index > session.next) {
    return { session: { ...session, mistakes: session.mistakes + 1 }, result: "wrong" };
  }
  const advanced = { ...session, next: session.next + 1 };
  return { session: advanced, result: isSessionComplete(advanced) ? "complete" : "correct" };
}

export function completeChart(
  state: GameState,
  session: ChartSession,
  catalog: Catalog,
): ChartCompletion | Rejection {
  const check = canChart(state, session.constellationId, catalog);
  if (!check.ok) return check;
  if (!isSessionComplete(session)) return { ok: false, reason: "session-incomplete" };
  const flawless = session.mistakes === 0;
  return {
    ok: true,
    state: {
      ...state,
      starlight: Math.max(0, state.starlight - check.cost),
      charted: [...state.charted, session.constellationId],
    },
    events: [
      {
        type: "charted",
        constellationId: session.constellationId,
        cost: check.cost,
        mistakes: session.mistakes,
        flawless,
      },
    ],
    flawless,
    mistakes: session.mistakes,
    cost: check.cost,
  };
}

export function hitTestStar(stars: readonly Point[], point: Point, radius: number): number | null {
  let best: number | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;
  stars.forEach((star, index) => {
    const distance = Math.hypot(star.x - point.x, star.y - point.y);
    if (distance <= radius && distance < bestDistance) {
      best = index;
      bestDistance = distance;
    }
  });
  return best;
}

export function minStarDistance(stars: readonly Point[]): number {
  let min = Number.POSITIVE_INFINITY;
  for (let i = 0; i < stars.length; i++) {
    for (let j = i + 1; j < stars.length; j++) {
      const a = stars[i];
      const b = stars[j];
      if (a === undefined || b === undefined) continue;
      min = Math.min(min, Math.hypot(a.x - b.x, a.y - b.y));
    }
  }
  return min;
}

export function starsInsideMargin(stars: readonly Point[]): boolean {
  const margin = RULES.MAP_MARGIN;
  return stars.every(
    (star) =>
      star.x >= margin &&
      star.x <= RULES.MAP_WIDTH - margin &&
      star.y >= margin &&
      star.y <= RULES.MAP_HEIGHT - margin,
  );
}
