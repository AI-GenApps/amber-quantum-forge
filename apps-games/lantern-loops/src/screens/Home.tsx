import { Button, daysBetween, localDateKey, Screen } from "@web-games/kit";
import { dailyTier, liveStreak, weekdayOf } from "@web-games/lantern-loops-core";
import { useEffect, useRef } from "preact/hooks";
import { useApp } from "../app/AppContext";
import { dayName } from "../app/format";
import { Backdrop } from "../components/Backdrop";
import { EmberIcon, FlameIcon, SnowIcon, TickIcon } from "../components/icons";
import { FLICKER_PERIOD_MS, flameFlicker } from "../motion/presets";
import { streakOf } from "../services/progression-rules";
import { useProfile } from "../state/hooks";
import { t } from "../strings";

export function HomeScreen() {
  const { router, services, motion } = useApp();
  const profile = useProfile(services.progression);
  const flame = useRef<HTMLSpanElement>(null);
  const today = localDateKey(services.now());
  const solved = profile.dailiesSolved[today] !== undefined;
  const tier = dailyTier(weekdayOf(today));
  const gap = profile.lastDailyDate === null ? null : daysBetween(profile.lastDailyDate, today);
  const streak = liveStreak(streakOf(profile), gap);

  const lit = streak > 0;
  useEffect(() => {
    const el = flame.current;
    if (!el || !lit) return undefined;
    void flameFlicker(motion, el);
    if (motion.reduced) return undefined;
    const timer = setInterval(() => void flameFlicker(motion, el), FLICKER_PERIOD_MS);
    return () => clearInterval(timer);
  }, [motion, lit]);

  return (
    <Screen name="home" class="ll-screen ll-home">
      <Backdrop chapter="key-art" />
      <div class="ll-home-top">
        <h1 class="ll-brand">{t("app.title")}</h1>
        <p class="ll-tagline">{t("app.tagline")}</p>
      </div>
      <div class="ll-home-main">
        <Button size="large" fullWidth onClick={() => router.push("chapters")}>
          {t("home.play")}
        </Button>
        <button type="button" class="ll-daily-card" onClick={() => router.push("daily")}>
          <span class="wg-card wg-card--raised ll-daily-inner">
            <span class="ll-daily-head">
              <span class="ll-daily-title">{t("home.daily")}</span>
              {solved ? (
                <span class="ll-badge" data-state="solved">
                  <TickIcon />
                  {t("home.dailySolved")}
                </span>
              ) : (
                <span class="ll-badge">{t("home.dailyOpen")}</span>
              )}
            </span>
            <span class="ll-daily-meta">
              {dayName(tier.weekday)}
              {" · "}
              {t("common.boardSize", { size: tier.size })}
              {" · "}
              {t("daily.tier", { tier: tier.tier })}
            </span>
            <span class="ll-daily-streak">
              <span class="ll-flame" ref={flame}>
                <FlameIcon />
              </span>
              <span data-testid="home-streak">
                {streak > 0 ? t("home.streak", { count: streak }) : t("home.streakNone")}
              </span>
              <SnowIcon />
              <span>{profile.freezes > 0 ? t("home.freeze") : t("home.freezeUsed")}</span>
            </span>
          </span>
        </button>
        <div class="ll-grid-2">
          <Button variant="secondary" onClick={() => router.push("archive")}>
            {t("home.archive")}
          </Button>
          <Button variant="secondary" onClick={() => router.push("stats")}>
            {t("home.stats")}
          </Button>
          <Button variant="secondary" onClick={() => router.push("settings")}>
            {t("home.settings")}
          </Button>
          <Button variant="secondary" onClick={() => router.push("howto", { page: "basics" })}>
            {t("home.howto")}
          </Button>
        </div>
      </div>
      <footer class="ll-home-foot">
        <span class="ll-tokens" data-testid="home-tokens">
          <EmberIcon />
          {t("common.tokens", { count: profile.tokens })}
        </span>
        <Button variant="ghost" size="small" onClick={() => router.push("about")}>
          {t("home.about")}
        </Button>
      </footer>
    </Screen>
  );
}
