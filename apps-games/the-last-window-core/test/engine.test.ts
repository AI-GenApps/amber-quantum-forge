import { describe, expect, it } from "vitest";
import { closeShift, decorEffects, type Order, tickShift } from "../src";
import { arrival, handDef, NO_STOCK, regularCustomerOf, walkinCustomer } from "./helpers/fixtures";
import { act, makeDrink, ofType, open, tick, tickUntil } from "./helpers/play";

const plain: Order = { drink: "drink-1", pastry: null, mood: null };

describe("seating", () => {
  it("seats arrivals at the lowest free seat on their tick", () => {
    const def = handDef({
      arrivals: [arrival(5, walkinCustomer(1)), arrival(9, walkinCustomer(2))],
    });
    const s = open(def, NO_STOCK);
    expect(tick(s, 4)).toEqual([]);
    const first = ofType(tick(s, 1), "customer-seated");
    expect(first).toHaveLength(1);
    expect(first[0]).toMatchObject({ tick: 5, seat: 0, customerId: "walkin-1" });
    const second = ofType(tickUntil(s, 9), "customer-seated");
    expect(second[0]).toMatchObject({ tick: 9, seat: 1, customerId: "walkin-2" });
    expect(s.state.stats.arrived).toBe(2);
  });

  it("gives a freed seat to the next arrival", () => {
    const def = handDef({
      patienceSec: 4,
      arrivals: [
        arrival(1, walkinCustomer(1)),
        arrival(20, walkinCustomer(2)),
        arrival(45, walkinCustomer(3)),
      ],
    });
    const s = open(def, NO_STOCK);
    tickUntil(s, 20);
    expect(s.state.seats[1]?.customer?.id).toBe("walkin-2");
    tickUntil(s, 41);
    expect(s.state.seats[0]?.customer).toBeNull();
    const events = tickUntil(s, 45);
    expect(ofType(events, "customer-seated")[0]).toMatchObject({ seat: 0, customerId: "walkin-3" });
  });
});

describe("door wait", () => {
  const four = handDef({
    arrivals: [1, 2, 3, 4].map((t) => arrival(t, walkinCustomer(t))),
  });

  it("holds the fourth customer at the door and turns them away at exactly 50 ticks", () => {
    const s = open(four, NO_STOCK);
    tickUntil(s, 4);
    expect(s.state.door).toHaveLength(1);
    expect(ofType(tickUntil(s, 53), "customer-turned-away")).toHaveLength(0);
    expect(s.state.door).toHaveLength(1);
    const events = tick(s, 1);
    expect(ofType(events, "customer-turned-away")[0]).toMatchObject({
      tick: 54,
      customerId: "walkin-4",
    });
    expect(s.state.door).toHaveLength(0);
    expect(s.state.stats.turnedAway).toBe(1);
    expect(s.state.stats.counts.left).toBe(1);
    expect(s.state.stats.arrived).toBe(4);
  });

  it("seats a door customer when a seat frees in time, with full patience", () => {
    const def = handDef({
      patienceSec: 4,
      arrivals: [1, 2, 3, 4].map((t) => arrival(t, walkinCustomer(t))),
    });
    const s = open(def, NO_STOCK);
    tickUntil(s, 40);
    expect(s.state.door).toHaveLength(1);
    const events = tick(s, 1);
    expect(ofType(events, "customer-left")[0]).toMatchObject({ seat: 0 });
    expect(ofType(events, "customer-seated")[0]).toMatchObject({
      tick: 41,
      seat: 0,
      customerId: "walkin-4",
    });
    expect(s.state.seats[0]?.patienceLeft).toBe(40);
    tick(s, 1);
    expect(s.state.seats[0]?.patienceLeft).toBe(39);
    expect(s.state.stats.turnedAway).toBe(0);
  });

  it("records a turned-away regular as left with no friendship", () => {
    const def = handDef({
      arrivals: [
        arrival(1, walkinCustomer(1)),
        arrival(2, walkinCustomer(2)),
        arrival(3, walkinCustomer(3)),
        arrival(4, regularCustomerOf(5)),
      ],
    });
    const s = open(def, NO_STOCK);
    tickUntil(s, 54);
    expect(s.state.stats.fpGains).toEqual([{ regularId: 5, fp: 0 }]);
    expect(s.state.stats.regularOutcomes).toEqual([{ regularId: 5, outcome: "left" }]);
  });
});

