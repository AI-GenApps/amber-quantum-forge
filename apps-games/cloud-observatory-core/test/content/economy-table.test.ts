import { describe, expect, it } from "vitest";
import { RULES } from "../../src/constants";
import { BUNDLE } from "./bundle";
import { parseNumber, readDoc, sectionOf, tableRows } from "./docs";

const economy = readDoc("economy.md");

function plural(name: string): string {
  if (/[^aeiou]y$/.test(name)) return `${name.slice(0, -1)}ies`;
  if (name.endsWith("ss")) return `${name}es`;
  return `${name}s`;
}

describe("economy.md matches the code", () => {
  it("lists every instrument with the same numbers", () => {
    const rows = tableRows(sectionOf(economy, "## Instruments"));
    expect(rows).toHaveLength(8);
    rows.forEach((cells, index) => {
      const def = BUNDLE.catalog.instruments[index];
      expect(cells[1]).toBe(def?.id);
      expect(cells[2]).toBe(def?.name);
      expect(parseNumber(cells[3] ?? "")).toBe(def?.baseCost);
      expect(parseNumber(cells[4] ?? "")).toBe(def?.baseSps);
      expect(parseNumber(cells[5] ?? "")).toBe(def?.growth);
    });
  });

  it("lists every constellation with the same cost, prerequisite and star count", () => {
    const rows = tableRows(sectionOf(economy, "## Constellation charting"));
    expect(rows).toHaveLength(12);
    rows.forEach((cells, index) => {
      const def = BUNDLE.catalog.constellations[index];
      expect(cells[1]).toBe(def?.name);
      expect(parseNumber(cells[2] ?? "")).toBe(def?.stars.length);
      expect(parseNumber(cells[3] ?? "")).toBe(def?.cost);
      const instrument = BUNDLE.catalog.instruments.find(
        (i) => i.id === def?.requires.instrumentId,
      );
      expect(cells[4]).toBe(`${def?.requires.count} ${plural(instrument?.name ?? "")}`);
    });
  });

  it("lists every boon with the same id, name and cost", () => {
    const rows = tableRows(sectionOf(economy, "## Eclipse and boons"));
    expect(rows).toHaveLength(10);
    rows.forEach((cells, index) => {
      const def = BUNDLE.catalog.boons[index];
      expect(cells[1]).toBe(def?.id);
      expect(cells[2]).toBe(def?.name);
      expect(parseNumber(cells[3] ?? "")).toBe(def?.cost);
    });
  });

  it("describes each boon effect with the coded numbers", () => {
    const text = new Map(
      tableRows(sectionOf(economy, "## Eclipse and boons")).map((c) => [c[1], c[4] ?? ""]),
    );
    const effect = (id: string) => BUNDLE.catalog.boons.find((b) => b.id === id)?.effect;
    expect(effect("dark-adapted")).toEqual({ kind: "start-starlight", amount: 1000 });
    expect(text.get("dark-adapted")).toContain("1,000 starlight");
    expect(effect("brass-polish")).toEqual({
      kind: "instrument-mult",
      instrumentId: "telescope",
      factor: 2,
    });
    expect(text.get("brass-polish")).toContain("×2");
    expect(effect("clear-glass")).toEqual({ kind: "cost-mult", factor: 0.95 });
    expect(text.get("clear-glass")).toContain("×0.95");
    expect(effect("night-watch")).toEqual({ kind: "offline-efficiency", value: 0.75 });
    expect(text.get("night-watch")).toContain("50% to 75%");
    expect(effect("apprentice")).toEqual({
      kind: "start-owned",
      owned: { telescope: 5, lens: 3 },
    });
    expect(text.get("apprentice")).toContain("5 Brass Telescopes and 3 Lens Arrays");
    expect(effect("atlas-ink")).toEqual({ kind: "atlas-factor", factor: 1.5 });
    expect(text.get("atlas-ink")).toContain("×1.5");
    expect(effect("long-vigil")).toEqual({ kind: "offline-efficiency", value: 1 });
    expect(text.get("long-vigil")).toContain("75% to 100%");
    expect(effect("second-sight")).toEqual({ kind: "upgrade-cost-mult", factor: 0.75 });
    expect(text.get("second-sight")).toContain("×0.75");
    expect(effect("corona")).toEqual({ kind: "global-mult", factor: 1.5 });
    expect(text.get("corona")).toContain("×1.5");
    expect(effect("totality")).toEqual({ kind: "global-mult", factor: 2 });
    expect(text.get("totality")).toContain("×2");
  });

  it("states the upgrade cost factors, thresholds and multipliers used by the rules", () => {
    const rows = tableRows(sectionOf(economy, "## Upgrades"));
    expect(rows).toHaveLength(3);
    rows.forEach((cells, index) => {
      expect(parseNumber(cells[1] ?? "")).toBe(RULES.UPGRADE_THRESHOLDS[index]);
      expect(parseNumber((cells[2] ?? "").split("×")[0] ?? "")).toBe(
        RULES.UPGRADE_COST_FACTORS[index],
      );
      expect(parseNumber((cells[3] ?? "").replace("×", ""))).toBe(RULES.UPGRADE_MULTIPLIERS[index]);
    });
  });

  it("states the Eclipse and offline constants used by the rules", () => {
    expect(economy).toContain("floor(sqrt(cycleStarlight / 1e9))");
    expect(RULES.ECLIPSE_DIVISOR).toBe(1e9);
    expect(RULES.ECLIPSE_MIN_SHARDS).toBe(5);
    expect(economy).toContain("28,800");
    expect(RULES.OFFLINE_CAP_SECONDS).toBe(28800);
    expect(economy).toContain("Starlight 10,");
    expect(RULES.STARTING_STARLIGHT).toBe(10);
  });

  it("names achievements exactly as content-plan.md does", () => {
    const plan = readDoc("content-plan.md");
    const rows = tableRows(sectionOf(plan, "## 6. Achievements"));
    expect(rows).toHaveLength(20);
    rows.forEach((cells, index) => {
      expect(cells[1]).toBe(BUNDLE.achievements[index]?.id);
      expect(cells[2]).toBe(BUNDLE.achievements[index]?.name);
    });
  });

  it("names instruments, upgrades and boons exactly as content-plan.md does", () => {
    const plan = readDoc("content-plan.md");
    const instruments = tableRows(sectionOf(plan, "## 2. Instruments"));
    instruments.forEach((cells, index) => {
      expect(cells[1]).toBe(BUNDLE.catalog.instruments[index]?.id);
      expect(cells[2]).toBe(BUNDLE.catalog.instruments[index]?.name);
    });
    const upgrades = tableRows(sectionOf(plan, "## 3. Upgrades"));
    expect(upgrades).toHaveLength(8);
    upgrades.forEach((cells, row) => {
      for (let tier = 1; tier <= 3; tier++) {
        const [id, ...words] = (cells[tier] ?? "").split(" ");
        const def = BUNDLE.catalog.upgrades[row * 3 + tier - 1];
        expect(id).toBe(def?.id);
        expect(words.join(" ")).toBe(def?.name);
      }
    });
    const boons = tableRows(sectionOf(plan, "## 4. Eclipse boons"));
    boons.forEach((cells, index) => {
      expect(cells[1]).toBe(BUNDLE.catalog.boons[index]?.id);
      expect(cells[2]).toBe(BUNDLE.catalog.boons[index]?.name);
      expect(parseNumber(cells[3] ?? "")).toBe(BUNDLE.catalog.boons[index]?.cost);
    });
    const chapters = plan.match(/^### Chapter \d: .+$/gm) ?? [];
    expect(
      chapters.map((line) => line.replace(/^### Chapter \d: /, "").replace(/ \(art slot.*$/, "")),
    ).toEqual(BUNDLE.chapters.map((c) => c.title));
    const constellations = tableRows(sectionOf(plan, "## 1. Constellations"));
    constellations.forEach((cells, index) => {
      expect(cells[1]).toBe(BUNDLE.catalog.constellations[index]?.id);
      expect(cells[2]).toBe(BUNDLE.catalog.constellations[index]?.name);
      expect(parseNumber(cells[3] ?? "")).toBe(BUNDLE.catalog.constellations[index]?.stars.length);
    });
  });
});
