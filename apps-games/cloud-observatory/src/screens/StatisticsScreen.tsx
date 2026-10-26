import {
  CATALOG,
  formatDuration,
  formatNumber,
  LORE,
  pendingShards,
} from "@web-games/cloud-observatory-core";
import { Screen } from "@web-games/kit";
import { useApp } from "../app/context";
import { ScreenHeader } from "../components/ScreenHeader";
import { t } from "../strings";

export function StatisticsScreen() {
  const { snapshot } = useApp();
  const { game, stats, loreUnlocked } = snapshot.profile;
  const rows: ReadonlyArray<readonly [string, string, string]> = [
    ["lifetime", t("stats.lifetime"), formatNumber(game.lifetimeStarlight)],
    ["cycle", t("stats.cycle"), formatNumber(game.cycleStarlight)],
    ["cycleTime", t("stats.cycleTime"), formatDuration(game.cycleSeconds)],
    ["best", t("stats.best"), formatNumber(stats.bestStarlightPerSecond)],
    ["taps", t("stats.taps"), formatNumber(stats.taps)],
    ["active", t("stats.active"), formatDuration(stats.activeSeconds)],
    [
      "charted",
      t("stats.charted"),
      t("stats.of", { count: game.charted.length, total: CATALOG.constellations.length }),
    ],
    ["flawless", t("stats.flawless"), formatNumber(stats.flawlessCharts)],
    ["eclipses", t("stats.eclipses"), formatNumber(game.eclipses)],
    ["pending", t("stats.pending"), formatNumber(pendingShards(game.cycleStarlight))],
    ["shardsEarned", t("stats.shardsEarned"), formatNumber(game.shardsEarned)],
    ["shardsSpent", t("stats.shardsSpent"), formatNumber(stats.shardsSpent)],
    ["comets", t("stats.comets"), formatNumber(stats.cometsClaimed)],
    ["streak", t("stats.streak"), formatNumber(stats.longestStreak)],
    ["offline", t("stats.offline"), formatDuration(stats.offlineSecondsCollected)],
    ["lore", t("stats.lore"), t("stats.of", { count: loreUnlocked.length, total: LORE.length })],
  ];
  return (
    <Screen name="statistics" class="co-screen">
      <ScreenHeader title={t("stats.title")} />
      <dl class="co-stats co-scroll">
        {rows.map(([key, label, value]) => (
          <div key={key} class="co-stats__row" data-stat={key}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </Screen>
  );
}