describe("patience", () => {
  const one = handDef({ arrivals: [arrival(1, walkinCustomer(1))] });

  it("drains one tick per tick from the tick after seating", () => {
    const s = open(one, NO_STOCK);
    tick(s, 1);
    expect(s.state.seats[0]?.patienceLeft).toBe(600);
    tick(s, 1);
    expect(s.state.seats[0]?.patienceLeft).toBe(599);
    tickUntil(s, 101);
    expect(s.state.seats[0]?.patienceLeft).toBe(500);
  });

  it("warns once at 100 ticks left", () => {
    const s = open(one, NO_STOCK);
    expect(ofType(tickUntil(s, 500), "patience-warning")).toHaveLength(0);
    const events = tick(s, 1);
    expect(ofType(events, "patience-warning")).toEqual([
      { type: "patience-warning", tick: 501, seat: 0, customerId: "walkin-1" },
    ]);
    expect(s.state.seats[0]?.patienceLeft).toBe(100);
    expect(ofType(tick(s, 50), "patience-warning")).toHaveLength(0);
  });

  it("leaves at zero, not before", () => {
    const s = open(one, NO_STOCK);
    expect(ofType(tickUntil(s, 600), "customer-left")).toHaveLength(0);
    expect(s.state.seats[0]?.customer).not.toBeNull();
    const events = tick(s, 1);
    expect(ofType(events, "customer-left")[0]).toMatchObject({
      tick: 601,
      seat: 0,
      customerId: "walkin-1",
      face: "sad",
    });
    expect(s.state.seats[0]?.customer).toBeNull();
    expect(s.state.stats.counts.left).toBe(1);
    expect(s.state.stats.resolved).toEqual(["left"]);
  });

  it("only seated customers lose patience (the door wait is separate)", () => {
    const def = handDef({
      patienceSec: 10,
      arrivals: [1, 2, 3, 4].map((t) => arrival(t, walkinCustomer(t))),
    });
    const s = open(def, NO_STOCK);
    tickUntil(s, 40);
    expect(s.state.door).toHaveLength(1);
    expect(s.state.seats.map((seat) => seat.patienceLeft)).toEqual([61, 62, 63]);
  });

  it("clears the active seat when the active customer leaves", () => {
    const s = open(
      handDef({ patienceSec: 4, arrivals: [arrival(1, walkinCustomer(1))] }),
      NO_STOCK,
    );
    tick(s, 1);
    act(s, { type: "selectSeat", seat: 0 });
    expect(s.state.active).toBe(0);
    tickUntil(s, 41);
    expect(s.state.active).toBeNull();
  });

  it("freezes patience for the first scripted arrivals", () => {
    const def = handDef({
      free: 1,
      patienceSec: 4,
      arrivals: [arrival(1, walkinCustomer(1)), arrival(2, walkinCustomer(2))],
    });
    const s = open(def, NO_STOCK);
    tickUntil(s, 100);
    expect(s.state.seats[0]?.customer?.id).toBe("walkin-1");
    expect(s.state.seats[0]?.patienceLeft).toBe(40);
    expect(s.state.seats[1]?.customer).toBeNull();
    expect(ofType(s.events, "patience-warning")).toHaveLength(0);
  });

  it("relaxed mode multiplies the total by 1.5", () => {
    const def = handDef({
      relaxed: true,
      patienceSec: 45,
      arrivals: [arrival(1, walkinCustomer(1))],
    });
    const s = open(def, NO_STOCK);
    tick(s, 1);
    expect(s.state.seats[0]?.patienceTotal).toBe(675);
    expect(s.state.seats[0]?.patienceLeft).toBe(675);
  });
});

