import { describe, expect, it } from "vitest";
import { DRINKS, type DrinkToken, type Order, PASTRIES, stepDuration } from "../src";
import { act, makeDrink, makePastry, ofType, seated, tick } from "./helpers/play";

const order = (partial: Partial<Order> = {}): Order => ({
  drink: "drink-1",
  pastry: null,
  mood: null,
  ...partial,
});

describe("drink station", () => {
  for (const rule of DRINKS) {
    it(`${rule.name}: steps, duration locks and the ready tick`, () => {
      const s = seated([order({ drink: rule.id })]);
      act(s, { type: "selectSeat", seat: 0 });
      let ready = false;
      rule.steps.forEach((token, index) => {
        const events = act(s, { type: "drinkStep", token });
        expect(ofType(events, "step-ok")).toHaveLength(1);
        const last = index === rule.steps.length - 1;
        const duration = stepDuration(token);
        if (duration === 0) {
          expect(ofType(events, "item-ready").length).toBe(last ? 1 : 0);
          ready = last;
          return;
        }
        const locked = act(s, { type: "drinkStep", token: rule.steps[index + 1] ?? "cup" });
        expect(ofType(locked, "action-rejected")[0]?.reason).toBe("locked");
        const early = tick(s, duration - 1);
        expect(ofType(early, "step-ready")).toHaveLength(0);
        const done = tick(s, 1);
        expect(ofType(done, "step-ready")).toHaveLength(1);
        if (last) {
          expect(ofType(done, "item-ready")).toHaveLength(1);
          ready = true;
        }
      });
      expect(ready).toBe(true);
      expect(s.state.seats[0]?.tray.drink).toBe(rule.id);
      expect(s.state.cup).toBeNull();
      expect(s.state.stats.mistakes).toBe(0);
    });
  }

  it("a wrong step empties the cup and counts a mistake", () => {
    const s = seated([order({ drink: "drink-2" })]);
    act(s, { type: "selectSeat", seat: 0 });
    act(s, { type: "drinkStep", token: "cup" });
    act(s, { type: "drinkStep", token: "brew" });
    tick(s, 8);
    const events = act(s, { type: "drinkStep", token: "pour" });
    const wrong = ofType(events, "step-wrong")[0];
    expect(wrong?.expected).toBe("steam");
    expect(wrong?.token).toBe("pour");
    expect(s.state.cup).toBeNull();
    expect(s.state.stats.mistakes).toBe(1);
    makeDrink(s, 0);
    expect(s.state.seats[0]?.tray.drink).toBe("drink-2");
    expect(s.state.stats.mistakes).toBe(1);
  });

  it("tapping cup again mid-recipe is a wrong step", () => {
    const s = seated([order()]);
    act(s, { type: "selectSeat", seat: 0 });
    act(s, { type: "drinkStep", token: "cup" });
    const events = act(s, { type: "drinkStep", token: "cup" });
    expect(ofType(events, "step-wrong")).toHaveLength(1);
    expect(s.state.cup).toBeNull();
  });

  it("a locked cup rejects even a wrong token without a mistake", () => {
    const s = seated([order()]);
    act(s, { type: "selectSeat", seat: 0 });
    act(s, { type: "drinkStep", token: "cup" });
    act(s, { type: "drinkStep", token: "brew" });
    const events = act(s, { type: "drinkStep", token: "honey" });
    expect(ofType(events, "action-rejected")[0]?.reason).toBe("locked");
    expect(s.state.stats.mistakes).toBe(0);
    expect(s.state.cup).not.toBeNull();
  });

  it("rejects steps without a cup, without an active seat, and with a full tray", () => {
    const s = seated([order()]);
    expect(ofType(act(s, { type: "drinkStep", token: "brew" }), "action-rejected")[0]?.reason).toBe(
      "no-cup",
    );
    expect(ofType(act(s, { type: "drinkStep", token: "cup" }), "action-rejected")[0]?.reason).toBe(
      "no-active-seat",
    );
    makeDrink(s, 0);
    expect(s.state.seats[0]?.tray.drink).toBe("drink-1");
    expect(ofType(act(s, { type: "drinkStep", token: "cup" }), "action-rejected")[0]?.reason).toBe(
      "tray-full",
    );
  });

  it("there is one cup at a time: a second seat cannot start while the first is brewing", () => {
    const s = seated([order(), order()]);
    act(s, { type: "selectSeat", seat: 0 });
    act(s, { type: "drinkStep", token: "cup" });
    act(s, { type: "selectSeat", seat: 1 });
    const events = act(s, { type: "drinkStep", token: "cup" });
    expect(ofType(events, "step-wrong")).toHaveLength(1);
    expect(s.state.cup).toBeNull();
  });

  it("discarding the cup frees the station with no mistake", () => {
    const s = seated([order()]);
    act(s, { type: "selectSeat", seat: 0 });
    act(s, { type: "drinkStep", token: "cup" });
    const events = act(s, { type: "discard", item: { kind: "cup" } });
    expect(ofType(events, "item-discarded")[0]?.component).toBe("cup");
    expect(s.state.cup).toBeNull();
    expect(s.state.stats.mistakes).toBe(0);
    expect(
      ofType(act(s, { type: "discard", item: { kind: "cup" } }), "action-rejected"),
    ).toHaveLength(1);
  });
});

