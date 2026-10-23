import { describe, expect, it } from "vitest";
import {
  bookCarriesMood,
  type Customer,
  createPrng,
  generateOrder,
  type Order,
  type Weather,
} from "../src";
import { regularCustomerOf, UNLOCK_ALL, UNLOCK_DAY1, walkinCustomer } from "./helpers/fixtures";

const DRAWS = 2000;

function draws(customer: Customer, weather: Weather, unlocked = UNLOCK_ALL, shelfEmpty = false) {
  const out: Order[] = [];
  for (let i = 0; i < DRAWS; i++) {
    out.push(generateOrder(createPrng(i + 1).fork("t"), customer, unlocked, weather, shelfEmpty));
  }
  return out;
}

const share = (orders: readonly Order[], test: (order: Order) => boolean): number =>
  orders.filter(test).length / orders.length;

describe("favourites", () => {
  const odile = regularCustomerOf(1);
  it("orders the favourite drink about 75 percent of the time (70 percent plus a random hit)", () => {
    const orders = draws(odile, "morning");
    expect(share(orders, (o) => o.drink === "drink-1")).toBeGreaterThan(0.71);
    expect(share(orders, (o) => o.drink === "drink-1")).toBeLessThan(0.79);
  });

  it("orders the favourite pastry about 76 percent of the time when a pastry is ordered", () => {
    const withPastry = draws(odile, "morning").filter((o) => o.pastry !== null);
    expect(share(withPastry, (o) => o.pastry === "pastry-1")).toBeGreaterThan(0.72);
    expect(share(withPastry, (o) => o.pastry === "pastry-1")).toBeLessThan(0.8);
  });

  it("never orders a locked favourite", () => {
    const tobias = regularCustomerOf(2);
    for (const order of draws(tobias, "evening", UNLOCK_DAY1)) {
      expect(order.drink).not.toBe("drink-2");
      expect(order.pastry === null || order.pastry === "pastry-1").toBe(true);
    }
  });

  it("walk-ins pick uniformly among unlocked drinks", () => {
    const orders = draws(walkinCustomer(1), "morning");
    for (const id of UNLOCK_ALL.drinks) {
      const rate = share(orders, (o) => o.drink === id);
      expect(rate).toBeGreaterThan(0.13);
      expect(rate).toBeLessThan(0.2);
    }
  });
});

describe("weather chances", () => {
  const cases: Array<[Weather, number, number]> = [
    ["morning", 0.7, 0.2],
    ["evening", 0.45, 0.45],
    ["rain", 0.55, 0.3],
  ];
  for (const [weather, pastry, book] of cases) {
    it(`${weather}: pastry near ${pastry} and book near ${book}`, () => {
      const orders = draws(walkinCustomer(2), weather);
      expect(Math.abs(share(orders, (o) => o.pastry !== null) - pastry)).toBeLessThan(0.04);
      expect(Math.abs(share(orders, (o) => o.mood !== null) - book)).toBeLessThan(0.04);
    });
  }

  it("every order has a drink", () => {
    for (const order of draws(walkinCustomer(3), "rain")) expect(order.drink).toBeTruthy();
  });
});

describe("moods", () => {
  it("regulars ask for one of their two moods about half and half", () => {
    const orders = draws(regularCustomerOf(1), "evening").filter((o) => o.mood !== null);
    expect(orders.length).toBeGreaterThan(700);
    const wistful = share(orders, (o) => o.mood === "wistful");
    const comforting = share(orders, (o) => o.mood === "comforting");
    expect(wistful + comforting).toBe(1);
    expect(Math.abs(wistful - 0.5)).toBeLessThan(0.06);
  });

  it("regulars only ask for moods some unlocked book covers", () => {
    for (const order of draws(regularCustomerOf(1), "evening", UNLOCK_DAY1)) {
      if (order.mood !== null) expect(order.mood).toBe("comforting");
    }
  });

  it("a regular with no covered favourite mood gets a covered random mood", () => {
    const juno = regularCustomerOf(4);
    const moods = new Set(
      draws(juno, "evening", UNLOCK_DAY1)
        .map((o) => o.mood)
        .filter((mood) => mood !== null),
    );
    expect([...moods].sort()).toEqual(["comforting", "curious"]);
  });

  it("walk-ins ask for any covered mood and a book on the unlocked list exists for it", () => {
    for (const order of draws(walkinCustomer(4), "evening", UNLOCK_DAY1)) {
      if (order.mood !== null) {
        expect(UNLOCK_DAY1.books.some((id) => bookCarriesMood(id, order.mood as never))).toBe(true);
      }
    }
    const all = new Set(draws(walkinCustomer(5), "evening").map((o) => o.mood));
    expect(all.size).toBe(6);
  });
});

describe("unlocks and the empty shelf", () => {
  it("never uses a locked id", () => {
    for (const customer of [walkinCustomer(1), regularCustomerOf(3), regularCustomerOf(7)]) {
      for (const order of draws(customer, "morning", UNLOCK_DAY1)) {
        expect(UNLOCK_DAY1.drinks).toContain(order.drink);
        if (order.pastry !== null) expect(UNLOCK_DAY1.pastries).toContain(order.pastry);
      }
    }
  });

  it("carries no pastry when the pastry shelf is empty", () => {
    for (const customer of [walkinCustomer(1), regularCustomerOf(1)]) {
      for (const order of draws(customer, "morning", UNLOCK_ALL, true)) {
        expect(order.pastry).toBeNull();
      }
    }
  });

  it("carries no pastry or book when nothing is unlocked", () => {
    const bare = { drinks: ["drink-1"], pastries: [], books: [] } as const;
    for (const order of draws(walkinCustomer(1), "morning", bare)) {
      expect(order).toEqual({ drink: "drink-1", pastry: null, mood: null });
    }
  });

  it("is deterministic for a seed", () => {
    const a = generateOrder(createPrng(5), regularCustomerOf(1), UNLOCK_ALL, "rain", false);
    const b = generateOrder(createPrng(5), regularCustomerOf(1), UNLOCK_ALL, "rain", false);
    expect(a).toEqual(b);
  });
});