describe("serving", () => {
  const regular = handDef({ arrivals: [arrival(1, regularCustomerOf(1), plain)] });

  it("is delighted at 0.35 of the patience left and satisfied one tick later", () => {
    const early = open(regular, NO_STOCK);
    tick(early, 1);
    makeDrink(early, 0);
    tickUntil(early, 391);
    expect(early.state.seats[0]?.patienceLeft).toBe(210);
    const served = ofType(act(early, { type: "serve" }), "served")[0];
    expect(served).toMatchObject({
      outcome: "delighted",
      payment: 4,
      tip: 2,
      fp: 2,
      face: "happy",
    });

    const late = open(regular, NO_STOCK);
    tick(late, 1);
    makeDrink(late, 0);
    tickUntil(late, 392);
    expect(late.state.seats[0]?.patienceLeft).toBe(209);
    const slow = ofType(act(late, { type: "serve" }), "served")[0];
    expect(slow).toMatchObject({ outcome: "satisfied", payment: 4, tip: 1, fp: 1, face: "happy" });
  });

  it("serving an empty tray is disappointed and pays nothing", () => {
    const s = open(regular, NO_STOCK);
    tick(s, 1);
    act(s, { type: "selectSeat", seat: 0 });
    const served = ofType(act(s, { type: "serve" }), "served")[0];
    expect(served).toMatchObject({
      outcome: "disappointed",
      payment: 0,
      tip: 0,
      fp: 0,
      face: "sad",
    });
    expect(s.state.seats[0]?.customer).toBeNull();
    expect(s.state.active).toBeNull();
    expect(s.state.stats.counts.disappointed).toBe(1);
  });

  it("a substitute pastry makes a satisfied serve with half pay", () => {
    const order: Order = { drink: "drink-1", pastry: "pastry-3", mood: null };
    const def = handDef({ arrivals: [arrival(1, regularCustomerOf(1), order)] });
    const s = open(def, { pastries: ["pastry-1", "pastry-3"], books: ["book-1"] });
    tick(s, 1);
    act(s, { type: "selectSeat", seat: 0 });
    act(s, { type: "pastryPick", pastryId: "pastry-1" });
    act(s, { type: "pastryStep", plate: 0, token: "warm" });
    makeDrink(s, 0);
    tick(s, 12);
    const served = ofType(act(s, { type: "serve" }), "served")[0];
    expect(served?.scores).toEqual({ drink: 10, pastry: 5, book: null });
    expect(served).toMatchObject({ outcome: "satisfied", payment: 5, tip: 1, fp: 1 });
  });

  it("a wrong-mood book pays 1 and scores 3", () => {
    const order: Order = { drink: "drink-1", pastry: null, mood: "funny" };
    const def = handDef({ arrivals: [arrival(1, walkinCustomer(1), order)] });
    const s = open(def, NO_STOCK);
    tick(s, 1);
    makeDrink(s, 0);
    act(s, { type: "pickBook", bookId: "book-1" });
    const served = ofType(act(s, { type: "serve" }), "served")[0];
    expect(served?.scores).toEqual({ drink: 10, pastry: null, book: 3 });
    expect(served).toMatchObject({ outcome: "satisfied", payment: 5, fp: 0 });
  });

  it("a right-mood book with full tray is delighted and pays the book price", () => {
    const order: Order = { drink: "drink-1", pastry: null, mood: "curious" };
    const def = handDef({ arrivals: [arrival(1, regularCustomerOf(3), order)] });
    const s = open(def, NO_STOCK);
    tick(s, 1);
    makeDrink(s, 0);
    act(s, { type: "pickBook", bookId: "book-1" });
    const served = ofType(act(s, { type: "serve" }), "served")[0];
    expect(served).toMatchObject({ outcome: "delighted", payment: 10, tip: 4, fp: 2 });
  });

  it("applies decor: chart frame, gramophone, rosemary", () => {
    const decor = decorEffects(["decor-3", "decor-6", "decor-8"]);
    const def = handDef({ decor, arrivals: [arrival(1, regularCustomerOf(1), plain)] });
    const s = open(def, NO_STOCK);
    tick(s, 1);
    makeDrink(s, 0);
    const served = ofType(act(s, { type: "serve" }), "served")[0];
    expect(served).toMatchObject({ outcome: "delighted", payment: 5, tip: 3, fp: 3 });
  });

  it("walk-ins earn no friendship points", () => {
    const def = handDef({ arrivals: [arrival(1, walkinCustomer(1), plain)] });
    const s = open(def, NO_STOCK);
    tick(s, 1);
    makeDrink(s, 0);
    const served = ofType(act(s, { type: "serve" }), "served")[0];
    expect(served).toMatchObject({ outcome: "delighted", fp: 0, regularId: null });
    expect(s.state.stats.fpGains).toEqual([]);
  });

  it("ignores items that were not requested", () => {
    const def = handDef({ arrivals: [arrival(1, walkinCustomer(1), plain)] });
    const s = open(def, { pastries: ["pastry-1"], books: ["book-1"] });
    tick(s, 1);
    act(s, { type: "selectSeat", seat: 0 });
    act(s, { type: "pastryPick", pastryId: "pastry-1" });
    act(s, { type: "pastryStep", plate: 0, token: "warm" });
    tick(s, 12);
    makeDrink(s, 0);
    act(s, { type: "pickBook", bookId: "book-1" });
    const served = ofType(act(s, { type: "serve" }), "served")[0];
    expect(served).toMatchObject({ outcome: "delighted", payment: 4 });
  });

  it("clears a served seat's leftover plates", () => {
    const order: Order = { drink: "drink-1", pastry: "pastry-1", mood: null };
    const def = handDef({ arrivals: [arrival(1, walkinCustomer(1), order)] });
    const s = open(def, { pastries: ["pastry-1"], books: ["book-1"] });
    tick(s, 1);
    act(s, { type: "selectSeat", seat: 0 });
    act(s, { type: "pastryPick", pastryId: "pastry-1" });
    act(s, { type: "serve" });
    expect(s.state.plates).toEqual([null, null]);
  });

  it("rejects serving or selecting without a customer", () => {
    const s = open(regular, NO_STOCK);
    expect(ofType(act(s, { type: "serve" }), "action-rejected")[0]?.reason).toBe("no-active-seat");
    expect(ofType(act(s, { type: "selectSeat", seat: 2 }), "action-rejected")[0]?.reason).toBe(
      "no-customer",
    );
    expect(ofType(act(s, { type: "selectSeat", seat: 7 }), "action-rejected")[0]?.reason).toBe(
      "bad-seat",
    );
  });
});

