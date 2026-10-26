import {
  ACHIEVEMENTS,
  type AchievementDef,
  atlasFactor,
  type BoonDef,
  bulkCost,
  CATALOG,
  type ConstellationDef,
  canEclipse,
  chartCost,
  costMultiplier,
  type InstrumentDef,
  instrumentRate,
  instrumentUnitCost,
  isInstrumentUnlocked,
  maxAffordable,
  ownedCount,
  type Profile,
  pendingShards,
  RULES,
  type UpgradeDef,
  upgradeCost,
  upgradeCostMultiplier,
  upgradeThreshold,
} from "@web-games/cloud-observatory-core";

export type BuyMode = 1 | 10 | "max";

export interface BuyQuote {
  readonly count: number;
  readonly cost: number;
  readonly affordable: boolean;
}

export function buyQuote(profile: Profile, def: InstrumentDef, mode: BuyMode): BuyQuote {
  const { game } = profile;
  const owned = ownedCount(game, def.id);
  const costMult = costMultiplier(game, CATALOG);
  const wanted = mode === "max" ? maxAffordable(def, owned, game.starlight, costMult) : mode;
  const count = Math.max(1, wanted);
  const cost = bulkCost(def, owned, count, costMult);
  return { count, cost, affordable: wanted >= 1 && cost <= game.starlight };
}

export type UpgradeState = "bought" | "available" | "short" | "locked";

export interface UpgradeView {
  readonly def: UpgradeDef;
  readonly state: UpgradeState;
  readonly cost: number;
  readonly threshold: number;
}

export function upgradeViews(profile: Profile, instrument: InstrumentDef): UpgradeView[] {
  const { game } = profile;
  const owned = ownedCount(game, instrument.id);
  return CATALOG.upgrades
    .filter((def) => def.instrumentId === instrument.id)
    .map((def) => {
      const threshold = upgradeThreshold(def.tier);
      const cost = upgradeCost(instrument, def.tier, upgradeCostMultiplier(game, CATALOG));
      let state: UpgradeState;
      if (game.upgrades.includes(def.id)) state = "bought";
      else if (owned < threshold) state = "locked";
      else state = cost <= game.starlight ? "available" : "short";
      return { def, state, cost, threshold };
    });
}

export interface InstrumentView {
  readonly def: InstrumentDef;
  readonly index: number;
  readonly unlocked: boolean;
  readonly owned: number;
  readonly perSecond: number;
  readonly unitCost: number;
  readonly previous: InstrumentDef | undefined;
}

export function instrumentViews(profile: Profile): InstrumentView[] {
  const { game } = profile;
  const costMult = costMultiplier(game, CATALOG);
  return CATALOG.instruments.map((def, index) => ({
    def,
    index,
    unlocked: isInstrumentUnlocked(game, def.id, CATALOG),
    owned: ownedCount(game, def.id),
    perSecond: instrumentRate(game, def.id, CATALOG),
    unitCost: instrumentUnitCost(def, ownedCount(game, def.id), costMult),
    previous: CATALOG.instruments[index - 1],
  }));
}

export type AtlasState = "locked" | "ready" | "charted";

export interface AtlasCard {
  readonly def: ConstellationDef;
  readonly state: AtlasState;
  readonly cost: number;
  readonly prerequisiteMet: boolean;
  readonly haveCount: number;
  readonly affordable: boolean;
  readonly instrumentName: string;
}

export function atlasCards(profile: Profile): AtlasCard[] {
  const { game } = profile;
  return CATALOG.constellations.map((def) => {
    const haveCount = ownedCount(game, def.requires.instrumentId);
    const prerequisiteMet = haveCount >= def.requires.count;
    const cost = chartCost(def, game, CATALOG);
    const affordable = game.starlight >= cost;
    const charted = game.charted.includes(def.id);
    const state: AtlasState = charted
      ? "charted"
      : prerequisiteMet && affordable
        ? "ready"
        : "locked";
    const instrument = CATALOG.instruments.find((item) => item.id === def.requires.instrumentId);
    return {
      def,
      state,
      cost,
      prerequisiteMet,
      haveCount,
      affordable,
      instrumentName: instrument?.name ?? def.requires.instrumentId,
    };
  });
}

/** Whole or one-decimal percent of the permanent atlas bonus, for example 30 or 7.5. */
export function atlasBonusPercent(profile: Profile): number {
  const factor = atlasFactor(profile.game, CATALOG);
  const percent = RULES.ATLAS_BONUS * factor * profile.game.charted.length * 100;
  return Math.round(percent * 10) / 10;
}

