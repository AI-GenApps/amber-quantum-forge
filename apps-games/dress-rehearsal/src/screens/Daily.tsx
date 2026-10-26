import {
  addDaysToKey,
  FREEZE_PRICE,
  MAX_FREEZES,
  tierFor,
  unlockedPieces,
  weekdayOfKey,
} from "@web-games/dress-rehearsal-core";
import { Button, localDateKey, Screen, StarRating } from "@web-games/kit";
import { useMemo, useState } from "preact/hooks";
import { ruleTexts } from "../sheets/Brief";
import { useApp, useProfile } from "../state/app";
import { dailyChallenge } from "../state/session";
import { t } from "../strings";
import { Header } from "../ui/Header";

export function lastDays(todayKey: string, count: number): string[] {
  return Array.from({ length: count }, (_, i) => addDaysToKey(todayKey, -i));
}

export function Daily() {
  const { router, clock, game } = useApp();
  const profile = useProfile();
  const [note, setNote] = useState("");
  const dateKey = localDateKey(clock());
  const closet = useMemo(() => unlockedPieces(profile), [profile]);
  const challenge = useMemo(() => dailyChallenge(dateKey, closet), [dateKey, closet]);
  const tier = tierFor(weekdayOfKey(dateKey));
  const today = profile.daily.results[dateKey];
  const days = lastDays(dateKey, 14);
  const freezesFull = profile.streakFreezes >= MAX_FREEZES;

  const buy = async (): Promise<void> => {
    const outcome = await game.buyFreeze();
    if (outcome.ok) setNote(t("dailyFreezeBought"));
    else setNote(outcome.reason === "MAX_FREEZES" ? t("dailyFreezeFull") : t("dailyFreezeBroke"));
  };

  return (
    <Screen name="daily">
      <Header title={t("dailyTitle")} />
      <section class="dr-panel" aria-label={t("dailyFor", { date: dateKey })}>
        <h2 class="dr-panel__title">{t("dailyFor", { date: dateKey })}</h2>
        <p class="dr-note" data-testid="daily-tier">
          {t("dailyTier", { name: tier.name, slots: tier.slotCount, rules: tier.ruleCount })}
        </p>
        <p data-testid="daily-brief">{challenge.brief}</p>
        <ul class="dr-bullets" data-testid="daily-rules">
          {ruleTexts(challenge).map((text) => (
            <li key={text}>{text}</li>
          ))}
        </ul>
        {today ? (
          <p data-testid="daily-today">
            {t("dailyBest", { stars: today.stars, harmony: today.harmony })}
          </p>
        ) : null}
        <Button size="large" fullWidth onClick={() => router.push("styling", { daily: true })}>
          {today ? t("dailyReplay") : t("dailyPlay")}
        </Button>
      </section>
      <section class="dr-panel" aria-label={t("dailyStreakLabel")}>
        <p data-testid="daily-streak">
          {t("dailyStreak", { streak: profile.daily.streak, best: profile.daily.bestStreak })}
        </p>
        <p data-testid="daily-freezes">
          {t("dailyFreezes", { count: profile.streakFreezes, max: MAX_FREEZES })}
        </p>
        <Button variant="secondary" disabled={freezesFull} onClick={() => void buy()}>
          {freezesFull ? t("dailyFreezeFull") : t("dailyBuyFreeze", { price: FREEZE_PRICE })}
        </Button>
        {note ? (
          <p role="status" class="dr-note">
            {note}
          </p>
        ) : null}
      </section>
      <section class="dr-panel" aria-label={t("dailyLast14")}>
        <h2 class="dr-panel__title">{t("dailyLast14")}</h2>
        <ul class="dr-days" data-testid="daily-days">
          {days.map((key) => {
            const result = profile.daily.results[key];
            return (
              <li
                key={key}
                class="dr-day"
                aria-label={
                  result
                    ? t("dailyDayDone", { date: key, stars: result.stars })
                    : t("dailyDayNone", { date: key })
                }
              >
                <span class="dr-day__date">{key === dateKey ? t("dailyToday") : key.slice(5)}</span>
                <StarRating
                  value={result?.stars ?? 0}
                  label={t("starsLabel", { stars: result?.stars ?? 0 })}
                />
              </li>
            );
          })}
        </ul>
      </section>
    </Screen>
  );
}