describe("pastry station", () => {
  for (const rule of PASTRIES) {
    it(`${rule.name}: pick, steps, oven and tray`, () => {
      const s = seated([order({ pastry: rule.id })], {
        stock: { pastries: [rule.id], books: ["book-1"] },
      });
      act(s, { type: "selectSeat", seat: 0 });
      const pick = act(s, { type: "pastryPick", pastryId: rule.id });
      expect(ofType(pick, "step-ok")[0]?.token).toBe("plate");
      expect(s.state.stock[0]?.portions).toBe(4);
      rule.steps.slice(1).forEach((token, index, rest) => {
        const events = act(s, { type: "pastryStep", plate: 0, token: token as never });
        expect(ofType(events, "step-ok")).toHaveLength(1);
        const duration = stepDuration(token);
        if (duration > 0) {
          const again = act(s, { type: "pastryStep", plate: 0, token: rest[index + 1] ?? "dust" });
          expect(ofType(again, "action-rejected")[0]?.reason).toBe("locked");
          expect(ofType(tick(s, duration - 1), "oven-ready")).toHaveLength(0);
          expect(ofType(tick(s, 1), "oven-ready")).toHaveLength(1);
        }
      });
      expect(s.state.seats[0]?.tray.pastry).toBe(rule.id);
      expect(s.state.plates[0]).toBeNull();
      expect(ofType(s.events, "item-ready").filter((e) => e.component === "pastry")).toHaveLength(
        1,
      );
    });
  }

  it("the oven runs in the background while a drink is made", () => {
    const s = seated([order({ pastry: "pastry-1" })]);
    act(s, { type: "selectSeat", seat: 0 });
    act(s, { type: "pastryPick", pastryId: "pastry-1" });
    const start = s.state.tick;
    act(s, { type: "pastryStep", plate: 0, token: "warm" });
    expect(s.state.plates[0]?.oven).toBe(12);
    act(s, { type: "drinkStep", token: "cup" });
    act(s, { type: "drinkStep", token: "brew" });
    tick(s, 8);
    act(s, { type: "drinkStep", token: "pour" });
    expect(s.state.seats[0]?.tray.drink).toBe("drink-1");
    expect(s.state.plates[0]?.oven).toBe(4);
    const events = tick(s, 4);
    expect(s.state.tick).toBe(start + 12);
    expect(ofType(events, "oven-ready")[0]?.tick).toBe(start + 12);
    expect(s.state.seats[0]?.tray.pastry).toBe("pastry-1");
  });

  it("flashes oven-ready and waits for the next step when more steps follow", () => {
    const s = seated([order({ pastry: "pastry-2" })]);
    act(s, { type: "selectSeat", seat: 0 });
    act(s, { type: "pastryPick", pastryId: "pastry-2" });
    act(s, { type: "pastryStep", plate: 0, token: "warm" });
    const events = tick(s, 12);
    expect(ofType(events, "oven-ready")).toHaveLength(1);
    expect(ofType(events, "item-ready")).toHaveLength(0);
    expect(s.state.plates[0]?.step).toBe(2);
    act(s, { type: "pastryStep", plate: 0, token: "dust" });
    expect(s.state.seats[0]?.tray.pastry).toBe("pastry-2");
  });

  it("a wrong pastry step is a mistake and keeps the plate", () => {
    const s = seated([order({ pastry: "pastry-3" })]);
    act(s, { type: "selectSeat", seat: 0 });
    act(s, { type: "pastryPick", pastryId: "pastry-3" });
    const events = act(s, { type: "pastryStep", plate: 0, token: "glaze" });
    expect(ofType(events, "step-wrong")[0]?.expected).toBe("warm");
    expect(s.state.stats.mistakes).toBe(1);
    expect(s.state.plates[0]?.step).toBe(1);
  });

  it("uses two plates, then has none free", () => {
    const s = seated([order({ pastry: "pastry-1" }), order({ pastry: "pastry-2" }), order()]);
    act(s, { type: "selectSeat", seat: 0 });
    act(s, { type: "pastryPick", pastryId: "pastry-1" });
    act(s, { type: "selectSeat", seat: 1 });
    act(s, { type: "pastryPick", pastryId: "pastry-2" });
    expect(s.state.plates.map((plate) => plate?.seat)).toEqual([0, 1]);
    act(s, { type: "selectSeat", seat: 2 });
    const events = act(s, { type: "pastryPick", pastryId: "pastry-3" });
    expect(ofType(events, "action-rejected")[0]?.reason).toBe("no-free-plate");
  });

  it("one pastry per seat at a time", () => {
    const s = seated([order({ pastry: "pastry-1" })]);
    act(s, { type: "selectSeat", seat: 0 });
    act(s, { type: "pastryPick", pastryId: "pastry-1" });
    const events = act(s, { type: "pastryPick", pastryId: "pastry-2" });
    expect(ofType(events, "action-rejected")[0]?.reason).toBe("tray-full");
    expect(s.state.stock.find((e) => e.pastry === "pastry-2")?.portions).toBe(5);
  });

  it("runs out after 5 portions and rejects unshelved kinds", () => {
    const s = seated([order({ pastry: "pastry-1" })], {
      stock: { pastries: ["pastry-1"], books: ["book-1"] },
    });
    act(s, { type: "selectSeat", seat: 0 });
    for (let i = 0; i < 5; i++) {
      act(s, { type: "pastryPick", pastryId: "pastry-1" });
      act(s, { type: "discard", item: { kind: "plate", plate: 0 } });
    }
    expect(s.state.stock[0]?.portions).toBe(0);
    const out = act(s, { type: "pastryPick", pastryId: "pastry-1" });
    expect(ofType(out, "action-rejected")[0]?.reason).toBe("out-of-stock");
    const missing = act(s, { type: "pastryPick", pastryId: "pastry-4" });
    expect(ofType(missing, "action-rejected")[0]?.reason).toBe("not-on-shelf");
  });

  it("rejects bad plates and steps on empty plates", () => {
    const s = seated([order()]);
    expect(
      ofType(act(s, { type: "pastryStep", plate: 5, token: "warm" }), "action-rejected")[0]?.reason,
    ).toBe("bad-plate");
    expect(
      ofType(act(s, { type: "pastryStep", plate: 0, token: "warm" }), "action-rejected")[0]?.reason,
    ).toBe("no-plate");
  });

  it("discarding a plate loses its portion", () => {
    const s = seated([order({ pastry: "pastry-1" })]);
    act(s, { type: "selectSeat", seat: 0 });
    act(s, { type: "pastryPick", pastryId: "pastry-1" });
    const events = act(s, { type: "discard", item: { kind: "plate", plate: 0 } });
    expect(ofType(events, "item-discarded")[0]?.component).toBe("pastry");
    expect(s.state.plates[0]).toBeNull();
    expect(s.state.stock[0]?.portions).toBe(4);
  });
});

