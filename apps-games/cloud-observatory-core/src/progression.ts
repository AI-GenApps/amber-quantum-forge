import { clampValue } from "./numbers";

export interface Stats {
  readonly taps: number;
  readonly flawlessCharts: number;
  readonly charts: number;
  readonly cometsClaimed: number;
  readonly longestStreak: number;
  readonly bestStarlightPerSecond: number;
  readonly offlineSecondsCollected: number;
  readonly fullOfflineCollects: number;
  readonly activeSeconds: number;
  readonly eclipses: number;
  readonly shardsSpent: number;
}

export type StatsEvent =
  | { readonly type: "tap" }
  | { readonly type: "active"; readonly seconds: number }
  | { readonly type: "charted"; readonly flawless: boolean }
  | { readonly type: "comet"; readonly streak: number }
  | { readonly type: "production"; readonly perSecond: number }
  | { readonly type: "offline"; readonly seconds: number; readonly full: boolean }
  | { readonly type: "eclipse" }
  | { readonly type: "shards-spent"; readonly amount: number };

export const STAT_KEYS = [
  "taps",
  "flawlessCharts",
  "charts",
  "cometsClaimed",
  "longestStreak",
  "bestStarlightPerSecond",
  "offlineSecondsCollected",
  "fullOfflineCollects",
  "activeSeconds",
  "eclipses",
  "shardsSpent",
] as const satisfies readonly (keyof Stats)[];

export function createStats(): Stats {
  return {
    taps: 0,
    flawlessCharts: 0,
    charts: 0,
    cometsClaimed: 0,
    longestStreak: 0,
    bestStarlightPerSecond: 0,
    offlineSecondsCollected: 0,
    fullOfflineCollects: 0,
    activeSeconds: 0,
    eclipses: 0,
    shardsSpent: 0,
  };
}

function positive(value: number): number {
  return Number.isFinite(value) && value > 0 ? value : 0;
}

export function updateStats(stats: Stats, event: StatsEvent): Stats {
  switch (event.type) {
    case "tap":
      return { ...stats, taps: stats.taps + 1 };
    case "active":
      return { ...stats, activeSeconds: clampValue(stats.activeSeconds + positive(event.seconds)) };
    case "charted":
      return {
        ...stats,
        charts: stats.charts + 1,
        flawlessCharts: stats.flawlessCharts + (event.flawless ? 1 : 0),
      };
    case "comet":
      return {
        ...stats,
        cometsClaimed: stats.cometsClaimed + 1,
        longestStreak: Math.max(stats.longestStreak, positive(event.streak)),
      };
    case "production": {
      const rate = clampValue(positive(event.perSecond));
      if (rate <= stats.bestStarlightPerSecond) return stats;
      return { ...stats, bestStarlightPerSecond: rate };
    }
    case "offline":
      return {
        ...stats,
        offlineSecondsCollected: clampValue(
          stats.offlineSecondsCollected + positive(event.seconds),
        ),
        fullOfflineCollects: stats.fullOfflineCollects + (event.full ? 1 : 0),
      };
    case "eclipse":
      return { ...stats, eclipses: stats.eclipses + 1 };
    case "shards-spent":
      return { ...stats, shardsSpent: stats.shardsSpent + Math.floor(positive(event.amount)) };
  }
}
