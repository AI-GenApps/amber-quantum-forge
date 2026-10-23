import {
  campaignLabel,
  findMap,
  MAPS,
  recentHistory,
  totals,
} from "@web-games/floodplain-dispatch-core";
import { Screen } from "@web-games/kit";
import { useProfile } from "../state/app";
import { t } from "../strings";
import { Header } from "../ui/Header";

export function Records() {
  const profile = useProfile();
  const sum = totals(profile);
  const best = MAPS.filter((map) => profile.best[map.id] !== undefined);
  const history = recentHistory(profile, 20);
  const rows: [string, number][] = [
    [t("recordsStars"), sum.stars],
    [t("recordsCleared"), sum.cleared],
    [t("recordsPerfect"), sum.perfect],
    [t("recordsDaily"), sum.dailyDays],
    [t("recordsStreak"), sum.bestStreak],
    [t("recordsSeasons"), sum.seasons],
  ];
  return (
    <Screen name="records">
      <Header title={t("recordsTitle")} />
      <section class="fd-panel" aria-label={t("recordsTotals")}>
        <h2 class="fd-panel__title">{t("recordsTotals")}</h2>
        <dl class="fd-totals" data-testid="totals">
          {rows.map(([label, value]) => (
            <div key={label} class="fd-totals__row">
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      </section>
      <section class="fd-panel" aria-label={t("recordsBest")}>
        <h2 class="fd-panel__title">{t("recordsBest")}</h2>
        {best.length === 0 ? (
          <p>{t("recordsNone")}</p>
        ) : (
          <ul class="fd-list" data-testid="best-list">
            {best.map((map) => {
              const record = profile.best[map.id];
              return (
                <li key={map.id}>
                  {t("recordsBestRow", {
                    name: `${campaignLabel(map.id)} ${map.name}`,
                    score: record?.score ?? 0,
                    stars: record?.stars ?? 0,
                  })}
                </li>
              );
            })}
          </ul>
        )}
      </section>
      <section class="fd-panel" aria-label={t("recordsHistory")}>
        <h2 class="fd-panel__title">{t("recordsHistory")}</h2>
        {history.length === 0 ? (
          <p>{t("recordsNone")}</p>
        ) : (
          <ul class="fd-list" data-testid="history-list">
            {history.map((entry, index) => (
              <li key={`${entry.kind}-${entry.id}-${index}`}>
                {t("recordsHistoryRow", {
                  label:
                    entry.kind === "daily"
                      ? t("recordsDailyLabel", { date: entry.id })
                      : (findMap(entry.id)?.name ?? entry.id),
                  stars: entry.stars,
                  score: entry.score,
                  spend: entry.spend,
                })}
              </li>
            ))}
          </ul>
        )}
      </section>
    </Screen>
  );
}
