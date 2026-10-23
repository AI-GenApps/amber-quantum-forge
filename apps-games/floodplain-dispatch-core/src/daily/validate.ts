import { BUDGET_SLACK } from "../content";
import { evaluate } from "../evaluate";
import { parseLayout } from "../layout";
import { checkPlacement, totalCost } from "../placement";
import { runSeason } from "../simulate";
import type { EventType, Placement } from "../types";
import type { DailyMap } from "./generate";
import type { DailyTier } from "./tiers";

export type DailyIssueCode =
  | "LAYOUT_PARSE"
  | "SIZE"
  | "WEEKS"
  | "INLETS"
  | "HOUSES"
  | "FIELDS"
  | "HOUSE_KINDS"
  | "PIECES"
  | "EVENT_COUNT"
  | "EVENT_RANGE"
  | "TIDE"
  | "REFERENCE_ILLEGAL"
  | "REFERENCE_STARS"
  | "REFERENCE_COST"
  | "BUDGET_RULE";

export interface DailyIssue {
  code: DailyIssueCode;
  detail: string;
}

function countType(map: DailyMap, type: EventType): number {
  return map.events.filter((event) => event.type === type).length;
}

function shapeIssues(map: DailyMap, tier: DailyTier): DailyIssue[] {
  const issues: DailyIssue[] = [];
  const add = (code: DailyIssueCode, detail: string): number => issues.push({ code, detail });
  const parsed = parseLayout(map.layout);
  if (!parsed.ok) {
    add("LAYOUT_PARSE", parsed.error.code);
    return issues;
  }
  const { width, height, kinds } = parsed.layout;
  if (width !== tier.width || height !== tier.height) add("SIZE", `${width} x ${height}`);
  if (map.weeks !== tier.weeks) add("WEEKS", String(map.weeks));
  const count = (kind: string): number => kinds.filter((entry) => entry === kind).length;
  if (count("inlet") !== tier.inlets || map.inlets.length !== tier.inlets) add("INLETS", "count");
  if (count("house") !== tier.houses) add("HOUSES", String(count("house")));
  if (count("field") !== tier.fields) add("FIELDS", String(count("field")));
  if (map.houseKinds.length !== count("house")) add("HOUSE_KINDS", String(map.houseKinds.length));
  if (map.pieces.join() !== tier.pieces.join()) add("PIECES", map.pieces.join());
  for (const type of ["surge", "drought", "storm-tide"] as const) {
    const wanted =
      tier.tide || type !== "storm-tide" ? tier.events.filter((e) => e.type === type) : [];
    const expected = wanted.reduce((sum, plan) => sum + plan.count, 0);
    if (countType(map, type) !== expected) add("EVENT_COUNT", `${type} ${countType(map, type)}`);
  }
  for (const event of map.events) {
    const inside = event.week >= 0 && event.weeks >= 1 && event.week + event.weeks <= map.weeks;
    if (!inside || event.delta < 1) add("EVENT_RANGE", `${event.type}@${event.week}`);
  }
  if ((map.tide !== null) !== (tier.tide !== null)) add("TIDE", "presence");
  return issues;
}

function referenceIssues(map: DailyMap): DailyIssue[] {
  const issues: DailyIssue[] = [];
  const placed: Placement[] = [];
  for (const piece of map.reference) {
    const error = checkPlacement(map, placed, piece);
    if (error) {
      issues.push({
        code: "REFERENCE_ILLEGAL",
        detail: `${piece.kind}@${piece.x},${piece.y}: ${error}`,
      });
    }
    placed.push(piece);
  }
  const evaluation = evaluate(map, runSeason(map, map.reference), map.reference);
  if (evaluation.stars !== 3) {
    issues.push({ code: "REFERENCE_STARS", detail: String(evaluation.stars) });
  }
  if (totalCost(map.reference) !== map.par) {
    issues.push({ code: "REFERENCE_COST", detail: `${totalCost(map.reference)} vs ${map.par}` });
  }
  if (map.budget !== map.par + BUDGET_SLACK) {
    issues.push({ code: "BUDGET_RULE", detail: `${map.budget} vs ${map.par}` });
  }
  return issues;
}

export function validateDailyMap(map: DailyMap, tier: DailyTier): DailyIssue[] {
  const issues = shapeIssues(map, tier);
  if (issues.some((issue) => issue.code === "LAYOUT_PARSE")) return issues;
  return [...issues, ...referenceIssues(map)];
}
