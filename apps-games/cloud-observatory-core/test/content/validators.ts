import { minStarDistance, starsInsideMargin } from "../../src/chart";
import { RULES } from "../../src/constants";
import type { AchievementDef, LoreChapter, LoreEntry } from "../../src/content/types";
import type { Catalog } from "../../src/types";
import { boundingBox, pathCrossings } from "./geometry";

export interface Bundle {
  readonly catalog: Catalog;
  readonly lore: readonly LoreEntry[];
  readonly chapters: readonly LoreChapter[];
  readonly achievements: readonly AchievementDef[];
}

export const EXPECTED_STAR_COUNTS = [5, 6, 6, 6, 7, 7, 7, 7, 8, 8, 9, 10];
const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export function countProblems(bundle: Bundle): string[] {
  const { catalog } = bundle;
  const problems: string[] = [];
  const expect = (label: string, actual: number, wanted: number): void => {
    if (actual !== wanted) problems.push(`${label}: ${actual} instead of ${wanted}`);
  };
  expect("constellations", catalog.constellations.length, 12);
  expect(
    "stars",
    catalog.constellations.reduce((sum, c) => sum + c.stars.length, 0),
    86,
  );
  expect("instruments", catalog.instruments.length, 8);
  expect("upgrades", catalog.upgrades.length, 24);
  expect("boons", catalog.boons.length, 10);
  expect(
    "shards",
    catalog.boons.reduce((sum, b) => sum + b.cost, 0),
    105,
  );
  expect("lore", bundle.lore.length, 30);
  expect("chapters", bundle.chapters.length, 6);
  expect("achievements", bundle.achievements.length, 20);
  for (const chapter of bundle.chapters) {
    expect(
      `chapter ${chapter.number}`,
      bundle.lore.filter((entry) => entry.chapter === chapter.number).length,
      5,
    );
  }
  return problems;
}

function uniqueProblems(label: string, rows: readonly { id: string; name?: string }[]): string[] {
  const problems: string[] = [];
  const ids = new Set<string>();
  const names = new Set<string>();
  for (const row of rows) {
    if (!KEBAB.test(row.id)) problems.push(`${label}: id ${row.id} is not kebab-case`);
    if (ids.has(row.id)) problems.push(`${label}: duplicate id ${row.id}`);
    ids.add(row.id);
    if (row.name === undefined) continue;
    if (row.name.length === 0 || row.name !== row.name.trim()) {
      problems.push(`${label}: bad name for ${row.id}`);
    }
    if (names.has(row.name)) problems.push(`${label}: duplicate name ${row.name}`);
    names.add(row.name);
  }
  return problems;
}

export function idProblems(bundle: Bundle): string[] {
  const { catalog } = bundle;
  const problems = [
    ...uniqueProblems("instrument", catalog.instruments),
    ...uniqueProblems("upgrade", catalog.upgrades),
    ...uniqueProblems("constellation", catalog.constellations),
    ...uniqueProblems("boon", catalog.boons),
    ...uniqueProblems("achievement", bundle.achievements),
    ...uniqueProblems(
      "lore",
      bundle.lore.map((e) => ({ id: e.id, name: e.title })),
    ),
  ];
  const instruments = new Set(catalog.instruments.map((i) => i.id));
  for (const instrument of catalog.instruments) {
    const tiers = catalog.upgrades
      .filter((u) => u.instrumentId === instrument.id)
      .map((u) => u.tier)
      .sort();
    if (tiers.join(",") !== "1,2,3") problems.push(`upgrade tiers for ${instrument.id}`);
  }
  for (const upgrade of catalog.upgrades) {
    if (!instruments.has(upgrade.instrumentId)) problems.push(`upgrade ${upgrade.id} instrument`);
    if (upgrade.id !== `u-${upgrade.instrumentId}-${upgrade.tier}`) {
      problems.push(`upgrade id ${upgrade.id} does not follow u-<instrument>-<tier>`);
    }
  }
  for (const c of catalog.constellations) {
    if (!instruments.has(c.requires.instrumentId)) problems.push(`prerequisite of ${c.id}`);
  }
  for (const boon of catalog.boons) {
    const { effect } = boon;
    if (effect.kind === "instrument-mult" && !instruments.has(effect.instrumentId)) {
      problems.push(`boon ${boon.id} instrument`);
    }
    if (effect.kind === "start-owned") {
      for (const id of Object.keys(effect.owned)) {
        if (!instruments.has(id)) problems.push(`boon ${boon.id} start-owned ${id}`);
      }
    }
  }
  for (const a of bundle.achievements) {
    if (a.condition.kind === "owned" && !instruments.has(a.condition.instrumentId)) {
      problems.push(`achievement ${a.id} instrument`);
    }
  }
  return problems;
}

