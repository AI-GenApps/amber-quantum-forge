import { totalStars } from "@city-drive/core";
import { GAME_TITLE } from "../brand";
import { Wallet } from "../components/ScreenFrame";
import type { AppController, AppView } from "../controller";
import type { UiContent } from "../types";

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
        <h1 data-testid="game-title">{GAME_TITLE}</h1>
        <Wallet coins={view.save.coins} stars={totalStars(view.save)} />
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
