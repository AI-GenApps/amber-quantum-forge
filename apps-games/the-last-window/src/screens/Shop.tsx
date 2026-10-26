import { Screen, Toast, useToast } from "@web-games/kit";
import {
  DECOR,
  DECOR_TEXT,
  type DecorRule,
  WEATHER_NAMES,
  type Weather,
} from "@web-games/the-last-window-core";
import { useState } from "preact/hooks";
import { Backdrop } from "../art/Backdrop";
import { ItemIcon } from "../art/ItemIcon";
import { interiorSlot } from "../art/slots";
import { useFeedback, useRain } from "../feedback/hooks";
import { coinsText } from "../labels";
import { FirstTimeCard, useFirstTime } from "../onboarding/cards";
import { Purchase } from "../sheets/Purchase";
import { useProfile } from "../state/app";
import { useGameStore } from "../state/useGame";
import { t } from "../strings";
import { Glyph } from "../ui/Glyph";
import { Header } from "../ui/Header";

const WEATHERS: readonly Weather[] = ["morning", "evening", "rain"];

export function Shop() {
  const store = useGameStore();
  const profile = useProfile();
  const toast = useToast();
  const [weather, setWeather] = useState<Weather>("evening");
  const [pending, setPending] = useState<DecorRule | null>(null);
  const feedback = useFeedback();
  const decorCard = useFirstTime("decor");
  useRain(weather === "rain");

  const open = (rule: DecorRule): void => {
    if (profile.owned.includes(rule.id) || profile.day < rule.unlockDay) return;
    setPending(rule);
  };
  const buy = async (): Promise<void> => {
    const rule = pending;
    setPending(null);
    if (rule === null) return;
    const result = await store.buyDecor(rule.id);
    if (result.ok) {
      feedback.fire({ type: "decor-buy" });
      decorCard.show();
    }
    toast.show(
      result.ok ? t("purchaseDone", { name: rule.name }) : t("purchaseFail"),
      result.ok ? "success" : "danger",
    );
  };

  return (
    <Screen name="shop" class="tlw-page">
      <Header
        title={t("shopTitle")}
        end={<span class="tlw-coins">{coinsText(profile.coins)}</span>}
      />
      <div class="tlw-preview" aria-label={t("shopPreview")} role="img">
        <Backdrop slot={interiorSlot(weather)} owned={profile.owned} />
      </div>
      <fieldset class="tlw-segment">
        <legend class="tlw-sr">{t("shopPreview")}</legend>
        {WEATHERS.map((name) => (
          <button
            key={name}
            type="button"
            class="tlw-seg"
            aria-pressed={weather === name}
            onClick={() => setWeather(name)}
          >
            {WEATHER_NAMES[name]}
          </button>
        ))}
      </fieldset>
      <ul class="tlw-list tlw-shop" data-testid="shop-list">
        {DECOR.map((rule) => {
          const owned = profile.owned.includes(rule.id);
          const locked = !owned && profile.day < rule.unlockDay;
          const label = owned
            ? t("shopOwnedItem", { name: rule.name })
            : locked
              ? t("shopLockedItem", { name: rule.name, day: rule.unlockDay })
              : t("shopOpenItem", { name: rule.name, price: rule.price });
          return (
            <li key={rule.id}>
              <button
                type="button"
                class="tlw-shop__item"
                aria-label={label}
                aria-disabled={owned || locked}
                data-decor={rule.id}
                data-state={owned ? "owned" : locked ? "locked" : "open"}
                onClick={() => open(rule)}
              >
                <ItemIcon slot={rule.id} />
                <span class="tlw-shop__text">
                  <strong>{rule.name}</strong>
                  <span class="tlw-muted">{DECOR_TEXT[rule.id]}</span>
                  <span class="tlw-shop__state">
                    {owned ? (
                      <>
                        <Glyph name="check" size={16} /> {t("shopOwned")}
                      </>
                    ) : locked ? (
                      <>
                        <Glyph name="lock" size={16} /> {t("shopLocked", { day: rule.unlockDay })}
                      </>
                    ) : (
                      <>
                        <Glyph name="coin" size={16} /> {t("shopBuy", { price: rule.price })}
                      </>
                    )}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <FirstTimeCard id="decor" card={decorCard} />
      <Purchase
        rule={pending}
        coins={profile.coins}
        onBuy={() => void buy()}
        onCancel={() => setPending(null)}
      />
      {toast.toast ? (
        <Toast message={toast.toast.message} tone={toast.toast.tone} onDismiss={toast.dismiss} />
      ) : null}
    </Screen>
  );
}
