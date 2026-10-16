import { totalStars } from "@city-drive/core";
import { LockIcon, TypeIcon } from "../components/Icons";
import { ScreenFrame } from "../components/ScreenFrame";
import { Stars } from "../components/Stars";
import type { AppController, AppView } from "../controller";
import { type DistrictCard, districtCards } from "../model/districts";
import { formatBestTime, TYPE_LABELS } from "../model/format";
import type { UiContent } from "../types";

function DistrictColumn({
  card,
  current,
  controller,
}: {
  card: DistrictCard;
  current: boolean;
  controller: AppController;
}) {
  const percent = Math.round(card.progress * 100);
  return (
    <article
      class="cd-card cd-district"
      data-district={card.id}
      data-locked={card.locked}
      data-current={current}
      aria-label={card.name}
    >
      <header class="cd-district-head">
        <h3>{card.name}</h3>
        {card.locked ? (
          <span class="cd-lock" data-testid="lock">
            <LockIcon />
            <span>{card.starsMissing} more stars</span>
          </span>
        ) : (
          <span class="cd-dim" data-testid="district-stars">
            {card.stars}/{card.maxStars} stars
          </span>
        )}
      </header>
      <div
        class="cd-bar"
        role="progressbar"
        aria-label={`${card.name} star progress`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
      >
        <div class="cd-bar-fill" style={{ width: `${percent}%` }} />
      </div>
      {card.locked ? (
        <p class="cd-dim cd-district-note">Opens at {card.unlockStars} total stars.</p>
      ) : (
        <ul class="cd-mission-list">
          {card.missions.map((m) => (
            <li key={m.id}>
              <button
                type="button"
                class="cd-mission-row"
                data-mission={m.id}
                aria-label={`${m.title}, ${TYPE_LABELS[m.type]}`}
                onClick={() => void controller.enterDistrict(card.id, m.id)}
              >
                <TypeIcon type={m.type} />
                <span class="cd-mission-name">{m.title}</span>
                <Stars earned={m.stars} />
                <span class="cd-dim cd-mission-time">{formatBestTime(m.bestTimeS)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <button
        type="button"
        class="cd-button cd-button-primary"
        disabled={card.locked}
        onClick={() => void controller.enterDistrict(card.id)}
      >
        {card.locked ? "Locked" : "Drive"}
      </button>
    </article>
  );
}

export function MapScreen({
  view,
  controller,
  content,
}: {
  view: AppView;
  controller: AppController;
  content: UiContent;
}) {
  const cards = districtCards(content.progression, content.missions, view.save);
  return (
    <ScreenFrame
      title="Districts"
      onBack={() => controller.back()}
      wallet={{ coins: view.save.coins, stars: totalStars(view.save) }}
      class="cd-map"
    >
      <div class="cd-district-row">
        {cards.map((card) => (
          <DistrictColumn
            key={card.id}
            card={card}
            current={card.id === view.districtId}
            controller={controller}
          />
        ))}
      </div>
    </ScreenFrame>
  );
}
