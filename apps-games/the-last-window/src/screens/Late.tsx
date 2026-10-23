import { Button, Screen } from "@web-games/kit";
import {
  allRegularsDue,
  getRegular,
  lateDueRegulars,
  lateOpen,
  lateShiftSeed,
} from "@web-games/the-last-window-core";
import { Backdrop } from "../art/Backdrop";
import { Portrait } from "../art/Portrait";
import { useApp, useProfile } from "../state/app";
import { useGameStore } from "../state/useGame";
import { t } from "../strings";
import { Header } from "../ui/Header";

export function Late() {
  const { router } = useApp();
  const store = useGameStore();
  const profile = useProfile();
  const open = lateOpen(profile);
  const today = store.lateToday();
  const late = profile.late;
  const claimed = late.lastKey === today.dateKey && late.firstOfDayClaimed;
  const due = lateDueRegulars(lateShiftSeed(today.seed, today.index), allRegularsDue());
  return (
    <Screen name="late" class="tlw-page">
      <Backdrop slot="interior-evening" owned={profile.owned} class="tlw-backdrop--dim" />
      <Header title={t("lateTitle")} />
      {open ? (
        <>
          <p>{t("lateIntro")}</p>
          <section class="wg-card tlw-card" aria-label={t("lateDue", { names: "" })}>
            <p data-testid="late-due">
              {t("lateDue", {
                names: due.map((entry) => getRegular(entry.regularId).shortName).join(", "),
              })}
            </p>
            <div class="tlw-faces">
              {due.map((entry) => (
                <Portrait
                  key={entry.regularId}
                  slot={getRegular(entry.regularId).artPrefix}
                  class="tlw-due__face"
                />
              ))}
            </div>
            <p>{t("lateToday", { count: today.index })}</p>
            <p data-testid="late-lamp">{claimed ? t("lateLampDone") : t("lateLamp")}</p>
            <p data-testid="late-streak">
              {t("lateStreak", { streak: late.streak, best: late.bestStreak })}
            </p>
          </section>
          <section class="wg-card tlw-card" aria-labelledby="late-records">
            <h2 id="late-records" class="wg-card__title">
              {t("lateRecords")}
            </h2>
            <ul class="tlw-list" data-testid="late-records">
              <li>{t("lateBest", { coins: late.records.bestEarnings })}</li>
              <li>{t("lateRun", { count: late.records.bestDelightedRun })}</li>
              <li>{t("lateCount", { count: late.count })}</li>
            </ul>
          </section>
          <Button size="large" fullWidth onClick={() => router.push("prep", { kind: "late" })}>
            {t("lateStart")}
          </Button>
        </>
      ) : (
        <p>{t("lateClosed")}</p>
      )}
    </Screen>
  );
}
