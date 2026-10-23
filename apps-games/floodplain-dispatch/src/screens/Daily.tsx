import { FREEZE_PRICE, MAX_FREEZES } from "@web-games/floodplain-dispatch-core";
import { Button, localDateKey, Screen, StarRating } from "@web-games/kit";
import { useMemo, useState } from "preact/hooks";
import { pieceName } from "../labels";
import { useApp, useProfile } from "../state/app";
import { dailyInfo } from "../state/dailyInfo";
import { t } from "../strings";
import { Header } from "../ui/Header";

export function lastDays(now: Date, count: number): string[] {
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i, 12);
    out.push(localDateKey(d));
  }
  return out;
}

export function Daily() {
  const { router, clock, game } = useApp();
  const profile = useProfile();
  const [note, setNote] = useState("");
  const now = clock();
  const dateKey = localDateKey(now);
  const info = useMemo(() => dailyInfo(dateKey), [dateKey]);
  const days = lastDays(now, 14);
  const today = profile.daily.results[dateKey];
  const { tier } = info;
  const freezesFull = profile.streakFreezes >= MAX_FREEZES;

  const buy = async (): Promise<void> => {
    const outcome = await game.buyFreeze();
    if (outcome.ok) setNote(t("dailyFreezeBought"));
    else setNote(outcome.reason === "freezes-full" ? t("dailyFreezeFull") : t("dailyFreezeBroke"));
  };

  return (
    <Screen name="daily">
      <Header title={t("dailyTitle")} />
      <section class="fd-panel" aria-label={t("dailyFor", { date: dateKey })}>
        <h2 class="fd-panel__title">{t("dailyFor", { date: dateKey })}</h2>
        <p class="fd-sub">{t("dailyTier", { name: tier.name })}</p>
        <p data-testid="daily-details">
          {t("dailyDetails", {
            cols: tier.width,
            rows: tier.height,
            weeks: tier.weeks,
            houses: tier.houses,
            fields: tier.fields,
          })}
        </p>
        <p>{t("dailyPieces", { pieces: tier.pieces.map(pieceName).join(", ") })}</p>
        {today ? <p data-testid="daily-today">{t("dailyBest", { stars: today.stars })}</p> : null}
        <Button size="large" fullWidth onClick={() => router.push("board", { daily: true })}>
          {today ? t("dailyReplay") : t("dailyPlay")}
        </Button>
      </section>
      <section class="fd-panel" aria-label="Streak">
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
          <p role="status" class="fd-note">
            {note}
          </p>
        ) : null}
      </section>
      <section class="fd-panel" aria-label={t("dailyLast14")}>
        <h2 class="fd-panel__title">{t("dailyLast14")}</h2>
        <ul class="fd-days" data-testid="daily-days">
          {days.map((key) => {
            const result = profile.daily.results[key];
            return (
              <li
                key={key}
                class="fd-day"
                aria-label={
                  result
                    ? t("dailyDayDone", { date: key, stars: result.stars })
                    : t("dailyDayNone", { date: key })
                }
              >
                <span class="fd-day__date">{key === dateKey ? t("dailyToday") : key.slice(5)}</span>
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
