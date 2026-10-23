import { formatNumber, formatNumberWords, RULES } from "@web-games/cloud-observatory-core";
import { useState } from "preact/hooks";
import { useApp } from "../app/context";
import { usePulse, useRepeat } from "../app/hooks";
import { Icon } from "../components/Icon";
import { t } from "../strings";
import { ArtImage } from "../ui/ArtImage";
import { instrumentSlot } from "../ui/art-slots";
import { cx } from "../ui/cx";
import { NumberText } from "../ui/NumberText";
import {
  type BuyMode,
  buyQuote,
  type InstrumentView,
  instrumentViews,
  type UpgradeView,
  upgradeViews,
} from "./derive";

const MODES: readonly BuyMode[] = [1, 10, "max"];

function modeLabel(mode: BuyMode): string {
  return mode === "max" ? t("build.max") : t("build.times", { count: mode });
}

function UpgradeChip({ view }: { view: UpgradeView }) {
  const { session, feedback } = useApp();
  const [pulseRef, pulse] = usePulse<HTMLButtonElement>();
  const actionable = view.state === "available";
  const text =
    view.state === "bought"
      ? t("build.upgradeOwned")
      : view.state === "locked"
        ? t("build.upgradeLocked", { count: view.threshold })
        : formatNumber(view.cost);
  const mult = RULES.UPGRADE_MULTIPLIERS[view.def.tier - 1] ?? 1;
  return (
    <button
      ref={pulseRef}
      type="button"
      class={cx("co-chip", `co-chip--${view.state}`)}
      data-upgrade={view.def.id}
      data-state={view.state}
      aria-disabled={actionable ? undefined : "true"}
      aria-label={t("build.upgradeLabel", {
        name: view.def.name,
        state:
          view.state === "bought"
            ? t("build.stateOwned")
            : view.state === "locked"
              ? t("build.upgradeLocked", { count: view.threshold })
              : t("build.upgradeCost", { cost: formatNumberWords(view.cost) }),
      })}
      onClick={() => {
        if (!actionable) return;
        if (session.buyUpgrade(view.def.id).ok) {
          feedback.sfx("upgrade");
          feedback.haptic("light");
          pulse();
        }
      }}
    >
      <span class="co-chip__name">{view.def.name}</span>
      <span class="co-chip__meta">
        {view.state === "bought" ? <Icon name="check" /> : null}
        {view.state === "locked" ? <Icon name="lock" /> : null}
        {t("build.multiplier", { mult })}
        {" \u00b7 "}
        {text}
      </span>
    </button>
  );
}

function BuyButton({ view, mode }: { view: InstrumentView; mode: BuyMode }) {
  const { session, snapshot, feedback } = useApp();
  const quote = buyQuote(snapshot.profile, view.def, mode);
  const [pulseRef, pulse] = usePulse<HTMLButtonElement>();
  const repeat = useRepeat(() => {
    if (session.buyInstrument(view.def.id, mode).ok) {
      feedback.sfx("buy");
      feedback.haptic("light");
      pulse();
    }
  });
  const enabled = view.unlocked && quote.affordable;
  return (
    <button
      ref={pulseRef}
      type="button"
      class="wg-btn wg-btn--primary co-btn co-buy"
      data-buy={view.def.id}
      disabled={!enabled}
      aria-label={t("build.buyLabel", {
        count: quote.count,
        name: view.def.name,
        cost: formatNumberWords(quote.cost),
      })}
      {...repeat}
    >
      <span class="co-buy__count">{t("build.buy", { count: quote.count })}</span>
      <span class="co-buy__cost">
        <NumberText value={quote.cost} />
      </span>
    </button>
  );
}

function InstrumentRow({ view, mode }: { view: InstrumentView; mode: BuyMode }) {
  const { snapshot } = useApp();
  const upgrades = upgradeViews(snapshot.profile, view.def);
  return (
    <li
      class={cx("co-row", !view.unlocked && "co-row--locked")}
      data-instrument={view.def.id}
      data-state={view.unlocked ? "open" : "locked"}
    >
      <ArtImage slot={instrumentSlot(view.def.id)} class="co-row__art" />
      <div class="co-row__main">
        <h3 class="co-row__name">{view.def.name}</h3>
        {view.unlocked ? (
          <p class="co-row__meta">
            {t("build.owned")} <NumberText value={view.owned} />
            {" · "}
            <NumberText value={view.perSecond} />
            {t("shell.perSecond")}
          </p>
        ) : (
          <p class="co-row__meta">
            <Icon name="lock" />
            {t("build.locked", { name: view.previous?.name ?? "" })}
          </p>
        )}
      </div>
      <BuyButton view={view} mode={mode} />
      {view.unlocked ? (
        <div class="co-chips">
          {upgrades.map((up) => (
            <UpgradeChip key={up.def.id} view={up} />
          ))}
        </div>
      ) : null}
    </li>
  );
}

export function BuildTab() {
  const { snapshot } = useApp();
  const [mode, setMode] = useState<BuyMode>(1);
  const views = instrumentViews(snapshot.profile);
  return (
    <div class="co-panel" data-tab="build">
      <fieldset class="co-modes">
        <legend class="co-sr-only">{t("build.modes")}</legend>
        {MODES.map((item) => (
          <button
            key={item}
            type="button"
            class="co-chip co-mode"
            aria-pressed={item === mode}
            data-mode={item}
            onClick={() => setMode(item)}
          >
            {modeLabel(item)}
          </button>
        ))}
      </fieldset>
      <ul class="co-list">
        {views.map((view) => (
          <InstrumentRow key={view.def.id} view={view} mode={mode} />
        ))}
      </ul>
    </div>
  );
}
