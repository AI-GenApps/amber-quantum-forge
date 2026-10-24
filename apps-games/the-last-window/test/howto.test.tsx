import {
  BASE_BOOK_SLOTS,
  BASE_PASTRY_SLOTS,
  DECOR_TOTAL_PRICE,
  DELIGHTED_PATIENCE_PCT,
  FP_DELIGHTED,
  FRIENDSHIP_THRESHOLDS,
  PATIENCE_TABLE,
  PLATES,
  PORTIONS_PER_KIND,
  SEATS,
  STEP_TICKS,
  TICK_MS,
  TIP_DELIGHTED_PCT,
} from "@web-games/the-last-window-core";
import { afterEach, describe, expect, it } from "vitest";
import { HOWTO_PAGES } from "../src/data/howto";
import { CARD_FLAGS, FLAG_TUTORIAL } from "../src/onboarding/flags";
import { clickByText, mountApp, q, type Rig, text } from "./helpers";

let rig: Rig | null = null;

afterEach(() => {
  rig?.unmount();
  rig = null;
  document.body.replaceChildren();
});

const TITLES = [
  "Your shop",
  "Making drinks",
  "Pastries and the oven",
  "Books and moods",
  "Friends and stories",
  "Stock and decor",
];

describe("how to play", () => {
  it("has the six named pages", () => {
    expect(HOWTO_PAGES.map((page) => page.title)).toEqual(TITLES);
    for (const page of HOWTO_PAGES) expect(page.lines.length).toBeGreaterThanOrEqual(2);
  });

  it("reads its numbers from the core constants", () => {
    const all = (index: number): string => HOWTO_PAGES[index]?.lines.join(" ") ?? "";
    const first = PATIENCE_TABLE[0]?.seconds;
    const last = PATIENCE_TABLE[PATIENCE_TABLE.length - 1]?.seconds;
    expect(all(0)).toContain(`${SEATS} seats`);
    expect(all(0)).toContain(`${first} seconds`);
    expect(all(0)).toContain(`${last} seconds`);
    expect(all(1)).toContain(`${(STEP_TICKS.brew * TICK_MS) / 1000} seconds`);
    expect(all(1)).toContain(`${DELIGHTED_PATIENCE_PCT} percent`);
    expect(all(1)).toContain(`${TIP_DELIGHTED_PCT} percent tip`);
    expect(all(2)).toContain(`${PLATES} plates`);
    expect(all(2)).toContain(`${(STEP_TICKS.warm * TICK_MS) / 1000} seconds`);
    expect(all(4)).toContain(`${FP_DELIGHTED} friendship points`);
    expect(all(4)).toContain(FRIENDSHIP_THRESHOLDS.join(", "));
    expect(all(5)).toContain(`${BASE_PASTRY_SLOTS} pastry slots`);
    expect(all(5)).toContain(`${BASE_BOOK_SLOTS} book slots`);
    expect(all(5)).toContain(`${PORTIONS_PER_KIND} portions`);
    expect(all(5)).toContain(`${DECOR_TOTAL_PRICE} coins`);
  });

  it("renders six pages with previous and next buttons", async () => {
    rig = await mountApp({ route: ["howto"] });
    const container = rig.container;
    const seen: string[] = [];
    for (let page = 0; page < 6; page++) {
      expect(text(q(container, "[data-testid='howto-page']"))).toBe(`Page ${page + 1} of 6`);
      seen.push(q(container, "[data-testid='howto-article'] h2").textContent ?? "");
      if (page < 5) await clickByText(container, "Next page");
    }
    expect(seen).toEqual(TITLES);
    const next = [...container.querySelectorAll("button")].find(
      (b) => b.textContent === "Next page",
    );
    expect(next?.disabled).toBe(true);
    await clickByText(container, "Previous page");
    expect(text(q(container, "[data-testid='howto-page']"))).toBe("Page 5 of 6");
  });
});

describe("one-time flags", () => {
  it("uses seven distinct saved flag names, none longer than the save allows", () => {
    const names = [FLAG_TUTORIAL, ...Object.values(CARD_FLAGS)];
    expect(new Set(names).size).toBe(7);
    for (const name of names) expect(name.length).toBeLessThanOrEqual(40);
  });

  it("shows none of the six cards when every flag is already saved", async () => {
    const flags = Object.fromEntries(
      Object.values(CARD_FLAGS).map((name) => [name, true as const]),
    );
    for (const route of [
      ["prep", { kind: "day", day: 3 }],
      ["shift", { kind: "day", day: 3 }],
      ["shift", { kind: "late" }],
    ] as const) {
      rig = await mountApp({
        route: [route[0], route[1]],
        onboarding: true,
        profile: { day: 15, flags: { ...flags, [FLAG_TUTORIAL]: true } },
      });
      expect(rig.container.querySelector("[role='dialog']")).toBeNull();
      rig.unmount();
      rig = null;
    }
  });
});
