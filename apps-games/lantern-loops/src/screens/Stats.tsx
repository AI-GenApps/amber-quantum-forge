import { Card, Screen } from "@web-games/kit";
import { computeStats, formatDuration, type Weekday } from "@web-games/lantern-loops-core";
import { useApp } from "../app/AppContext";
import { dayShort, formatPlayTime } from "../app/format";
import { BarBlock } from "../components/BarBlock";
import { ScreenHeader } from "../components/ScreenHeader";
import { useProfile } from "../state/hooks";
import { t } from "../strings";

const WEEKDAYS: readonly Weekday[] = [1, 2, 3, 4, 5, 6, 7];

export function StatsScreen() {
  const { router, services } = useApp();
  const profile = useProfile(services.progression);
  const stats = computeStats(profile);
  const sizes = Object.keys(stats.bestTimeBySize)
    .map(Number)
    .sort((a, b) => a - b);

  const rows: Array<[string, string]> = [
    [t("stats.solved"), `${stats.solved} / ${stats.chapters.reduce((sum, c) => sum + c.total, 0)}`],
    [t("stats.stars"), `${stats.stars} / ${stats.maxStars}`],
    [t("stats.threeStar"), String(stats.threeStar)],
    [t("stats.dailies"), String(stats.dailiesSolved)],
    [t("stats.streak"), String(stats.currentStreak)],
    [t("stats.bestStreak"), String(stats.bestStreak)],
    [t("stats.hints"), String(stats.hintsUsed)],
    [t("stats.playTime"), formatPlayTime(stats.playSeconds)],
    [
      t("stats.bestDaily"),
      stats.bestDailySeconds === null ? t("stats.none") : formatDuration(stats.bestDailySeconds),
    ],
  ];

  return (
    <Screen name="stats" class="ll-screen">
      <ScreenHeader title={t("stats.title")} onBack={() => router.pop()} />
      <Card>
        <dl class="ll-stat-list">
          {rows.map(([name, value]) => (
            <div key={name} class="ll-stat-row">
              <dt>{name}</dt>
              <dd>{value}</dd>
            </div>
          ))}
          {sizes.map((size) => (
            <div key={size} class="ll-stat-row" data-best-size={size}>
              <dt>{t("stats.bestSize", { size })}</dt>
              <dd>{formatDuration(stats.bestTimeBySize[size]?.seconds ?? 0)}</dd>
            </div>
          ))}
        </dl>
      </Card>
      <BarBlock
        title={t("stats.chapters")}
        description={t("stats.chartChapters")}
        max={stats.chapters[0]?.maxStars ?? 90}
        data={stats.chapters.map((chapter) => ({ label: chapter.title, value: chapter.stars }))}
      />
      <BarBlock
        title={t("stats.weekdays")}
        description={t("stats.chartWeekdays")}
        max={Math.max(1, ...stats.solvesByWeekday)}
        data={WEEKDAYS.map((day) => ({
          label: dayShort(day),
          value: stats.solvesByWeekday[day - 1] ?? 0,
        }))}
      />
    </Screen>
  );
}
