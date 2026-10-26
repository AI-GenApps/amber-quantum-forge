import { describe, expect, it } from "vitest";
import {
  type BookId,
  classifyOutcome,
  type DrinkId,
  decorEffects,
  faceFor,
  fpFor,
  matchTotals,
  noDecorEffects,
  type Order,
  type PastryId,
  paymentFor,
  scoreTray,
  type Tray,
  tipFor,
  tipPercent,
} from "../src";

const order: Order = { drink: "drink-2", pastry: "pastry-3", mood: "funny" };
const none = noDecorEffects();

describe("component scores over all 3 x 3 x 3 trays", () => {
  const drinks: Array<[DrinkId | null, number]> = [
    ["drink-2", 10],
    ["drink-1", 0],
    [null, 0],
  ];
  const pastries: Array<[PastryId | null, number]> = [
    ["pastry-3", 10],
    ["pastry-1", 5],
    [null, 0],
  ];
  const books: Array<[BookId | null, number]> = [
    ["book-4", 10],
    ["book-1", 3],
    [null, 0],
  ];
  for (const [drink, d] of drinks) {
    for (const [pastry, p] of pastries) {
      for (const [book, b] of books) {
        it(`drink ${drink} pastry ${pastry} book ${book} scores ${d + p + b} of 30`, () => {
          const tray: Tray = { drink, pastry, book };
          const scores = scoreTray(order, tray);
          expect(scores).toEqual({ drink: d, pastry: p, book: b });
          expect(matchTotals(scores)).toEqual({ sum: d + p + b, max: 30 });
        });
      }
    }
  }

  it("scores only requested components", () => {
    const scores = scoreTray(
      { drink: "drink-1", pastry: null, mood: null },
      { drink: "drink-1", pastry: "pastry-1", book: "book-1" },
    );
    expect(scores).toEqual({ drink: 10, pastry: null, book: null });
    expect(matchTotals(scores)).toEqual({ sum: 10, max: 10 });
  });

  it("the second tag of a book also counts as an exact mood", () => {
    expect(
      scoreTray(
        { drink: "drink-1", pastry: null, mood: "wistful" },
        { drink: null, pastry: null, book: "book-4" },
      ).book,
    ).toBe(10);
    expect(
      scoreTray(
        { drink: "drink-1", pastry: null, mood: "funny" },
        { drink: null, pastry: null, book: "book-5" },
      ).book,
    ).toBe(10);
  });
});

describe("outcome boundaries", () => {
  it("delighted needs a full match and at least 0.35 of the patience", () => {
    expect(classifyOutcome(30, 30, 35, 100)).toBe("delighted");
    expect(classifyOutcome(30, 30, 34, 100)).toBe("satisfied");
    expect(classifyOutcome(10, 10, 210, 600)).toBe("delighted");
    expect(classifyOutcome(10, 10, 209, 600)).toBe("satisfied");
    expect(classifyOutcome(10, 10, 600, 600)).toBe("delighted");
  });

  it("satisfied needs a match of at least 0.6", () => {
    expect(classifyOutcome(60, 100, 100, 100)).toBe("satisfied");
    expect(classifyOutcome(59, 100, 100, 100)).toBe("disappointed");
    expect(classifyOutcome(12, 20, 1, 100)).toBe("satisfied");
    expect(classifyOutcome(11, 20, 1, 100)).toBe("disappointed");
  });

  it("a partial match is never delighted even with full patience", () => {
    expect(classifyOutcome(29, 30, 100, 100)).toBe("satisfied");
    expect(classifyOutcome(15, 20, 100, 100)).toBe("satisfied");
  });

  it("an empty tray is disappointed", () => {
    expect(classifyOutcome(0, 10, 100, 100)).toBe("disappointed");
  });

  it("faces: happy after delighted or satisfied, sad otherwise", () => {
    expect(faceFor("delighted")).toBe("happy");
    expect(faceFor("satisfied")).toBe("happy");
    expect(faceFor("disappointed")).toBe("sad");
    expect(faceFor("left")).toBe("sad");
  });
});

