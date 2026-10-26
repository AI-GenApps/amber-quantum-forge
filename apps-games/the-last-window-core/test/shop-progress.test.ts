import { describe, expect, it } from "vitest";
import {
  buyDecor,
  buyStock,
  DECOR,
  type DecorId,
  type DecorPurchase,
  defaultProfile,
  defaultStockPlan,
  ownedEffects,
  type Profile,
  shopDecor,
  stockCost,
  totalDecorPrice,
} from "../src";

function rich(day: number, coins = 5000, owned: DecorId[] = []): Profile {
  return { ...defaultProfile(), day, coins, owned };
}

function bought(purchase: DecorPurchase): Profile {
  if (!purchase.ok) throw new Error(`purchase failed: ${purchase.reason}`);
  return purchase.profile;
}

describe("buyDecor", () => {
  for (const rule of DECOR) {
    it(`${rule.id} ${rule.name} costs ${rule.price} and unlocks on day ${rule.unlockDay}`, () => {
      const tooEarly = buyDecor(rich(rule.unlockDay - 1), rule.id);
      expect(tooEarly).toEqual({ ok: false, reason: "locked" });
      const profile = bought(buyDecor(rich(rule.unlockDay), rule.id));
      expect(profile.coins).toBe(5000 - rule.price);
      expect(profile.owned).toEqual([rule.id]);
    });
  }

  it("totals 1,200 for all 8 items", () => {
    expect(totalDecorPrice()).toBe(1200);
    let profile = rich(15, 1200);
    for (const rule of DECOR) profile = bought(buyDecor(profile, rule.id));
    expect(profile.coins).toBe(0);
    expect(profile.owned).toHaveLength(8);
  });

  it("needs enough coins", () => {
    const poor = rich(9, 79);
    expect(buyDecor(poor, "decor-1")).toEqual({ ok: false, reason: "unaffordable" });
    expect(bought(buyDecor({ ...poor, coins: 80 }, "decor-1")).coins).toBe(0);
  });

  it("can be bought once only", () => {
    const profile = bought(buyDecor(rich(9), "decor-3"));
    expect(buyDecor(profile, "decor-3")).toEqual({ ok: false, reason: "owned" });
  });

  it("rejects an unknown id", () => {
    expect(buyDecor(rich(9), "decor-99" as DecorId)).toEqual({ ok: false, reason: "unknown" });
  });

  it("opens every item once Late Shifts are open", () => {
    expect(shopDecor(rich(15))).toHaveLength(8);
    expect(shopDecor(rich(1))).toHaveLength(0);
    expect(shopDecor(rich(4)).map((r) => r.id)).toEqual([
      "decor-1",
      "decor-2",
      "decor-3",
      "decor-4",
    ]);
  });

  it("keeps owned ids in table order and never lowers coins below zero", () => {
    let profile = bought(buyDecor(rich(9), "decor-5"));
    profile = bought(buyDecor(profile, "decor-1"));
    expect(profile.owned).toEqual(["decor-1", "decor-5"]);
    expect(profile.coins).toBeGreaterThanOrEqual(0);
  });

  it("feeds the owned effects into the shift definition", () => {
    const profile = { ...rich(9), owned: ["decor-1", "decor-4", "decor-8"] as DecorId[] };
    const effects = ownedEffects(profile);
    expect(effects.patienceSeconds).toBe(4);
    expect(effects.shelfSlots).toEqual({ pastries: 4, books: 3 });
    expect(effects.tipBonusPoints).toBe(10);
  });
});

