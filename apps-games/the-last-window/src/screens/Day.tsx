import { Button, Screen } from "@web-games/kit";
import {
  bookRule,
  DAY_CARDS,
  DECOR,
  drinkRule,
  getDay,
  pastryRule,
  regularsDue,
  unlocksForDay,
  WEATHER_NAMES,
} from "@web-games/the-last-window-core";
import { Backdrop, weatherBackdrop } from "../art/Backdrop";
import { Portrait } from "../art/Portrait";
import { moodLine } from "../labels";
import { useApp, useProfile } from "../state/app";
import { t } from "../strings";
import { Header } from "../ui/Header";

export function unlockNames(day: number): string[] {
  const list = unlocksForDay(day);
  return [
    ...list.drinks.map((id) => drinkRule(id).name),
    ...list.pastries.map((id) => pastryRule(id).name),
    ...list.books.map((id) => bookRule(id).title),
    ...list.decor.map((id) => DECOR.find((rule) => rule.id === id)?.name ?? id),
  ];
}

export function Day({ day }: { day: number }) {
  const { router } = useApp();
  const profile = useProfile();
  const entry = getDay(day);
  const card = DAY_CARDS.find((item) => item.day === day);
  const news = unlockNames(day);
  return (
    <Screen name="day" class="tlw-page">
      <Header title={t("dayOf", { day, total: 14 })} />
      <h2 class="tlw-display">{entry.title}</h2>
      <div class="tlw-weather" data-weather={entry.weather}>
        <Backdrop slot={weatherBackdrop(entry.weather)} owned={profile.owned} />
        <span class="tlw-weather__label">
          {t("dayWeather", { weather: WEATHER_NAMES[entry.weather] })}
        </span>
      </div>
      <p>{card?.text}</p>
      <p class="tlw-muted">{t("dayShift", { seconds: entry.shiftTicks / 10 })}</p>
      <section class="wg-card tlw-card" aria-labelledby="day-due">
        <h3 id="day-due" class="wg-card__title">
          {t("dayRegulars")}
        </h3>
        <ul class="tlw-list tlw-due">
          {regularsDue(day).map((regular) => (
            <li key={regular.id} class="tlw-due__item">
              <Portrait slot={regular.artPrefix} class="tlw-due__face" />
              <span>
                <strong>{regular.name}</strong>
                <br />
                <span class="tlw-muted">
                  {drinkRule(regular.likes.drink).name}, {pastryRule(regular.likes.pastry).name},{" "}
                  {moodLine(regular.likes.moods)}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </section>
      <section class="wg-card tlw-card" aria-labelledby="day-new">
        <h3 id="day-new" class="wg-card__title">
          {t("dayNew")}
        </h3>
        {news.length > 0 ? (
          <ul class="tlw-list">
            {news.map((name) => (
              <li key={name}>{name}</li>
            ))}
          </ul>
        ) : (
          <p>{t("dayNothingNew")}</p>
        )}
      </section>
      <Button size="large" fullWidth onClick={() => router.push("prep", { kind: "day", day })}>
        {t("dayPlan")}
      </Button>
    </Screen>
  );
}
