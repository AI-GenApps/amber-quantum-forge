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