describe("buyStock", () => {
  const day5 = (coins: number): Profile => ({ ...defaultProfile(), day: 5, coins });

  it("deducts the plan cost and remembers the plan", () => {
    const plan = {
      pastries: ["pastry-1", "pastry-2", "pastry-3"] as const,
      books: ["book-1"] as const,
    };
    const result = buyStock(day5(100), { pastries: [...plan.pastries], books: [...plan.books] });
    if (!result.ok) throw new Error("expected success");
    expect(result.cost).toBe(5 + 5 + 10);
    expect(result.profile.coins).toBe(80);
    expect(result.profile.stock.pastries).toEqual(["pastry-1", "pastry-2", "pastry-3"]);
  });

  it("rejects a plan the player cannot afford without charging anything", () => {
    const result = buyStock(day5(9), { pastries: ["pastry-3"], books: ["book-1"] });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors).toContainEqual({ code: "CANNOT_AFFORD", id: null });
  });

  it("rejects locked items, too many kinds and a missing book", () => {
    const early = { ...defaultProfile(), day: 1, coins: 100 };
    const locked = buyStock(early, { pastries: ["pastry-5"], books: ["book-1"] });
    expect(locked.ok).toBe(false);
    if (!locked.ok) expect(locked.errors).toContainEqual({ code: "LOCKED_ITEM", id: "pastry-5" });
    const doubled = buyStock(day5(100), {
      pastries: ["pastry-1", "pastry-3", "pastry-3"],
      books: ["book-1"],
    });
    expect(doubled.ok && doubled.cost).toBe(15);
    const tooMany = buyStock(
      { ...day5(100), day: 12 },
      {
        pastries: ["pastry-1", "pastry-2", "pastry-3", "pastry-4"],
        books: ["book-1", "book-2", "book-3"],
      },
    );
    expect(tooMany.ok).toBe(false);
    if (!tooMany.ok) expect(tooMany.errors).toContainEqual({ code: "TOO_MANY_PASTRIES", id: null });
  });

  it("fills the book shelf when fewer books are unlocked than slots", () => {
    const result = buyStock(day5(100), { pastries: [], books: [] });
    if (!result.ok) throw new Error("expected success");
    expect(result.plan.books).toEqual(["book-1", "book-2", "book-3"]);
    expect(result.cost).toBe(0);
  });

  it("allows an empty pastry shelf and a fourth kind with the cake stand", () => {
    const profile = { ...day5(100), day: 12, owned: ["decor-4"] as DecorId[] };
    const four = buyStock(profile, {
      pastries: ["pastry-1", "pastry-2", "pastry-3", "pastry-4"],
      books: ["book-1", "book-2", "book-3"],
    });
    expect(four.ok).toBe(true);
    const none = buyStock(profile, { pastries: [], books: ["book-1"] });
    expect(none.ok).toBe(true);
  });

  it("uses the unlocks of an earlier day for a replay", () => {
    const profile = { ...defaultProfile(), day: 12, coins: 100 };
    const replay = buyStock(profile, { pastries: ["pastry-5"], books: ["book-1"] }, 2);
    expect(replay.ok).toBe(false);
  });
});

describe("defaultStockPlan", () => {
  it("suggests the due regulars favourites on a fresh profile", () => {
    const plan = defaultStockPlan({ ...defaultProfile(), day: 1 });
    expect(plan).toEqual({ pastries: ["pastry-1"], books: ["book-1"] });
  });

  it("reuses the previous plan filtered by unlocks", () => {
    const profile: Profile = {
      ...defaultProfile(),
      day: 3,
      coins: 100,
      stock: { pastries: ["pastry-2", "pastry-5"], books: ["book-2", "book-4"] },
    };
    const plan = defaultStockPlan(profile);
    expect(plan.pastries).toEqual(["pastry-2"]);
    expect(plan.books).toEqual(["book-1", "book-2"]);
  });

  it("drops pastries until the plan is affordable", () => {
    const profile: Profile = {
      ...defaultProfile(),
      day: 6,
      coins: 12,
      stock: { pastries: ["pastry-3", "pastry-2", "pastry-1"], books: ["book-1"] },
    };
    const plan = defaultStockPlan(profile);
    expect(stockCost(plan)).toBeLessThanOrEqual(12);
  });

  it("falls back to the suggestion when the old plan is fully locked out", () => {
    const profile: Profile = {
      ...defaultProfile(),
      day: 2,
      stock: { pastries: ["pastry-5"], books: ["book-5"] },
    };
    const plan = defaultStockPlan(profile);
    expect(plan).toEqual({ pastries: ["pastry-2"], books: ["book-1", "book-2"] });
  });
});
