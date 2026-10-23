import { Button, Screen } from "@web-games/kit";
import {
  allRegularsDue,
  BOOKS,
  type BookId,
  bookRule,
  defaultStockPlan,
  dueForDay,
  getRegular,
  LATE_DAY,
  lateDueRegulars,
  lateShiftSeed,
  normalizePlan,
  ownedEffects,
  PASTRIES,
  type PastryId,
  PORTIONS_PER_KIND,
  pastryRule,
  type RegularDue,
  type StockPlan,
  stockCost,
  suggestStock,
  unlockedAtDay,
  validateStockPlan,
} from "@web-games/the-last-window-core";
import { useMemo, useState } from "preact/hooks";
import { Backdrop } from "../art/Backdrop";
import { ItemIcon } from "../art/ItemIcon";
import { moodLine } from "../labels";
import type { ShiftTarget } from "../nav";
import { useApp, useProfile } from "../state/app";
import { useGame, useGameStore } from "../state/useGame";
import { t } from "../strings";
import { Header } from "../ui/Header";
import { MoodChip } from "../ui/MoodChip";

export function dayOf(target: ShiftTarget): number {
  return target.kind === "day" ? target.day : LATE_DAY;
}

export function useDueToday(target: ShiftTarget): RegularDue[] {
  const store = useGameStore();
  return useMemo(() => {
    if (target.kind === "day") return dueForDay(target.day);
    const today = store.lateToday();
    return lateDueRegulars(lateShiftSeed(today.seed, today.index), allRegularsDue());
  }, [store, target]);
}

function toggle<T>(list: readonly T[], item: T): T[] {
  return list.includes(item) ? list.filter((entry) => entry !== item) : [...list, item];
}

export function Prep({ target }: { target: ShiftTarget }) {
  const { router } = useApp();
  const game = useGame();
  const store = useGameStore();
  const profile = useProfile();
  const day = dayOf(target);
  const due = useDueToday(target);
  const unlocked = unlockedAtDay(day);
  const slots = ownedEffects(profile).shelfSlots;
  const [plan, setPlan] = useState<StockPlan>(() => defaultStockPlan(profile, day, due));
  const [notice, setNotice] = useState<string | null>(null);

  const clean = normalizePlan(plan, unlocked, slots);
  const errors = validateStockPlan(clean, unlocked, slots, profile.coins);
  const cost = stockCost(clean);
  const auto = unlocked.books.length <= slots.books;

  const togglePastry = (id: PastryId): void => {
    if (!plan.pastries.includes(id) && plan.pastries.length >= slots.pastries) {
      setNotice(t("prepTooMany"));
      return;
    }
    setNotice(null);
    setPlan({ ...plan, pastries: toggle(plan.pastries, id) });
  };
  const toggleBook = (id: BookId): void => {
    if (!plan.books.includes(id) && plan.books.length >= slots.books) {
      setNotice(t("prepTooMany"));
      return;
    }
    setNotice(null);
    setPlan({ ...plan, books: toggle(plan.books, id) });
  };
  const open = async (): Promise<void> => {
    const result = await store.buyStock(clean, day);
    if (result.ok) router.replace("shift", target);
    else setNotice(t("prepOverBudget"));
  };

  const problems = errors.map((error) =>
    error.code === "CANNOT_AFFORD"
      ? t("prepOverBudget")
      : error.code === "NEED_A_BOOK"
        ? t("prepNeedBook")
        : t("prepTooMany"),
  );

  return (
    <Screen name="prep" class="tlw-page">
      <Backdrop slot="interior-evening" class="tlw-backdrop--dim" />
      <Header title={t("prepTitle")} />
      <p class="tlw-muted">{t("prepWallet", { coins: profile.coins })}</p>
      <section class="wg-card tlw-card" aria-label={t("dayRegulars")}>
        <h2 class="wg-card__title">{t("dayRegulars")}</h2>
        <ul class="tlw-list">
          {due.map((entry) => (
            <li key={entry.regularId}>
              {t("prepDue", {
                name: getRegular(entry.regularId).shortName,
                pastry: pastryRule(entry.likes.pastry).name,
                moods: moodLine(entry.likes.moods),
              })}
            </li>
          ))}
          {due.length === 0 ? <li>{t("prepNoneDue")}</li> : null}
        </ul>
      </section>
      <section class="wg-card tlw-card" aria-labelledby="prep-pastry">
        <h2 id="prep-pastry" class="wg-card__title">
          {t("prepPastries", { count: clean.pastries.length, max: slots.pastries })}
        </h2>
        <div class="tlw-grid">
          {PASTRIES.filter((rule) => unlocked.pastries.includes(rule.id)).map((rule) => {
            const on = clean.pastries.includes(rule.id);
            return (
              <button
                key={rule.id}
                type="button"
                class="tlw-pick"
                aria-pressed={on}
                aria-label={t("prepPastryChip", {
                  name: rule.name,
                  cost: rule.stockCost * PORTIONS_PER_KIND,
                  portions: PORTIONS_PER_KIND,
                })}
                onClick={() => togglePastry(rule.id)}
              >
                <ItemIcon slot={rule.id} />
                <span class="tlw-pick__name">{rule.name}</span>
                <span class="tlw-pick__sub">{rule.stockCost * PORTIONS_PER_KIND} coins</span>
                {on ? <span class="tlw-pick__flag">On shelf</span> : null}
              </button>
            );
          })}
        </div>
      </section>
      <section class="wg-card tlw-card" aria-labelledby="prep-books">
        <h2 id="prep-books" class="wg-card__title">
          {t("prepBooks", { count: clean.books.length, max: slots.books })}
        </h2>
        {auto ? <p class="tlw-muted">{t("prepBookAuto")}</p> : null}
        <div class="tlw-grid">
          {BOOKS.filter((rule) => unlocked.books.includes(rule.id)).map((rule) => {
            const on = clean.books.includes(rule.id);
            const body = (
              <>
                <ItemIcon slot={rule.id} />
                <span class="tlw-pick__name">{rule.title}</span>
                <span class="tlw-pick__moods">
                  {rule.moods.map((mood) => (
                    <MoodChip key={mood} mood={mood} />
                  ))}
                </span>
                {on ? <span class="tlw-pick__flag">On shelf</span> : null}
              </>
            );
            return auto ? (
              <div key={rule.id} class="tlw-pick tlw-pick--static">
                {body}
              </div>
            ) : (
              <button
                key={rule.id}
                type="button"
                class="tlw-pick"
                aria-pressed={on}
                aria-label={`${bookRule(rule.id).title}, ${moodLine(rule.moods)}`}
                onClick={() => toggleBook(rule.id)}
              >
                {body}
              </button>
            );
          })}
        </div>
      </section>
      <p class="tlw-cost" data-testid="stock-cost">
        {t("prepCost", { cost })}
      </p>
      {notice ? (
        <p class="tlw-warn" role="alert">
          {notice}
        </p>
      ) : null}
      {problems.map((text) => (
        <p key={text} class="tlw-warn" data-testid="stock-problem">
          {text}
        </p>
      ))}
      {clean.pastries.length === 0 && unlocked.pastries.length > 0 ? (
        <p class="tlw-muted">{t("prepNoPastry")}</p>
      ) : null}
      <div class="tlw-actions">
        <Button variant="secondary" onClick={() => setPlan(suggestStock(due, unlocked, slots))}>
          {t("prepSuggest")}
        </Button>
        <Button
          size="large"
          disabled={errors.length > 0 || !game.ready}
          onClick={() => void open()}
        >
          {t("prepOpen")}
        </Button>
      </div>
    </Screen>
  );
}