describe("book shelf and tray", () => {
  it("only stocked books can be picked, and a new pick replaces the old one", () => {
    const s = seated([order({ mood: "funny" })]);
    act(s, { type: "selectSeat", seat: 0 });
    const missing = act(s, { type: "pickBook", bookId: "book-5" });
    expect(ofType(missing, "action-rejected")[0]?.reason).toBe("not-on-shelf");
    const ok = act(s, { type: "pickBook", bookId: "book-1" });
    expect(ofType(ok, "item-ready")[0]?.component).toBe("book");
    act(s, { type: "pickBook", bookId: "book-2" });
    expect(s.state.seats[0]?.tray.book).toBe("book-2");
  });

  it("needs an active seat", () => {
    const s = seated([order()]);
    expect(
      ofType(act(s, { type: "pickBook", bookId: "book-1" }), "action-rejected")[0]?.reason,
    ).toBe("no-active-seat");
  });

  it("discards a tray item of the active seat", () => {
    const s = seated([order()]);
    makeDrink(s, 0);
    const events = act(s, { type: "discard", item: { kind: "tray", slot: "drink" } });
    expect(ofType(events, "item-discarded")[0]?.component).toBe("drink");
    expect(s.state.seats[0]?.tray.drink).toBeNull();
    const again = act(s, { type: "discard", item: { kind: "tray", slot: "drink" } });
    expect(ofType(again, "action-rejected")[0]?.reason).toBe("nothing-to-discard");
  });
});