describe("payment", () => {
  const pay = (tray: Partial<Tray>, o: Order = order, decor = none) =>
    paymentFor(o, { drink: null, pastry: null, book: null, ...tray }, decor);

  it("pays each exact item its price", () => {
    expect(pay({ drink: "drink-2" })).toBe(5);
    expect(pay({ drink: "drink-2", pastry: "pastry-3" })).toBe(10);
    expect(pay({ drink: "drink-2", pastry: "pastry-3", book: "book-4" })).toBe(17);
  });

  it("pays half the delivered price for a substitute pastry, at least 1, rounded down", () => {
    expect(pay({ pastry: "pastry-1" })).toBe(1);
    expect(pay({ pastry: "pastry-2" })).toBe(2);
    expect(pay({ pastry: "pastry-5" })).toBe(2);
    expect(pay({ pastry: "pastry-4" })).toBe(2);
  });

  it("pays 1 for a wrong-mood book", () => {
    expect(pay({ book: "book-1" })).toBe(1);
    expect(pay({ book: "book-3" })).toBe(1);
  });

  it("pays nothing for a wrong or missing drink and for unrequested items", () => {
    expect(pay({ drink: "drink-1" })).toBe(0);
    expect(pay({})).toBe(0);
    const plain: Order = { drink: "drink-1", pastry: null, mood: null };
    expect(pay({ drink: "drink-1", pastry: "pastry-1", book: "book-1" }, plain)).toBe(4);
  });

  it("adds decor to exact drinks and right-mood books only", () => {
    const decor = decorEffects(["decor-2", "decor-3"]);
    expect(pay({ drink: "drink-2" }, order, decor)).toBe(6);
    expect(pay({ book: "book-4" }, order, decor)).toBe(9);
    expect(pay({ book: "book-1" }, order, decor)).toBe(1);
    expect(pay({ drink: "drink-1" }, order, decor)).toBe(0);
    expect(pay({ drink: "drink-2", pastry: "pastry-3", book: "book-4" }, order, decor)).toBe(20);
  });
});

describe("tips", () => {
  it("rounds up 40 percent for delighted", () => {
    expect(tipFor(17, "delighted", none)).toBe(7);
    expect(tipFor(4, "delighted", none)).toBe(2);
    expect(tipFor(5, "delighted", none)).toBe(2);
    expect(tipFor(1, "delighted", none)).toBe(1);
    expect(tipFor(10, "delighted", none)).toBe(4);
  });

  it("rounds up 15 percent for satisfied", () => {
    expect(tipFor(17, "satisfied", none)).toBe(3);
    expect(tipFor(6, "satisfied", none)).toBe(1);
    expect(tipFor(20, "satisfied", none)).toBe(3);
    expect(tipFor(21, "satisfied", none)).toBe(4);
  });

  it("is zero for disappointed and left and for no payment", () => {
    expect(tipFor(17, "disappointed", none)).toBe(0);
    expect(tipFor(17, "left", none)).toBe(0);
    expect(tipFor(0, "delighted", none)).toBe(0);
  });

  it("the gramophone adds 10 percentage points", () => {
    const g = decorEffects(["decor-8"]);
    expect(tipPercent("delighted", g)).toBe(50);
    expect(tipPercent("satisfied", g)).toBe(25);
    expect(tipPercent("disappointed", g)).toBe(0);
    expect(tipFor(17, "delighted", g)).toBe(9);
    expect(tipFor(17, "satisfied", g)).toBe(5);
    expect(tipFor(4, "delighted", g)).toBe(2);
  });
});

describe("friendship points", () => {
  it("gives 2, 1, 0, 0 to regulars", () => {
    expect(fpFor("delighted", true, none)).toBe(2);
    expect(fpFor("satisfied", true, none)).toBe(1);
    expect(fpFor("disappointed", true, none)).toBe(0);
    expect(fpFor("left", true, none)).toBe(0);
  });

  it("gives nothing to walk-ins", () => {
    expect(fpFor("delighted", false, none)).toBe(0);
  });

  it("the chart frame adds 1 to delighted only, maximum 3 per serve", () => {
    const frame = decorEffects(["decor-6"]);
    expect(fpFor("delighted", true, frame)).toBe(3);
    expect(fpFor("satisfied", true, frame)).toBe(1);
    const huge = { ...frame, fpBonus: 5 };
    expect(fpFor("delighted", true, huge)).toBe(3);
  });
});