describe("stock on the engine", () => {
  it("strips pastry from orders when the pastry shelf is empty", () => {
    const order: Order = { drink: "drink-1", pastry: "pastry-2", mood: "funny" };
    const def = handDef({ arrivals: [arrival(1, walkinCustomer(1), order)] });
    const s = open(def, NO_STOCK);
    tick(s, 1);
    expect(s.state.seats[0]?.order).toEqual({ drink: "drink-1", pastry: null, mood: "funny" });
    expect(def.arrivals[0]?.order.pastry).toBe("pastry-2");
  });

  it("keeps the pastry request when any kind is stocked", () => {
    const order: Order = { drink: "drink-1", pastry: "pastry-2", mood: null };
    const def = handDef({ arrivals: [arrival(1, walkinCustomer(1), order)] });
    const s = open(def, { pastries: ["pastry-1"], books: ["book-1"] });
    tick(s, 1);
    expect(s.state.seats[0]?.order?.pastry).toBe("pastry-2");
  });

  it("starts each stocked kind with 5 portions and the shelf books from the plan", () => {
    const s = open(handDef(), { pastries: ["pastry-1", "pastry-2"], books: ["book-3", "book-1"] });
    expect(s.state.stock).toEqual([
      { pastry: "pastry-1", portions: 5 },
      { pastry: "pastry-2", portions: 5 },
    ]);
    expect(s.state.shelfBooks).toEqual(["book-3", "book-1"]);
  });
});

