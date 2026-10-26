import { Screen } from "@web-games/kit";
import {
  bestStamps,
  CASES,
  fastestTimeMs,
  recordTotals,
  TOTAL_STAMPS,
} from "@web-games/lost-parcel-desk-core";
import { formatTime } from "../lib/format";
import { useProfile } from "../state/app";
import { t } from "../strings";
import { Header } from "../ui/Header";
import { StampRow } from "../ui/StampRow";

export function Records() {
  const profile = useProfile();
  const totals = recordTotals(profile);
  const rows: [string, string | number][] = [
    [t("recordsStamps"), `${totals.stamps} / ${TOTAL_STAMPS}`],
    [t("recordsClosed"), `${totals.casesClosed} / ${CASES.length}`],
    [t("recordsPerfect"), totals.perfectCases],
    [t("recordsHints"), totals.hintsUsed],
    [t("recordsDailies"), totals.dailiesCleared],
    [t("recordsStreak"), totals.bestStreak],
    [t("recordsAchievements"), totals.achievements],
  ];
  return (
    <Screen name="records" class="lp-records">
      <Header title={t("recordsTitle")} />
      <dl class="lp-totals" data-testid="totals">
        {rows.map(([label, value]) => (
          <div key={label} class="lp-totals__row">
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <table class="lp-table-records">
        <caption class="lp-section">{t("recordsPerCase")}</caption>
        <thead>
          <tr>
            <th scope="col">{t("recordsCase")}</th>
            <th scope="col">{t("recordsBest")}</th>
            <th scope="col">{t("recordsTime")}</th>
            <th scope="col">{t("recordsHintsCol")}</th>
          </tr>
        </thead>
        <tbody>
          {CASES.map((item) => {
            const stamps = bestStamps(profile, item.id);
            const record = profile.cases[item.id];
            return (
              <tr key={item.id} data-case-row={item.id}>
                <th scope="row">{item.id}</th>
                <td>{stamps > 0 ? <StampRow earned={stamps} size={16} /> : "-"}</td>
                <td>{stamps > 0 ? formatTime(fastestTimeMs(profile, item.id)) : "-"}</td>
                <td>{record && stamps > 0 ? record.hintsOnBest : "-"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Screen>
  );
}
