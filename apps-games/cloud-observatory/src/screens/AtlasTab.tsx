import { formatNumber } from "@web-games/cloud-observatory-core";
import { useApp } from "../app/context";
import { Icon } from "../components/Icon";
import { ConstellationFigure } from "../sky/ConstellationFigure";
import { t } from "../strings";
import { ArtImage } from "../ui/ArtImage";
import { emblemSlot } from "../ui/art-slots";
import { cx } from "../ui/cx";
import { NumberText } from "../ui/NumberText";
import { type AtlasCard, atlasBonusPercent, atlasCards } from "./derive";

function stateIcon(state: AtlasCard["state"]) {
  return state === "charted" ? "check" : state === "ready" ? "star" : "lock";
}

function Card({ card }: { card: AtlasCard }) {
  const { session, router, feedback } = useApp();
  const { def, state } = card;
  const chart = () => {
    const started = session.startChart(def.id);
    if (!started.ok) return;
    feedback.sfx("click");
    router.push("chart", { id: def.id });
  };
  return (
    <li
      class={cx("co-card-atlas", `co-card-atlas--${state}`)}
      data-constellation={def.id}
      data-state={state}
    >
      <div class="co-emblem">
        <ArtImage slot={emblemSlot(def.id)} class="co-emblem__art" />
      </div>
      <div class="co-card-atlas__main">
        <h3 class="co-card-atlas__name">{def.name}</h3>
        <p class="co-state" data-atlas-state={state}>
          <Icon name={stateIcon(state)} />
          {t(`atlas.state.${state}` as const)}
        </p>
        <p class="co-card-atlas__meta">
          {t("atlas.stars", { count: def.stars.length })}
          {" · "}
          <NumberText value={card.cost} unit={t("shell.starlightUnit")} /> {t("atlas.starlight")}
        </p>
        <p class="co-card-atlas__need">
          {card.prerequisiteMet
            ? t("atlas.needMet", { count: def.requires.count, name: card.instrumentName })
            : t("atlas.need", {
                count: def.requires.count,
                name: card.instrumentName,
                have: formatNumber(card.haveCount),
              })}
        </p>
      </div>
      <ConstellationFigure def={def} dim={state !== "charted"} class="co-card-atlas__fig" />
      {state === "ready" ? (
        <button
          type="button"
          class="wg-btn wg-btn--primary co-btn co-card-atlas__action"
          aria-label={t("atlas.chartLabel", { name: def.name })}
          onClick={chart}
        >
          {t("atlas.chart")}
        </button>
      ) : null}
    </li>
  );
}

export function AtlasTab() {
  const { snapshot } = useApp();
  const cards = atlasCards(snapshot.profile);
  const charted = snapshot.profile.game.charted.length;
  const bonus = atlasBonusPercent(snapshot.profile);
  return (
    <div class="co-panel" data-tab="atlas">
      <div class="co-atlas-head">
        <p class="co-atlas-head__count" data-charted={charted}>
          {t("atlas.charted", { charted, total: cards.length })}
        </p>
        <p class="co-atlas-head__bonus" data-bonus={bonus}>
          {t("atlas.bonus", { percent: bonus })}
        </p>
      </div>
      <ul class="co-list">
        {cards.map((card) => (
          <Card key={card.def.id} card={card} />
        ))}
      </ul>
    </div>
  );
}
