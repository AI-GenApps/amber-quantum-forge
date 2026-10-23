export const version = "0.0.0";

export type { InstrumentPurchase, OfflineResult, PurchaseSuccess } from "./actions";
export {
  applyOffline,
  buyBoon,
  buyInstrument,
  buyUpgrade,
  gather,
  tick,
} from "./actions";
export {
  boonEffects,
  findBoon,
  findConstellation,
  findInstrument,
  findUpgrade,
  isInstrumentUnlocked,
  ownedCount,
} from "./catalog";
export type { ChartCheck, ChartCompletion, ChartSession, TapOutcome, TapResult } from "./chart";
export {
  canChart,
  completeChart,
  hitTestStar,
  isSessionComplete,
  minStarDistance,
  starsInsideMargin,
  startChart,
  tapStar,
} from "./chart";
export { RULES } from "./constants";
export { ACHIEVEMENTS } from "./content/achievements";
export { BOONS } from "./content/boons";
export {
  achievementById,
  boonById,
  CATALOG,
  constellationById,
  instrumentById,
  loreById,
  loreForTrigger,
  upgradeById,
} from "./content/catalog";
export { CONSTELLATIONS } from "./content/constellations";
export { INSTRUMENTS } from "./content/instruments";
export { LORE, LORE_CHAPTERS } from "./content/lore";
export type {
  AchievementCondition,
  AchievementDef,
  LoreChapter,
  LoreEntry,
  LoreTrigger,
} from "./content/types";
export { UPGRADES } from "./content/upgrades";
export type { EclipseResult } from "./eclipse";
export { canEclipse, eclipse, pendingShards } from "./eclipse";
export {
  atlasFactor,
  bulkCost,
  chartCost,
  costMultiplier,
  gatherMultiplier,
  gatherValue,
  globalMultiplier,
  instrumentMultiplier,
  instrumentRate,
  instrumentUnitCost,
  maxAffordable,
  offlineEfficiency,
  starlightPerSecond,
  upgradeCost,
  upgradeCostMultiplier,
  upgradeThreshold,
} from "./economy";
export { clampValue, formatDuration, formatNumber, formatNumberWords } from "./numbers";
export type { Action, ReduceResult } from "./reducer";
export { reduce } from "./reducer";
export type { CycleReport, SimulationOptions, SimulationReport } from "./simulator";
export { simulate } from "./simulator";
export { createInitialState, sanitizeState } from "./state";
export type {
  AchievementId,
  BoonDef,
  BoonEffect,
  BoonId,
  Catalog,
  ConstellationDef,
  ConstellationId,
  GameEvent,
  GameState,
  InstrumentDef,
  InstrumentId,
  Point,
  Rejection,
  RejectReason,
  UpgradeDef,
  UpgradeId,
} from "./types";
