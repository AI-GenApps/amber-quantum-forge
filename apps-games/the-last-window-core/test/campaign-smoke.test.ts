import { describe, expect, it } from "vitest";
import {
  DAYS,
  eligibleScenes,
  getDay,
  REGULARS,
  regularsDue,
  TUTORIAL_ORDERS,
  visitDaysFor,
} from "../src";
import { CASUAL, PERFECT, playShift } from "./helpers/bot";
import { contentDef, foresightStock, playCampaign, suggestedStock } from "./helpers/campaign";

describe("perfect bot over the 14 real days", () => {
  const campaign = playCampaign(PERFECT, (_day, def) => foresightStock(def));

  it("closes every shift", () => {
    expect(campaign.logs).toHaveLength(14);
    for (const log of campaign.logs) {
      expect(log.result.arrived, `day ${log.day}`).toBe(getDay(log.day).customers);
      expect(log.result.counts.left, `day ${log.day}`).toBe(0);
      expect(log.result.grade.stars, `day ${log.day}`).toBeGreaterThanOrEqual(2);
    }
  });

  it("serves exactly the regulars of the calendar each day", () => {
    for (const log of campaign.logs) {
      const served = log.result.regularOutcomes.map((entry) => entry.regularId).sort();
      expect(served, `day ${log.day}`).toEqual([...getDay(log.day).regularsDue].sort());
    }
  });

  it("derives regulars due from the day table", () => {
    expect(regularsDue(14).map((r) => r.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(regularsDue(3).map((r) => r.name)).toEqual([
      "Odile Marsh",
      "Priya Anand",
      "Abel Quill",
      "Sunniva Roe",
    ]);
  });

  it("makes scene k eligible at visit k for every regular", () => {
    for (const regular of REGULARS) {
      const days = visitDaysFor(regular.id);
      expect(days).toEqual([...regular.visitDays]);
      days.forEach((day, i) => {
        expect(
          campaign.firstEligible.get(`${regular.id}-${i + 1}`),
          `${regular.name} scene ${i + 1}`,
        ).toBe(day);
      });
    }
  });

  it("never holds more scenes than an evening can play", () => {
    for (const log of campaign.logs) expect(log.waiting, `day ${log.day}`).toBe(0);
  });

  it("finishes all 40 scenes by Day 14", () => {
    for (const row of campaign.progress) expect(row.scenesDone).toBe(5);
    expect(eligibleScenes(campaign.progress)).toEqual([]);
  });
});

describe("Day 1 follows the scripted orders", () => {
  const day = DAYS[0];
  if (day === undefined) throw new Error("no day 1");
  const def = contentDef(day);
  const run = playShift(def, foresightStock(def), PERFECT);

  it("uses regulars 1, 2, 3 and three walk-ins", () => {
    const regular = TUTORIAL_ORDERS.filter((o) => o.customer.kind === "regular");
    expect(regular.map((o) => o.customer.regularId).sort()).toEqual([1, 2, 3]);
    expect(TUTORIAL_ORDERS.filter((o) => o.customer.kind === "walkin")).toHaveLength(3);
    expect(TUTORIAL_ORDERS).toHaveLength(6);
  });

  it("seats the six customers in order with the scripted components", () => {
    const seated = run.events.filter((e) => e.type === "customer-seated");
    expect(seated).toHaveLength(6);
    seated.forEach((event, i) => {
      const scripted = TUTORIAL_ORDERS[i];
      expect(event.order).toEqual(scripted?.order);
      const expectId =
        scripted?.customer.kind === "regular"
          ? `regular-${scripted.customer.regularId}`
          : "walkin-";
      expect(event.customerId.startsWith(expectId)).toBe(true);
    });
  });

  it("the first two customers do not lose patience", () => {
    expect(def.patienceFreeArrivals).toBe(2);
    expect(def.basePatienceTicks).toBe(600);
  });

  it("serves all six and gives the three regulars friendship", () => {
    expect(run.result.arrived).toBe(6);
    expect(run.result.counts.left).toBe(0);
    expect(run.result.regularOutcomes.map((o) => o.regularId).sort()).toEqual([1, 2, 3]);
  });
});

describe("casual play report", () => {
  it("plays 14 days and reports how many scenes are eligible by Day 14", () => {
    const campaign = playCampaign(CASUAL, (day, def) => suggestedStock(day, def));
    expect(campaign.logs).toHaveLength(14);
    for (const log of campaign.logs) expect(log.result.arrived).toBe(getDay(log.day).customers);
    const scenes = campaign.progress.reduce((sum, row) => sum + row.scenesDone, 0);
    const perRegular = campaign.progress
      .map((row) => `${row.regularId}:${row.scenesDone}`)
      .join(" ");
    const waiting = campaign.progress.filter((row) => row.scenesDone < 5).length;
    console.info(
      `casual: ${scenes} of 40 scenes played by Day 14 (${perRegular}); ${waiting} regulars still have an open story`,
    );
    expect(scenes).toBeGreaterThan(0);
  });
});
