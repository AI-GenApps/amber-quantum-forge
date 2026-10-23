import { Button, Card, daysBetween, localDateKey, Screen } from "@web-games/kit";
import { dailyTier, liveStreak, weekdayOf } from "@web-games/lantern-loops-core";
import { useEffect, useState } from "preact/hooks";
import { useApp } from "../app/AppContext";
import { dayName, medallionFor, nextMedallionDays } from "../app/format";
import type { HowToPage } from "../app/routes";
import { dailyKeyOf } from "../app/source";
import { ArtImage } from "../art/ArtImage";
import { FlameIcon, SnowIcon, TickIcon } from "../components/icons";
import { ScreenHeader } from "../components/ScreenHeader";
import { streakOf } from "../services/progression-rules";
import { useProfile } from "../state/hooks";
import { t } from "../strings";

interface Mechanic {
  label: string;
  page: HowToPage;
}

export function DailyScreen() {
  const { router, services } = useApp();
  const profile = useProfile(services.progression);
  const today = localDateKey(services.now());
  const tier = dailyTier(weekdayOf(today));
  const [hasRun, setHasRun] = useState(false);
  const solved = profile.dailiesSolved[today];
  const gap = profile.lastDailyDate === null ? null : daysBetween(profile.lastDailyDate, today);
  const streak = liveStreak(streakOf(profile), gap);
  const medallion = medallionFor(streak);
  const upcoming = nextMedallionDays(streak);

  useEffect(() => {
    let live = true;
    void services.runs.get(dailyKeyOf(today)).then((run) => live && setHasRun(run !== null));
    return () => {
      live = false;
    };
  }, [services, today]);

  const mechanics: Mechanic[] = [{ label: t("mechanic.lanterns"), page: "basics" }];
  if (tier.mechanics.stones) mechanics.push({ label: t("mechanic.stones"), page: "stones" });
  if (tier.mechanics.mirrors) mechanics.push({ label: t("mechanic.mirrors"), page: "mirrors" });
  if (tier.mechanics.gates) mechanics.push({ label: t("mechanic.gates"), page: "gates" });

  const play = (): void => router.push("puzzle", { id: dailyKeyOf(today) });
  const label = solved ? t("daily.replay") : hasRun ? t("daily.continue") : t("daily.play");

  return (
    <Screen name="daily" class="ll-screen">
      <ScreenHeader title={t("daily.title")} onBack={() => router.pop()} />
      <div class="ll-medallion" data-testid="medallion">
        <ArtImage
          slot="daily-medallion"
          alt={medallion ? medallion.name : t("daily.medallionNone")}
        />
        <span class="ll-medallion-name">
          {medallion ? medallion.name : t("daily.medallionNone")}
        </span>
        {upcoming !== null ? (
          <span class="ll-muted">{t("daily.nextMedallion", { count: upcoming })}</span>
        ) : null}
      </div>
      <Card tone="raised">
        <h2 class="ll-subtitle">{t("daily.today", { day: dayName(tier.weekday) })}</h2>
        <p class="ll-body">
          {t("daily.size", { size: tier.size })}
          {" · "}
          {t("daily.tier", { tier: tier.tier })}
        </p>
        {solved ? (
          <p class="ll-body ll-solved" data-testid="daily-solved">
            <TickIcon />
            {t("daily.solvedAt", { count: solved.stars })}
          </p>
        ) : null}
        <p class="ll-body ll-streak-line">
          <FlameIcon />
          <span data-testid="daily-streak">{t("daily.streak", { count: streak })}</span>
          <span class="ll-muted">
            {t("daily.best", { count: Math.max(profile.bestStreak, streak) })}
          </span>
        </p>
        <p class="ll-body ll-streak-line">
          <SnowIcon />
          <span data-testid="daily-freeze">
            {profile.freezes > 0 ? t("daily.freezeReady") : t("daily.freezeSpent")}
          </span>
        </p>
      </Card>
      <section aria-label={t("daily.uses")}>
        <h2 class="ll-subtitle">{t("daily.uses")}</h2>
        <ul class="ll-chips" data-testid="mechanics-strip">
          {mechanics.map((entry) => (
            <li key={entry.page}>
              <button
                type="button"
                class="ll-chip-btn"
                onClick={() => router.push("howto", { page: entry.page })}
              >
                {entry.label}
              </button>
            </li>
          ))}
        </ul>
      </section>
      <Button size="large" fullWidth onClick={play}>
        {label}
      </Button>
    </Screen>
  );
}
