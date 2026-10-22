import { totalStars } from "@city-drive/core";
import { CoinIcon } from "../components/Icons";
import { Meter } from "../components/Meter";
import { ScreenFrame } from "../components/ScreenFrame";
import type { AppController, AppView } from "../controller";
import { formatCoins } from "../model/format";
import { type CarCard, garageCards } from "../model/garage";
import { upgradeRows } from "../model/upgrades";
import type { UiContent } from "../types";

const STAT_LABELS = [
  ["speed", "Speed"],
  ["acceleration", "Acceleration"],
  ["grip", "Grip"],
] as const;

function Actions({ card, controller }: { card: CarCard; controller: AppController }) {
  switch (card.state) {
    case "selected":
      return (
        <button type="button" class="cd-button" disabled>
          Selected
        </button>
      );
    case "owned":
      return (
        <button
          type="button"
          class="cd-button cd-button-primary"
          onClick={() => controller.select(card.id)}
        >
          Select
        </button>
      );
    case "affordable":
      return (
        <button
          type="button"
          class="cd-button cd-button-primary"
          onClick={() => controller.buy(card.id)}
        >
          Buy for {formatCoins(card.price)}
        </button>
      );
    case "locked":
      return (
        <button type="button" class="cd-button" disabled>
          Need {formatCoins(card.missing)} more coins
        </button>
      );
  }
}

function UpgradePanel({
  card,
  view,
  content,
  controller,
}: {
  card: CarCard;
  view: AppView;
  content: UiContent;
  controller: AppController;
}) {
  const entry = content.roster.cars.find((c) => c.id === card.id);
  const rows = entry ? upgradeRows(entry, view.save) : [];
  if (rows.length === 0) return null;
  return (
    <section class="cd-upgrades" aria-label="Upgrades" data-testid="upgrades">
      {rows.map((row) => (
        <div class="cd-upgrade-row" key={row.track} data-testid={`upgrade-${row.track}`}>
          <Meter
            label={row.label}
            text={row.useful ? `Level ${row.level}/${row.maxLevel}` : "At the limit"}
            fraction={row.level / row.maxLevel}
          />
          <button
            type="button"
            class="cd-button"
            disabled={!row.canBuy}
            aria-label={`${row.label} upgrade`}
            onClick={() => controller.buyUpgrade(card.id, row.track)}
          >
            {row.cost === undefined
              ? row.useful
                ? "Max"
                : "Stock max"
              : `Upgrade ${formatCoins(row.cost)}`}
          </button>
        </div>
      ))}
    </section>
  );
}

export function Garage({
  view,
  controller,
  content,
}: {
  view: AppView;
  controller: AppController;
  content: UiContent;
}) {
  const cards = garageCards(content.roster, view.save);
  const index = Math.max(
    0,
    cards.findIndex((c) => c.id === view.garageCar),
  );
  const card = cards[index] as CarCard;
  const go = (step: number): void => {
    const next = cards[(index + step + cards.length) % cards.length];
    if (next) void controller.focusCar(next.id);
  };
  return (
    <ScreenFrame
      title="Garage"
      onBack={() => controller.back()}
      wallet={{ coins: view.save.coins, stars: totalStars(view.save) }}
      class="cd-garage"
    >
      <div class="cd-garage-layout">
        <div class="cd-garage-stage" aria-hidden="true" />
        <div class="cd-panel cd-garage-panel" data-state={card.state}>
          <div class="cd-carousel">
            <button
              type="button"
              class="cd-button cd-icon-button"
              aria-label="Previous car"
              onClick={() => go(-1)}
            >
              &lt;
            </button>
            <div class="cd-carousel-name">
              <h3 data-testid="car-name">{card.name}</h3>
              <span class="cd-dim">
                {index + 1} of {cards.length}
              </span>
            </div>
            <button
              type="button"
              class="cd-button cd-icon-button"
              aria-label="Next car"
              onClick={() => go(1)}
            >
              &gt;
            </button>
          </div>
          <div class="cd-stats">
            {STAT_LABELS.map(([key, label]) => (
              <Meter
                key={key}
                label={label}
                text={`${Math.round(card.stats[key] * 100)}`}
                fraction={card.stats[key]}
              />
            ))}
          </div>
          <p class="cd-price" data-testid="car-price">
            {card.price === 0 ? (
              "Starter car"
            ) : (
              <>
                <CoinIcon />
                <span>{formatCoins(card.price)}</span>
              </>
            )}
          </p>
          <Actions card={card} controller={controller} />
          <UpgradePanel card={card} view={view} content={content} controller={controller} />
        </div>
      </div>
    </ScreenFrame>
  );
}