describe("items belong to the seat selected when they were started", () => {
  it("keeps a baking pastry on its seat after switching seats", () => {
    const s = seated([order({ pastry: "pastry-1" }), order()]);
    act(s, { type: "selectSeat", seat: 0 });
    act(s, { type: "pastryPick", pastryId: "pastry-1" });
    act(s, { type: "pastryStep", plate: 0, token: "warm" });
    act(s, { type: "selectSeat", seat: 1 });
    tick(s, 12);
    expect(s.state.seats[0]?.tray.pastry).toBe("pastry-1");
    expect(s.state.seats[1]?.tray.pastry).toBeNull();
    expect(ofType(s.events, "item-ready").find((e) => e.component === "pastry")?.seat).toBe(0);
  });

  it("keeps a cup on its seat after switching seats", () => {
    const s = seated([order(), order({ drink: "drink-3" })]);
    act(s, { type: "selectSeat", seat: 0 });
    act(s, { type: "drinkStep", token: "cup" });
    act(s, { type: "selectSeat", seat: 1 });
    const steps: DrinkToken[] = ["brew", "pour"];
    for (const token of steps) {
      act(s, { type: "drinkStep", token });
      tick(s, stepDuration(token));
    }
    expect(s.state.seats[0]?.tray.drink).toBe("drink-1");
    expect(s.state.seats[1]?.tray.drink).toBeNull();
  });

  it("drops the cup and plates when their customer leaves", () => {
    const s = seated([order({ pastry: "pastry-1" })], { patienceSec: 4 });
    act(s, { type: "selectSeat", seat: 0 });
    act(s, { type: "drinkStep", token: "cup" });
    act(s, { type: "pastryPick", pastryId: "pastry-1" });
    tick(s, 40);
    expect(s.state.seats[0]?.customer).toBeNull();
    expect(s.state.cup).toBeNull();
    expect(s.state.plates).toEqual([null, null]);
  });

  it("makeDrink and makePastry helpers fill the tray", () => {
    const s = seated([order({ drink: "drink-6", pastry: "pastry-5" })], {
      stock: { pastries: ["pastry-5"], books: ["book-1"] },
    });
    makePastry(s, 0);
    makeDrink(s, 0);
    expect(s.state.seats[0]?.tray).toEqual({ drink: "drink-6", pastry: "pastry-5", book: null });
  });
});
