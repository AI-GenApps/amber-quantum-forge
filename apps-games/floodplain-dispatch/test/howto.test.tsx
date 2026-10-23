import {
  FREEZE_PRICE,
  HINT_PRICE,
  MAX_FREEZES,
  PIECE_COSTS,
  RESERVOIR_CAPACITY,
} from "@web-games/floodplain-dispatch-core";
import { afterEach, describe, expect, it } from "vitest";
import { HOWTO_PAGES } from "../src/data/howto";
import { buttonByText, click, mountApp, q, type Rig, text } from "./helpers";

let rig: Rig | null = null;
afterEach(() => {
  rig?.unmount();
  rig = null;
  document.body.replaceChildren();
});

const TITLES = [
  "Goal",
  "Pieces",
  "Reading the water",
  "Forecast and weeks",
  "Stars and scoring",
  "Daily Dispatch",
];

describe("how to play", () => {
  it("has six pages with the planned titles", () => {
    expect(HOWTO_PAGES.map((page) => page.title)).toEqual(TITLES);
    for (const page of HOWTO_PAGES) {
      expect(page.body.length).toBeGreaterThan(1);
      expect(page.body.join(" ").length).toBeLessThan(700);
    }
  });

  it("renders each page in turn and keeps the page counter", async () => {
    rig = await mountApp({ route: ["howto"] });
    const root = (rig as Rig).container;
    for (const [index, title] of TITLES.entries()) {
      expect(text(q(root, "[data-testid='howto-page'] h2"))).toBe(title);
      expect(text(q(root, "[data-testid='howto-count']"))).toBe(`Page ${index + 1} of 6`);
      if (index < TITLES.length - 1) await click(buttonByText(root, "Next page"));
    }
  });

  it("reads every price and limit from the core constants", async () => {
    const pieces = HOWTO_PAGES.find((page) => page.id === "pieces")?.body.join("\n") ?? "";
    expect(pieces).toContain(`Canal (${PIECE_COSTS.canal})`);
    expect(pieces).toContain(`Sandbags (${PIECE_COSTS.barrier})`);
    expect(pieces).toContain(`Sluice gate (${PIECE_COSTS.gate})`);
    expect(pieces).toContain(`Pump (${PIECE_COSTS.pump})`);
    expect(pieces).toContain(`Reservoir (${PIECE_COSTS.reservoir})`);
    expect(pieces).toContain(`holds ${RESERVOIR_CAPACITY} units`);
    expect([
      PIECE_COSTS.canal,
      PIECE_COSTS.barrier,
      PIECE_COSTS.gate,
      PIECE_COSTS.pump,
      PIECE_COSTS.reservoir,
    ]).toEqual([1, 1, 2, 3, 4]);
    const stars = HOWTO_PAGES.find((page) => page.id === "stars")?.body.join("\n") ?? "";
    expect(stars).toContain(`costs ${HINT_PRICE.campaign} coins`);
    const daily = HOWTO_PAGES.find((page) => page.id === "daily")?.body.join("\n") ?? "";
    expect(daily).toContain(`costs ${FREEZE_PRICE} coins`);
    expect(daily).toContain(`hold ${MAX_FREEZES}`);
    expect(daily).toContain(`${HINT_PRICE.daily} coins`);
  });

  it("shows the price lines on screen", async () => {
    rig = await mountApp({ route: ["howto"] });
    const root = (rig as Rig).container;
    await click(buttonByText(root, "Next page"));
    const page = text(q(root, "[data-testid='howto-page']"));
    expect(page).toContain("Canal (1)");
    expect(page).toContain("Reservoir (4)");
  });
});
