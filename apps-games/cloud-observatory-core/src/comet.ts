import { RULES } from "./constants";
import { starlightPerSecond } from "./economy";
import { clampValue } from "./numbers";
import type { Profile } from "./profile";
import type { Catalog, Point } from "./types";

export interface CometRng {
  next(): number;
}

export type CometStep = "same-day" | "next-day" | "gap" | "clock-went-back";

export type CometRefusal = "locked" | "already-claimed" | "clock-went-back";

export type CometClaim =
  | {
      readonly ok: true;
      readonly profile: Profile;
      readonly reward: number;
      readonly shards: number;
      readonly streak: number;
    }
  | { readonly ok: false; readonly reason: CometRefusal };

export const COMET = {
  STARS: 6,
  MIN_REWARD: 1000,
  REWARD_SECONDS: 900,
  STREAK_BONUS: 0.1,
  STREAK_BONUS_MAX_STEPS: 4,
  SHARD_EVERY: 7,
  MAX_ATTEMPTS: 60,
} as const;

const FALLBACK: readonly Point[] = [
  { x: 180, y: 220 },
  { x: 520, y: 320 },
  { x: 820, y: 240 },
  { x: 700, y: 620 },
  { x: 300, y: 760 },
  { x: 560, y: 1100 },
];

function farEnough(stars: readonly Point[], point: Point): boolean {
  return stars.every(
    (star) => Math.hypot(star.x - point.x, star.y - point.y) >= RULES.STAR_MIN_SPACING,
  );
}

function candidate(rng: CometRng): Point {
  const spanX = RULES.MAP_WIDTH - 2 * RULES.MAP_MARGIN;
  const spanY = RULES.MAP_HEIGHT - 2 * RULES.MAP_MARGIN;
  return {
    x: Math.round(RULES.MAP_MARGIN + rng.next() * spanX),
    y: Math.round(RULES.MAP_MARGIN + rng.next() * spanY),
  };
}

export function generateComet(rng: CometRng): Point[] {
  for (let attempt = 0; attempt < COMET.MAX_ATTEMPTS; attempt++) {
    const stars: Point[] = [];
    for (let tries = 0; tries < COMET.MAX_ATTEMPTS * COMET.STARS; tries++) {
      const point = candidate(rng);
      if (farEnough(stars, point)) stars.push(point);
      if (stars.length === COMET.STARS) return stars;
    }
  }
  return FALLBACK.map((star) => ({ ...star }));
}

export function cometReward(production: number, streak: number): number {
  const steps = Math.min(Math.max(streak, 1) - 1, COMET.STREAK_BONUS_MAX_STEPS);
  const base = Math.max(COMET.MIN_REWARD, COMET.REWARD_SECONDS * clampValue(production));
  return clampValue(base * (1 + COMET.STREAK_BONUS * steps));
}

function nextStreak(profile: Profile, step: CometStep): number {
  if (profile.cometLastKey === null) return 1;
  return step === "next-day" ? Math.max(profile.cometStreak, 0) + 1 : 1;
}

export function claimComet(
  profile: Profile,
  dateKey: string,
  step: CometStep,
  catalog: Catalog,
): CometClaim {
  if (profile.game.charted.length < 1) return { ok: false, reason: "locked" };
  if (profile.cometLastKey !== null) {
    if (profile.cometLastKey === dateKey || step === "same-day") {
      return { ok: false, reason: "already-claimed" };
    }
    if (step === "clock-went-back") return { ok: false, reason: "clock-went-back" };
  }
  const streak = nextStreak(profile, step);
  const reward = cometReward(starlightPerSecond(profile.game, catalog), streak);
  const shards = streak % COMET.SHARD_EVERY === 0 ? 1 : 0;
  const { game } = profile;
  return {
    ok: true,
    reward,
    shards,
    streak,
    profile: {
      ...profile,
      game: {
        ...game,
        starlight: clampValue(game.starlight + reward),
        cycleStarlight: clampValue(game.cycleStarlight + reward),
        lifetimeStarlight: clampValue(game.lifetimeStarlight + reward),
        shards: game.shards + shards,
        shardsEarned: game.shardsEarned + shards,
      },
      cometLastKey: dateKey,
      cometStreak: streak,
      cometDays: profile.cometDays + 1,
    },
  };
}