export type BoonState = "owned" | "affordable" | "short";

export interface BoonView {
  readonly def: BoonDef;
  readonly state: BoonState;
  readonly missing: number;
}

export function boonViews(profile: Profile): BoonView[] {
  const { game } = profile;
  return CATALOG.boons.map((def) => {
    if (game.boons.includes(def.id)) return { def, state: "owned", missing: 0 };
    const missing = Math.max(0, def.cost - game.shards);
    return { def, state: missing === 0 ? "affordable" : "short", missing };
  });
}

export interface EclipseView {
  readonly pending: number;
  readonly available: boolean;
  readonly needed: number;
}

export function eclipseView(profile: Profile): EclipseView {
  const pending = pendingShards(profile.game.cycleStarlight);
  return {
    pending,
    available: canEclipse(profile.game),
    needed: Math.max(0, RULES.ECLIPSE_MIN_SHARDS - pending),
  };
}

export interface AchievementView {
  readonly def: AchievementDef;
  readonly unlocked: boolean;
  readonly current: number;
  readonly target: number;
}

function progressFor(def: AchievementDef, profile: Profile, loreCount: number): [number, number] {
  const { game, stats } = profile;
  const condition = def.condition;
  switch (condition.kind) {
    case "owned":
      return [ownedCount(game, condition.instrumentId), condition.count];
    case "charted":
      return [game.charted.length, condition.count];
    case "flawless":
      return [Math.min(stats.flawlessCharts, 1), 1];
    case "lifetime":
      return [game.lifetimeStarlight, condition.amount];
    case "eclipses":
      return [game.eclipses, condition.count];
    case "comet-days":
      return [profile.cometDays, condition.count];
    case "comet-streak":
      return [stats.longestStreak, condition.count];
    case "lore":
      return [loreCount, condition.count];
    case "offline-full":
      return [Math.min(stats.fullOfflineCollects, 1), 1];
  }
}

export function achievementViews(profile: Profile): AchievementView[] {
  const loreCount = profile.loreUnlocked.length;
  return ACHIEVEMENTS.map((def) => {
    const unlocked = profile.game.achievements.includes(def.id);
    const [current, target] = progressFor(def, profile, loreCount);
    return { def, unlocked, current: unlocked ? target : Math.min(current, target), target };
  });
}

export type GoalKind = "chart" | "eclipse" | "upgrade" | "instrument" | "gather";

export interface NextGoal {
  readonly kind: GoalKind;
  readonly name: string;
  readonly cost: number;
  readonly affordable: boolean;
}

/** The cheapest useful thing to do next: a chart or Eclipse you can do, else the cheapest purchase. */
export function nextGoal(profile: Profile): NextGoal {
  const { game } = profile;
  const ready = atlasCards(profile).find((card) => card.state === "ready");
  if (ready) return { kind: "chart", name: ready.def.name, cost: ready.cost, affordable: true };
  if (canEclipse(game) && game.eclipses === 0) {
    return { kind: "eclipse", name: "", cost: 0, affordable: true };
  }
  const options: NextGoal[] = [];
  for (const view of instrumentViews(profile)) {
    if (view.unlocked) {
      options.push({
        kind: "instrument",
        name: view.def.name,
        cost: view.unitCost,
        affordable: view.unitCost <= game.starlight,
      });
    }
    for (const up of upgradeViews(profile, view.def)) {
      if (up.state === "available" || up.state === "short") {
        options.push({
          kind: "upgrade",
          name: up.def.name,
          cost: up.cost,
          affordable: up.state === "available",
        });
      }
    }
  }
  const affordable = options.filter((option) => option.affordable);
  const pool = affordable.length > 0 ? affordable : options;
  const best = pool.reduce<NextGoal | null>(
    (a, b) => (a === null || b.cost < a.cost ? b : a),
    null,
  );
  return best ?? { kind: "gather", name: "", cost: 0, affordable: true };
}

/** True once the player has done anything, so the title offers Continue instead of Begin. */
export function hasProgress(profile: Profile): boolean {
  const { game, stats } = profile;
  return (
    stats.taps > 0 ||
    stats.activeSeconds > 0 ||
    game.lifetimeStarlight > 0 ||
    game.charted.length > 0 ||
    game.eclipses > 0 ||
    Object.values(game.owned).some((count) => count > 0)
  );
}
