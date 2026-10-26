export const version = "0.0.0";

export { evaluateAchievements, isSatisfied, withAchievements } from "./achievement-eval";
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
export type { CometClaim, CometRefusal, CometRng, CometStep } from "./comet";
export { COMET, claimComet, cometReward, generateComet } from "./comet";
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
export type { ChapterProgress } from "./lore-unlock";
export {
  chapterProgress,
  isChapterStarted,
  loreIdsFor,
  newLoreSince,
  unlockedLore,
  withLoreUnlocked,
} from "./lore-unlock";
export { clampValue, formatDuration, formatNumber, formatNumberWords } from "./numbers";
export type { Profile, Tutorial } from "./profile";
export { createProfile, createTutorial, PROFILE_VERSION, sanitizeProfile } from "./profile";
export type { Stats, StatsEvent } from "./progression";
export { createStats, STAT_KEYS, updateStats } from "./progression";
export type { Action, ReduceResult } from "./reducer";
export { reduce } from "./reducer";
export type { ResumeResult, ResumeSummary } from "./session-rules";
export { markSeen, resume, WELCOME_MIN_SECONDS } from "./session-rules";
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
