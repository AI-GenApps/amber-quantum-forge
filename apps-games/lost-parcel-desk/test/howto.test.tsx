import {
  CHAPTER_UNLOCKS,
  FREEZE_PRICE,
  HINT_PRICE,
  MAX_STAMPS,
  MIN_FITS_TO_ACCUSE,
} from "@web-games/lost-parcel-desk-core";
import { afterEach, describe, expect, it } from "vitest";
import { HOWTO_PAGES } from "../src/data/howto";
import { mountApp, q, type Rig, tap, text } from "./helpers";

let rig: Rig | null = null;

afterEach(() => {
  rig?.unmount();
  rig = null;
  document.body.replaceChildren();
});

describe("how to play", () => {
  it("has the six pages of the content plan", () => {
    expect(HOWTO_PAGES.map((page) => page.title)).toEqual([
      "The job",
      "The evidence table",
      "The deduction board",
      "Stamps and postage",
      "Pairs and rule-outs",
      "Daily Parcel",
    ]);
    for (const page of HOWTO_PAGES) expect(page.lines.length).toBeGreaterThan(0);
  });

  it("renders each page with its title and short text", async () => {
    rig = await mountApp({ route: ["howto"] });
    for (const [index, page] of HOWTO_PAGES.entries()) {
      expect(text(q(rig.container, "[data-testid='howto-page']"))).toBe(`Page ${index + 1} of 6`);
      expect(text(q(rig.container, ".lp-howto__title"))).toBe(page.title);
      const body = text(q(rig.container, ".lp-howto__page"));
      for (const line of page.lines) expect(body).toContain(line);
      if (index < 5) await tap(rig, "Next");
    }
  });

  it("reads every number from the core constants", () => {
    const stamps = HOWTO_PAGES.find((page) => page.id === "stamps")?.lines.join(" ") ?? "";
    expect(stamps).toContain(`${MAX_STAMPS} stamps`);
    expect(stamps).toContain(`${CHAPTER_UNLOCKS[1]} and ${CHAPTER_UNLOCKS[2]} stamps`);
    expect(stamps).toContain(`${HINT_PRICE.campaign} for a case`);
    expect(stamps).toContain(`${HINT_PRICE.daily} on the Daily Parcel`);
    expect([HINT_PRICE.campaign, HINT_PRICE.daily, CHAPTER_UNLOCKS[1], CHAPTER_UNLOCKS[2]]).toEqual(
      [20, 15, 7, 18],
    );
    const board = HOWTO_PAGES.find((page) => page.id === "board")?.lines.join(" ") ?? "";
    expect(board).toContain(`${MIN_FITS_TO_ACCUSE} clues`);
    expect(MIN_FITS_TO_ACCUSE).toBe(2);
    const daily = HOWTO_PAGES.find((page) => page.id === "daily")?.lines.join(" ") ?? "";
    expect(daily).toContain(`${FREEZE_PRICE} postage`);
    expect(FREEZE_PRICE).toBe(30);
  });
});