export function starProblems(catalog: Catalog): string[] {
  const problems: string[] = [];
  catalog.constellations.forEach((c, index) => {
    if (c.stars.length !== EXPECTED_STAR_COUNTS[index]) problems.push(`${c.id}: star count`);
    if (!starsInsideMargin(c.stars)) problems.push(`${c.id}: outside the margin`);
    if (minStarDistance(c.stars) < RULES.STAR_MIN_SPACING) problems.push(`${c.id}: spacing`);
    const box = boundingBox(c.stars);
    if (box.long < 500 || box.short < 250) problems.push(`${c.id}: bounding box too small`);
    for (const crossing of pathCrossings(c.stars, c.closed)) problems.push(`${c.id}: ${crossing}`);
    const first = c.stars[0];
    const last = c.stars[c.stars.length - 1];
    if (c.closed && first && last && Math.hypot(first.x - last.x, first.y - last.y) >= 700) {
      problems.push(`${c.id}: closing edge too long`);
    }
  });
  return problems;
}

export interface PlanLoreRow {
  readonly id: string;
  readonly title: string;
  readonly trigger: string;
}

function triggerLabel(bundle: Bundle, entry: LoreEntry): string | null {
  const { trigger } = entry;
  const { catalog } = bundle;
  if (trigger.kind === "instrument") {
    const found = catalog.instruments.find((i) => i.id === trigger.id);
    return found ? `First ${found.name}` : null;
  }
  if (trigger.kind === "constellation") {
    const found = catalog.constellations.find((c) => c.id === trigger.id);
    return found ? `Chart ${found.name}` : null;
  }
  const found = catalog.boons.find((b) => b.id === trigger.id);
  return found ? `Boon ${found.name}` : null;
}

export function loreProblems(bundle: Bundle, plan: readonly PlanLoreRow[]): string[] {
  const problems: string[] = [];
  const seen = new Set<string>();
  const used = new Map<string, number>();
  bundle.lore.forEach((entry, index) => {
    const label = triggerLabel(bundle, entry);
    if (label === null) problems.push(`${entry.id}: trigger does not resolve`);
    const key = `${entry.trigger.kind}:${entry.trigger.id}`;
    used.set(key, (used.get(key) ?? 0) + 1);
    const words = entry.body.trim().split(/\s+/).length;
    if (words < 40 || words > 90) problems.push(`${entry.id}: ${words} words`);
    if (/window|document/i.test(entry.body + entry.title))
      problems.push(`${entry.id}: banned token`);
    const normal = entry.body
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
    if (seen.has(normal)) problems.push(`${entry.id}: duplicate text`);
    seen.add(normal);
    if (entry.chapter !== Math.floor(index / 5) + 1) problems.push(`${entry.id}: chapter order`);
    if (entry.id !== `lore-${String(index + 1).padStart(2, "0")}`)
      problems.push(`${entry.id}: id order`);
    const row = plan[index];
    if (row === undefined || row.id !== entry.id || row.title !== entry.title) {
      problems.push(`${entry.id}: title differs from content-plan.md`);
    } else if (row.trigger !== label) {
      problems.push(`${entry.id}: trigger differs from content-plan.md`);
    }
  });
  const wanted = [
    ...bundle.catalog.instruments.map((i) => `instrument:${i.id}`),
    ...bundle.catalog.constellations.map((c) => `constellation:${c.id}`),
    ...bundle.catalog.boons.map((b) => `boon:${b.id}`),
  ];
  for (const key of wanted) {
    if (used.get(key) !== 1) problems.push(`${key}: triggers ${used.get(key) ?? 0} entries`);
  }
  if (plan.length !== bundle.lore.length) problems.push("plan row count differs");
  return problems;
}
