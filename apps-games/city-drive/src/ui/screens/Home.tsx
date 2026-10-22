import { type DailyStatus, totalStars } from "@city-drive/core";
import { GAME_TITLE } from "../brand";
import { Wallet } from "../components/ScreenFrame";
import { Wordmark } from "../components/Wordmark";
import type { AppController, AppView } from "../controller";
import { formatCoins } from "../model/format";
import type { UiContent } from "../types";

const DAILY_BUTTON: Readonly<Record<DailyStatus, string>> = {
  available: "Drive daily",
  claimed: "Claimed today",
  "clock-backwards": "Clock is behind",
};

function DailyPanel({ view, controller }: { view: AppView; controller: AppController }) {
  const daily = view.daily;
  if (!daily) return null;
  const open = daily.status === "available";
  return (
    <section class="cd-panel cd-daily" aria-label="Daily challenge" data-status={daily.status}>
      <div class="cd-daily-head">
        <h2>Daily challenge</h2>
        <span class="cd-dim" data-testid="daily-streak">
          {daily.streak} day streak{daily.bonusPercent > 0 ? ` +${daily.bonusPercent}%` : ""}
        </span>
      </div>
      <p class="cd-daily-title" data-testid="daily-title">
        {daily.title} <span class="cd-dim">{daily.typeLabel}</span>
      </p>
      <p class="cd-dim">{daily.twist}</p>
      <ul class="cd-daily-rewards" aria-label="Rewards by stars" data-testid="daily-rewards">
        {([1, 2, 3] as const).map((stars) => (
          <li key={stars}>
            <span>
              {stars} star{stars > 1 ? "s" : ""}
            </span>
            <strong>{formatCoins(daily.rewards[String(stars) as "1" | "2" | "3"])}</strong>
          </li>
        ))}
      </ul>
      <button
        type="button"
        class="cd-button cd-button-primary"
        data-testid="daily-play"
        disabled={!open || view.loading !== undefined}
        onClick={() => void controller.playDaily()}
      >
        {DAILY_BUTTON[daily.status]}
      </button>
    </section>
  );
}

export function Home({
  view,
  controller,
  content,
}: {
  view: AppView;
  controller: AppController;
  content: UiContent;
}) {
  const district = content.progression.districts.find((d) => d.id === view.districtId);
  return (
    <section class="cd-screen cd-home" aria-label="Home">
      <div class="cd-home-top">
        <Wordmark title={GAME_TITLE} />
        <Wallet coins={view.save.coins} stars={totalStars(view.save)} />
        <DailyPanel view={view} controller={controller} />
      </div>
      <nav class="cd-home-menu" aria-label="Main menu">
        <button
          type="button"
          class="cd-button cd-button-primary cd-home-play"
          disabled={view.loading !== undefined}
          onClick={() => void controller.play()}
        >
          <span>Play</span>
          <small>{district ? `Free roam in ${district.name}` : "Free roam"}</small>
        </button>
        <button type="button" class="cd-button" onClick={() => controller.openMap()}>
          Map
        </button>
        <button type="button" class="cd-button" onClick={() => controller.openGarage()}>
          Garage
        </button>
        <button type="button" class="cd-button" onClick={() => controller.openSettings()}>
          Settings
        </button>
      </nav>
    </section>
  );
}
