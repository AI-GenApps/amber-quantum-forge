import type { BoonEffect } from "@web-games/cloud-observatory-core";
import { CATALOG, formatNumber } from "@web-games/cloud-observatory-core";
import { useState } from "preact/hooks";
import { useApp } from "../app/context";
import { usePulse } from "../app/hooks";
import { Btn } from "../components/Btn";
import { Icon } from "../components/Icon";
import { ManagedSheet } from "../components/ManagedSheet";
import { t } from "../strings";
import { cx } from "../ui/cx";
import { NumberText } from "../ui/NumberText";
import { type BoonView, boonViews, eclipseView } from "./derive";

function instrumentName(id: string): string {
  return CATALOG.instruments.find((item) => item.id === id)?.name ?? id;
}

export function boonText(effect: BoonEffect): string {
  switch (effect.kind) {
    case "start-starlight":
      return t("boon.startStarlight", { amount: formatNumber(effect.amount) });
    case "instrument-mult":
      return t("boon.instrumentMult", {
        name: instrumentName(effect.instrumentId),
        factor: effect.factor,
      });
    case "cost-mult":
      return t("boon.costMult", { factor: effect.factor });
    case "offline-efficiency":
      return t("boon.offline", { percent: Math.round(effect.value * 100) });
    case "start-owned":
      return t("boon.startOwned", {
        list: Object.entries(effect.owned)
          .map(([id, count]) => `${instrumentName(id)} \u00d7${count}`)
          .join(", "),
      });
    case "atlas-factor":
      return t("boon.atlas", { factor: effect.factor });
    case "upgrade-cost-mult":
      return t("boon.upgradeCost", { factor: effect.factor });
    case "global-mult":
      return t("boon.global", { factor: effect.factor });
  }
}

function BoonCard({ view }: { view: BoonView }) {
  const { session, feedback } = useApp();
  const [pulseRef, pulse] = usePulse<HTMLLIElement>();
  const buy = () => {
    if (view.state !== "affordable") return;
    if (session.buyBoon(view.def.id).ok) {
      feedback.sfx("buy");
      feedback.haptic("light");
      pulse();
    }
  };
  return (
    <li
      ref={pulseRef}
      class={cx("co-boon", `co-boon--${view.state}`)}
      data-boon={view.def.id}
      data-state={view.state}
    >
      <span class="co-boon__ring" aria-hidden="true">
        <Icon name={view.state === "owned" ? "check" : "eclipse"} />
      </span>
      <div class="co-boon__main">
        <h3 class="co-boon__name">{view.def.name}</h3>
        <p class="co-boon__effect">{boonText(view.def.effect)}</p>
        <p class="co-boon__cost">
          <Icon name="shard" />
          {view.state === "owned"
            ? t("eclipse.owned")
            : view.state === "short"
              ? t("eclipse.needMore", { cost: view.def.cost, missing: view.missing })
              : t("eclipse.cost", { cost: view.def.cost })}
        </p>
      </div>
      <button
        type="button"
        class="wg-btn wg-btn--primary co-btn co-boon__buy"
        data-buy-boon={view.def.id}
        disabled={view.state !== "affordable"}
        aria-label={t("eclipse.buyLabel", { name: view.def.name, cost: view.def.cost })}
        onClick={buy}
      >
        {view.state === "owned" ? t("eclipse.owned") : t("eclipse.buy")}
      </button>
    </li>
  );
}

export function EclipseTab() {
  const { session, snapshot, feedback, playEclipse, motion } = useApp();
  const [confirm, setConfirm] = useState(false);
  const { game } = snapshot.profile;
  const view = eclipseView(snapshot.profile);
  const boons = boonViews(snapshot.profile);

  const perform = () => {
    setConfirm(false);
    const before = session.snapshot().profile.game;
    const result = session.eclipse();
    if (!result.ok) return;
    const after = session.snapshot().profile.game;
    feedback.sfx("eclipse");
    feedback.haptic("medium");
    playEclipse(after.shards - before.shards, after.eclipses);
  };

  return (
    <div class="co-panel" data-tab="eclipse" data-reduced={motion.reduced ? "true" : "false"}>
      <section class="co-eclipse-head">
        <p class="co-label">{t("eclipse.pending")}</p>
        <p class="co-big" data-pending={view.pending}>
          <NumberText value={view.pending} unit={t("eclipse.shardUnit")} />
        </p>
        <p class="co-eclipse-head__bank" data-shards={game.shards}>
          <Icon name="shard" />
          {t("eclipse.balance", { count: game.shards })}
        </p>
        <Btn
          fullWidth
          size="large"
          disabled={!view.available}
          class="co-eclipse-btn"
          onClick={() => setConfirm(true)}
        >
          {view.available
            ? t("eclipse.button", { count: view.pending })
            : t("eclipse.buttonLocked", { needed: view.needed })}
        </Btn>
      </section>
      <h2 class="co-section">{t("eclipse.boons")}</h2>
      <ul class="co-list">
        {boons.map((boon) => (
          <BoonCard key={boon.def.id} view={boon} />
        ))}
      </ul>
      <ManagedSheet
        open={confirm}
        variant="modal"
        title={t("eclipse.confirmTitle")}
        onClose={() => setConfirm(false)}
      >
        <div class="co-stack" data-sheet="eclipse-confirm">
          <p>{t("eclipse.confirmBank", { count: view.pending })}</p>
          <h3 class="co-section">{t("eclipse.resets")}</h3>
          <ul class="co-bullets">
            <li>{t("eclipse.reset.starlight")}</li>
            <li>{t("eclipse.reset.instruments")}</li>
            <li>{t("eclipse.reset.timer")}</li>
          </ul>
          <h3 class="co-section">{t("eclipse.stays")}</h3>
          <ul class="co-bullets">
            <li>{t("eclipse.stay.atlas")}</li>
            <li>{t("eclipse.stay.lore")}</li>
            <li>{t("eclipse.stay.boons")}</li>
            <li>{t("eclipse.stay.stats")}</li>
          </ul>
          <Btn fullWidth class="co-eclipse-confirm" onClick={perform}>
            {t("eclipse.confirm")}
          </Btn>
          <Btn variant="secondary" fullWidth onClick={() => setConfirm(false)}>
            {t("common.cancel")}
          </Btn>
        </div>
      </ManagedSheet>
    </div>
  );
}