describe("closing time", () => {
  const short = (arrivals: ReturnType<typeof arrival>[], patienceSec = 60) =>
    handDef({ lengthTicks: 400, patienceSec, arrivals });

  it("accepts arrivals before the cut-off and drops later ones", () => {
    const s = open(
      short([arrival(199, walkinCustomer(1)), arrival(200, walkinCustomer(2))]),
      NO_STOCK,
    );
    expect(s.state.def.arrivals).toHaveLength(1);
    tickUntil(s, 250);
    expect(s.state.stats.arrived).toBe(1);
  });

  it("closes at the clock when nobody is seated and emits shift-closed once", () => {
    const s = open(short([]), NO_STOCK);
    expect(ofType(tickUntil(s, 399), "shift-closed")).toHaveLength(0);
    expect(s.state.phase).toBe("running");
    const events = tick(s, 1);
    expect(ofType(events, "shift-closed")).toEqual([{ type: "shift-closed", tick: 400 }]);
    expect(s.state.phase).toBe("closed");
    expect(tick(s, 5)).toEqual([]);
    expect(s.state.tick).toBe(400);
  });

  it("keeps closing until the last seated customer is served", () => {
    const s = open(short([arrival(10, walkinCustomer(1), plain)]), NO_STOCK);
    tickUntil(s, 400);
    expect(s.state.phase).toBe("closing");
    expect(() => closeShift(s.state)).toThrow();
    makeDrink(s, 0);
    const events = act(s, { type: "serve" });
    expect(ofType(events, "shift-closed")).toHaveLength(1);
    expect(s.state.phase).toBe("closed");
    const result = closeShift(s.state);
    expect(result.arrived).toBe(1);
    expect(result.grade.stars).toBe(3);
  });

  it("keeps closing until the last seated customer leaves", () => {
    const s = open(short([arrival(10, walkinCustomer(1), plain)], 45), NO_STOCK);
    tickUntil(s, 459);
    expect(s.state.phase).toBe("closing");
    const events = tick(s, 1);
    expect(ofType(events, "customer-left")).toHaveLength(1);
    expect(ofType(events, "shift-closed")).toHaveLength(1);
    expect(closeShift(s.state).counts.left).toBe(1);
  });

  it("rejects actions after the shift is closed", () => {
    const s = open(short([]), NO_STOCK);
    tickUntil(s, 400);
    expect(ofType(act(s, { type: "serve" }), "action-rejected")[0]?.reason).toBe("closed");
  });
});

describe("result totals", () => {
  it("adds payments, tips and the closing bonus", () => {
    const def = handDef({
      lengthTicks: 400,
      arrivals: [arrival(1, regularCustomerOf(1), plain), arrival(2, regularCustomerOf(2), plain)],
    });
    const s = open(def, NO_STOCK);
    tickUntil(s, 3);
    makeDrink(s, 0);
    act(s, { type: "serve" });
    makeDrink(s, 1);
    act(s, { type: "serve" });
    tickUntil(s, 400);
    const result = closeShift(s.state);
    expect(result).toMatchObject({
      payments: 8,
      tips: 4,
      bonusCoins: 20,
      coins: 32,
      arrived: 2,
      longestDelightedRun: 2,
      turnedAway: 0,
      mistakes: 0,
    });
    expect(result.fpGains).toEqual([
      { regularId: 1, fp: 2 },
      { regularId: 2, fp: 2 },
    ]);
    expect(result.regularOutcomes).toEqual([
      { regularId: 1, outcome: "delighted" },
      { regularId: 2, outcome: "delighted" },
    ]);
    expect(result.counts).toEqual({ delighted: 2, satisfied: 0, disappointed: 0, left: 0 });
  });

  it("tickShift on a closed shift returns the same state", () => {
    const s = open(handDef({ lengthTicks: 300 }), NO_STOCK);
    tickUntil(s, 300);
    expect(tickShift(s.state)).toEqual({ state: s.state, events: [] });
  });
});
