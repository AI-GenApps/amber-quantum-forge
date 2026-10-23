import {
  applyShiftResult,
  buildCampaignShift,
  buyDecor,
  buyStock,
  type ChoiceMade,
  completeScene,
  countItemsServed,
  DAYS,
  DECOR,
  defaultProfile,
  dueForDay,
  ownedEffects,
  type Profile,
  SCENE_BY_ID,
  type ShiftResult,
  type StockPlan,
  suggestStock,
  unlockedAtDay,
} from "../../src";
import { type BotPolicy, playShift } from "./bot";
import { foresightStock } from "./campaign";

export type StockStyle = "suggested" | "foresight";

export interface BalancePolicy {
  name: string;
  bot: BotPolicy;
  stock: StockStyle;
}

export interface DayLine {
  day: number;
  arrived: number;
  served: number;
  stars: number;
  shiftCoins: number;
  stockCost: number;
  sceneCoins: number;
  coinsAfter: number;
  decorBought: string[];
}

export interface BalanceRun {
  policy: string;
  buying: boolean;
  lines: DayLine[];
  profile: Profile;
  income: number;
  stockSpent: number;
  net: number;
  scenesDone: number;
  decorAffordable: number;
}

function pickA(sceneId: string): ChoiceMade | undefined {
  const choice = SCENE_BY_ID.get(sceneId)?.choice;
  return choice === undefined
    ? undefined
    : { choice: choice.id, option: "a", lean: choice.options.a.lean };
}

function chooseStock(policy: BalancePolicy, profile: Profile, day: number): StockPlan {
  const base = buildCampaignShift(day, { decor: ownedEffects(profile) });
  return policy.stock === "foresight"
    ? foresightFor(base, profile)
    : suggestStock(dueForDay(day), unlockedAtDay(day), ownedEffects(profile).shelfSlots);
}

function foresightFor(def: ReturnType<typeof buildCampaignShift>, profile: Profile): StockPlan {
  const slots = ownedEffects(profile).shelfSlots;
  const plan = foresightStock(def);
  return {
    pastries: plan.pastries.slice(0, slots.pastries),
    books: plan.books.slice(0, slots.books),
  };
}

function affordablePlan(profile: Profile, wanted: StockPlan, day: number): Profile {
  const pastries = wanted.pastries.slice();
  for (;;) {
    const purchase = buyStock(profile, { pastries, books: wanted.books }, day);
    if (purchase.ok) return purchase.profile;
    if (pastries.length === 0) return profile;
    pastries.pop();
  }
}

function cheapestFirstCount(budget: number): number {
  let left = budget;
  let count = 0;
  for (const rule of DECOR.slice().sort((a, b) => a.price - b.price)) {
    if (rule.price > left) break;
    left -= rule.price;
    count += 1;
  }
  return count;
}

export function playBalance(policy: BalancePolicy, buying: boolean): BalanceRun {
  let profile = defaultProfile();
  const lines: DayLine[] = [];
  let income = 0;
  let stockSpent = 0;
  for (const entry of DAYS) {
    const day = entry.day;
    const wanted = chooseStock(policy, profile, day);
    const stocked = affordablePlan(profile, wanted, day);
    const cost = profile.coins - stocked.coins;
    stockSpent += cost;
    const plan = stocked.stock;
    const def = buildCampaignShift(day, {
      decor: ownedEffects(stocked),
      shelfEmpty: plan.pastries.length === 0,
    });
    const run = playShift(def, plan, policy.bot);
    const result: ShiftResult = run.result;
    const applied = applyShiftResult(stocked, { kind: "day", day }, result, {
      itemsMade: countItemsServed(run.events),
    });
    let next = applied.profile;
    income += result.coins;
    let sceneCoins = 0;
    for (const ref of applied.queue) {
      const id = `scene-${ref.regularId}-${ref.index}`;
      const done = completeScene(next, id, pickA(id));
      next = done.profile;
      sceneCoins += done.gift;
    }
    income += sceneCoins;
    const bought: string[] = [];
    if (buying) {
      for (const rule of DECOR) {
        const reserve = 30;
        const purchase = buyDecor({ ...next, coins: next.coins - reserve }, rule.id);
        if (next.coins >= reserve && purchase.ok) {
          next = { ...purchase.profile, coins: purchase.profile.coins + reserve };
          bought.push(rule.id);
        }
      }
    }
    profile = next;
    const served = result.counts.delighted + result.counts.satisfied + result.counts.disappointed;
    lines.push({
      day,
      arrived: result.arrived,
      served,
      stars: result.grade.stars,
      shiftCoins: result.coins,
      stockCost: cost,
      sceneCoins,
      coinsAfter: profile.coins,
      decorBought: bought,
    });
  }
  const net = income + 30 - stockSpent;
  const scenesDone = Object.values(profile.regulars).reduce((sum, row) => sum + row.scenesDone, 0);
  return {
    policy: policy.name,
    buying,
    lines,
    profile,
    income,
    stockSpent,
    net,
    scenesDone,
    decorAffordable: cheapestFirstCount(net),
  };
}

export function formatRun(run: BalanceRun): string {
  const head = "day arrived served stars shift stock scenes coins decor";
  const rows = run.lines.map(
    (l) =>
      `${String(l.day).padStart(3)} ${String(l.arrived).padStart(7)} ${String(l.served).padStart(6)} ${String(l.stars).padStart(5)} ${String(l.shiftCoins).padStart(5)} ${String(l.stockCost).padStart(5)} ${String(l.sceneCoins).padStart(6)} ${String(l.coinsAfter).padStart(5)} ${l.decorBought.join(",")}`,
  );
  return [`${run.policy} (${run.buying ? "buying decor" : "no decor"})`, head, ...rows].join("\n");
}
