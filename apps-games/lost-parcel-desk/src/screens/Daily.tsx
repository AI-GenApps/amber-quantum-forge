import { Button, Screen } from "@web-games/kit";
import {
  addDays,
  FREEZE_PRICE,
  MAX_FREEZES,
  tierFor,
  WEEKDAY_LABELS,
} from "@web-games/lost-parcel-desk-core";
import { useState } from "preact/hooks";
import { todayKey } from "../lib/daily";
import { shortDate } from "../lib/format";
import { useApp, useProfile } from "../state/app";
import { weekdayOfKey } from "../state/dailyCase";
import { t } from "../strings";
import { Header } from "../ui/Header";
import { PostageCounter } from "../ui/PostageCounter";
import { StampRow } from "../ui/StampRow";

const DAYS = 14;

export function Daily() {
  const { router, game, clock } = useApp();
  const profile = useProfile();
  const [note, setNote] = useState<string | null>(null);
  const today = todayKey(clock());
  const tier = tierFor(weekdayOfKey(today));
  const result = profile.daily.results[today];
  const heldToday = profile.session?.kind === "daily" && profile.session.id === today;
  const days = Array.from({ length: DAYS }, (_, index) => addDays(today, -index));

  const buy = async (): Promise<void> => {
    const outcome = await game.buyFreeze();
    setNote(
      outcome.ok
        ? t("dailyFreezeBought")
        : outcome.reason === "FREEZES_FULL"
          ? t("dailyFreezeFull", { max: MAX_FREEZES })
          : t("dailyFreezeShort", { price: FREEZE_PRICE }),
    );
  };

  return (
    <Screen name="daily" class="lp-daily">
      <Header title={t("dailyTitle")}>
        <PostageCounter postage={profile.postage} />
      </Header>
      <section class="lp-dailycard" aria-label={t("dailyToday")}>
        <h2 class="lp-section">{t("dailyToday")}</h2>
        <p data-testid="daily-date">
          {WEEKDAY_LABELS[weekdayOfKey(today)]} {shortDate(today)}
        </p>
        <p class="lp-subnote" data-testid="daily-tier">
          {t("dailyTier", { objects: tier.objects })}
        </p>
        {result ? (
          <p data-testid="daily-done">
            {t("dailyDone")} <StampRow earned={result.stamps} size={20} />
          </p>
        ) : null}
        <Button size="large" fullWidth onClick={() => router.push("intro", { daily: true })}>
          {result ? t("dailyAgain") : heldToday ? t("dailyResume") : t("dailyPlay")}
        </Button>
        {result ? <p class="lp-subnote">{t("dailyNoReward")}</p> : null}
      </section>
      <section class="lp-streak" aria-label={t("dailyStreakTitle")}>
        <h2 class="lp-section">{t("dailyStreakTitle")}</h2>
        <p data-testid="daily-streak">
          {t("dailyStreak", { streak: profile.daily.streak, best: profile.daily.bestStreak })}
        </p>
        <p data-testid="daily-freezes">
          {t("dailyFreezes", { count: profile.streakFreezes, max: MAX_FREEZES })}
        </p>
        <Button variant="secondary" onClick={() => void buy()}>
          {t("dailyBuyFreeze", { price: FREEZE_PRICE })}
        </Button>
        {note !== null ? (
          <p role="status" class="lp-subnote" data-testid="daily-note">
            {note}
          </p>
        ) : null}
      </section>
      <section aria-label={t("dailyHistory")}>
        <h2 class="lp-section">{t("dailyHistory")}</h2>
        <ol class="lp-days" data-testid="daily-days">
          {days.map((key) => {
            const stamps = profile.daily.results[key]?.stamps;
            return (
              <li key={key} class={`lp-day${stamps ? " lp-day--done" : ""}`} data-day={key}>
                <span class="lp-day__date">{shortDate(key)}</span>
                <span class="lp-day__result">
                  {stamps ? t("dayStamps", { stamps }) : t("dayNone")}
                </span>
              </li>
            );
          })}
        </ol>
      </section>
    </Screen>
  );
}
