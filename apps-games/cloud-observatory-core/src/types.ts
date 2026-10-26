export type InstrumentId = string;
export type UpgradeId = string;
export type ConstellationId = string;
export type BoonId = string;
export type AchievementId = string;

export interface Point {
  readonly x: number;
  readonly y: number;
}

export interface InstrumentDef {
  readonly id: InstrumentId;
  readonly name: string;
  readonly baseCost: number;
  readonly baseSps: number;
  readonly growth: number;
}

export interface UpgradeDef {
  readonly id: UpgradeId;
  readonly instrumentId: InstrumentId;
  readonly tier: number;
  readonly name: string;
}

export interface ConstellationDef {
  readonly id: ConstellationId;
  readonly name: string;
  readonly stars: readonly Point[];
  readonly closed: boolean;
  readonly cost: number;
  readonly requires: { readonly instrumentId: InstrumentId; readonly count: number };
}

export type BoonEffect =
  | { readonly kind: "start-starlight"; readonly amount: number }
  | {
      readonly kind: "instrument-mult";
      readonly instrumentId: InstrumentId;
      readonly factor: number;
    }
  | { readonly kind: "cost-mult"; readonly factor: number }
  | { readonly kind: "offline-efficiency"; readonly value: number }
  | { readonly kind: "start-owned"; readonly owned: Readonly<Record<InstrumentId, number>> }
  | { readonly kind: "atlas-factor"; readonly factor: number }
  | { readonly kind: "upgrade-cost-mult"; readonly factor: number }
  | { readonly kind: "global-mult"; readonly factor: number };

export interface BoonDef {
  readonly id: BoonId;
  readonly name: string;
  readonly cost: number;
  readonly effect: BoonEffect;
}

export interface Catalog {
  readonly instruments: readonly InstrumentDef[];
  readonly upgrades: readonly UpgradeDef[];
  readonly constellations: readonly ConstellationDef[];
  readonly boons: readonly BoonDef[];
}

export interface GameState {
  readonly starlight: number;
  readonly cycleStarlight: number;
  readonly lifetimeStarlight: number;
  readonly shards: number;
  readonly shardsEarned: number;
  readonly owned: Readonly<Record<InstrumentId, number>>;
  readonly upgrades: readonly UpgradeId[];
  readonly charted: readonly ConstellationId[];
  readonly boons: readonly BoonId[];
  readonly achievements: readonly AchievementId[];
  readonly eclipses: number;
  readonly taps: number;
  readonly cycleSeconds: number;
}

export type GameEvent =
  | {
      readonly type: "purchased";
      readonly instrumentId: InstrumentId;
      readonly quantity: number;
      readonly cost: number;
    }
  | { readonly type: "upgraded"; readonly upgradeId: UpgradeId; readonly cost: number }
  | {
      readonly type: "charted";
      readonly constellationId: ConstellationId;
      readonly cost: number;
      readonly mistakes: number;
      readonly flawless: boolean;
    }
  | { readonly type: "eclipsed"; readonly shards: number; readonly eclipses: number }
  | { readonly type: "boon-bought"; readonly boonId: BoonId; readonly cost: number };

export type RejectReason =
  | "unknown-id"
  | "insufficient-starlight"
  | "insufficient-shards"
  | "already-owned"
  | "already-charted"
  | "threshold-not-met"
  | "not-unlocked"
  | "invalid-quantity"
  | "prerequisite-not-met"
  | "session-incomplete"
  | "eclipse-unavailable";

export interface Rejection {
  readonly ok: false;
  readonly reason: RejectReason;
}
