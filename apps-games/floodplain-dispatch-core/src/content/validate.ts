import { evaluate } from "../evaluate";
import { parseLayout } from "../layout";
import { checkPlacement, totalCost } from "../placement";
import { runSeason } from "../simulate";
import type { EventType, PieceKind, Placement } from "../types";
import type { CampaignMap, RegionId } from "./types";

export type MapIssueCode =
  | "LAYOUT_PARSE"
  | "SIZE_BOUNDS"
  | "WEEKS_BOUNDS"
  | "NO_INLET"
  | "NO_SEA"
  | "INLET_COUNT"
  | "INLET_HEIGHT"
  | "SEA_HEIGHT"
  | "HOUSE_KIND_COUNT"
  | "HOUSE_KIND_UNKNOWN"
  | "PIECE_GATING"
  | "EVENT_GATING"
  | "EVENT_RANGE"
  | "STORM_WITHOUT_TIDE"
  | "TIDE_REGION"
  | "TIDE_MISSING"
  | "BUDGET_RULE"
  | "NO_REFERENCE"
  | "GATE_WEEKS_MISSING"
  | "REFERENCE_ILLEGAL"
  | "REFERENCE_STARS"
  | "REFERENCE_COST"
  | "REDUNDANT_PIECE"
  | "EMPTY_CLEARS";

export type ContentIssueCode =
  | MapIssueCode
  | "DUPLICATE_ID"
  | "DUPLICATE_NAME"
  | "ID_ORDER"
  | "REGION_COUNT"
  | "TOTAL_MAPS"
  | "TOTAL_HOUSES"
  | "TOTAL_FIELDS"
  | "TOTAL_STARS";

export interface ContentIssue {
  code: ContentIssueCode;
  mapId: string;
  detail: string;
}

export const MIN_WIDTH = 8;
export const MAX_WIDTH = 12;
export const MIN_HEIGHT = 12;
export const MAX_HEIGHT_ROWS = 16;
export const MIN_WEEKS = 20;
export const MAX_WEEKS = 30;
export const BUDGET_SLACK = 3;
export const MAPS_PER_REGION = 10;
export const EXPECTED_MAPS = 40;
export const EXPECTED_HOUSES = 193;
export const EXPECTED_FIELDS = 133;
export const EXPECTED_STARS = 120;

export const HOUSE_KINDS = ["cottage", "townhouse", "mill", "barn", "school"] as const;

const REGION_ORDER: readonly RegionId[] = ["valley", "delta", "highland", "estuary"];
const REGION_PREFIX: Readonly<Record<RegionId, string>> = {
  valley: "v",
  delta: "d",
  highland: "h",
  estuary: "e",
};

export function mapOrdinal(id: string): number {
  const prefix = id.charAt(0);
  const region = REGION_ORDER.findIndex((entry) => REGION_PREFIX[entry] === prefix);
  const number = Number(id.slice(1));
  if (region < 0 || !Number.isInteger(number)) return -1;
  return region * MAPS_PER_REGION + number - 1;
}

const PIECE_FIRST_MAP: Readonly<Record<PieceKind, string>> = {
  canal: "v01",
  barrier: "v03",
  pump: "v06",
  gate: "d01",
  reservoir: "h01",
};

const EVENT_FIRST_MAP: Readonly<Record<EventType, string>> = {
  surge: "v04",
  drought: "h01",
  "storm-tide": "e01",
};

const TIDE_FIRST_MAP = "e01";

function issue(code: ContentIssueCode, mapId: string, detail: string): ContentIssue {
  return { code, mapId, detail };
}

function legalityIssues(map: CampaignMap): ContentIssue[] {
  const issues: ContentIssue[] = [];
  const placed: Placement[] = [];
  for (const piece of map.reference) {
    const error = checkPlacement(map, placed, piece);
    if (error)
      issues.push(
        issue("REFERENCE_ILLEGAL", map.id, `${piece.kind}@${piece.x},${piece.y}: ${error}`),
      );
    placed.push(piece);
  }
  for (const piece of map.reference) {
    const weeksMissing = piece.opensWeek === undefined || piece.closesWeek === undefined;
    if (piece.kind === "gate" && weeksMissing) {
      issues.push(issue("GATE_WEEKS_MISSING", map.id, `gate@${piece.x},${piece.y}`));
    }
  }
  return issues;
}

function solutionIssues(map: CampaignMap): ContentIssue[] {
  const issues: ContentIssue[] = [];
  const full = evaluate(map, runSeason(map, map.reference), map.reference);
  if (full.stars !== 3) issues.push(issue("REFERENCE_STARS", map.id, `stars ${full.stars}`));
  const cost = totalCost(map.reference);
  if (cost !== map.par)
    issues.push(issue("REFERENCE_COST", map.id, `cost ${cost}, par ${map.par}`));
  map.reference.forEach((piece, index) => {
    const rest = map.reference.filter((_, at) => at !== index);
    const stars = evaluate(map, runSeason(map, rest), rest).stars;
    if (stars === 3) {
      issues.push(issue("REDUNDANT_PIECE", map.id, `${piece.kind}@${piece.x},${piece.y}`));
    }
  });
  const empty = evaluate(map, runSeason(map, []), []);
  if (empty.cleared) issues.push(issue("EMPTY_CLEARS", map.id, `stars ${empty.stars}`));
  return issues;
}

export function validateMap(map: CampaignMap): ContentIssue[] {
  const parsed = parseLayout(map.layout);
  if (!parsed.ok) {
    const { code, row, column } = parsed.error;
    return [issue("LAYOUT_PARSE", map.id, `${code} at row ${row}, column ${column}`)];
  }
  const { width, height, kinds, heights } = parsed.layout;
  const ordinal = mapOrdinal(map.id);
  const issues: ContentIssue[] = [];
  if (width < MIN_WIDTH || width > MAX_WIDTH || height < MIN_HEIGHT || height > MAX_HEIGHT_ROWS) {
    issues.push(issue("SIZE_BOUNDS", map.id, `${width} x ${height}`));
  }
  if (!Number.isInteger(map.weeks) || map.weeks < MIN_WEEKS || map.weeks > MAX_WEEKS) {
    issues.push(issue("WEEKS_BOUNDS", map.id, `${map.weeks}`));
  }
  const inlets = kinds.filter((kind) => kind === "inlet").length;
  if (inlets < 1) issues.push(issue("NO_INLET", map.id, "no inlet cell"));
  if (!kinds.includes("sea")) issues.push(issue("NO_SEA", map.id, "no sea cell"));
  if (map.inlets.length !== inlets) {
    issues.push(issue("INLET_COUNT", map.id, `${map.inlets.length} rates for ${inlets} inlets`));
  }
  kinds.forEach((kind, index) => {
    const at = heights[index] as number;
    if (kind === "inlet" && (at < 4 || at > 7)) issues.push(issue("INLET_HEIGHT", map.id, `${at}`));
    if (kind === "sea" && at !== 0) issues.push(issue("SEA_HEIGHT", map.id, `${at}`));
  });
  const houses = kinds.filter((kind) => kind === "house").length;
  if (map.houseKinds.length !== houses) {
    issues.push(
      issue("HOUSE_KIND_COUNT", map.id, `${map.houseKinds.length} kinds for ${houses} houses`),
    );
  }
  for (const kind of map.houseKinds) {
    if (!(HOUSE_KINDS as readonly string[]).includes(kind)) {
      issues.push(issue("HOUSE_KIND_UNKNOWN", map.id, kind));
    }
  }
  for (const kind of map.pieces) {
    if (ordinal < mapOrdinal(PIECE_FIRST_MAP[kind]))
      issues.push(issue("PIECE_GATING", map.id, kind));
  }
  for (const event of map.events) {
    if (ordinal < mapOrdinal(EVENT_FIRST_MAP[event.type])) {
      issues.push(issue("EVENT_GATING", map.id, event.type));
    }
    const outOfRange = event.week < 0 || event.weeks < 1 || event.week + event.weeks > map.weeks;
    if (outOfRange || event.delta < 1) {
      issues.push(issue("EVENT_RANGE", map.id, `${event.type} wk${event.week} x${event.weeks}`));
    }
    if (event.type === "storm-tide" && !map.tide)
      issues.push(issue("STORM_WITHOUT_TIDE", map.id, ""));
  }
  if (map.tide && ordinal < mapOrdinal(TIDE_FIRST_MAP))
    issues.push(issue("TIDE_REGION", map.id, ""));
  if (map.region === "estuary" && !map.tide) issues.push(issue("TIDE_MISSING", map.id, ""));
  if (map.budget !== map.par + BUDGET_SLACK) {
    issues.push(issue("BUDGET_RULE", map.id, `budget ${map.budget}, par ${map.par}`));
  }
  if (map.reference.length === 0) {
    issues.push(issue("NO_REFERENCE", map.id, "empty reference"));
    return issues;
  }
  const legality = legalityIssues(map);
  issues.push(...legality);
  if (legality.some((entry) => entry.code === "REFERENCE_ILLEGAL")) return issues;
  return [...issues, ...solutionIssues(map)];
}

function totals(maps: readonly CampaignMap[]): { houses: number; fields: number } {
  let houses = 0;
  let fields = 0;
  for (const map of maps) {
    const parsed = parseLayout(map.layout);
    if (!parsed.ok) continue;
    houses += parsed.layout.kinds.filter((kind) => kind === "house").length;
    fields += parsed.layout.kinds.filter((kind) => kind === "field").length;
  }
  return { houses, fields };
}

function structureIssues(maps: readonly CampaignMap[]): ContentIssue[] {
  const issues: ContentIssue[] = [];
  const ids = new Set<string>();
  const names = new Set<string>();
  maps.forEach((map, index) => {
    if (ids.has(map.id)) issues.push(issue("DUPLICATE_ID", map.id, ""));
    if (names.has(map.name)) issues.push(issue("DUPLICATE_NAME", map.id, map.name));
    ids.add(map.id);
    names.add(map.name);
    if (mapOrdinal(map.id) !== index) issues.push(issue("ID_ORDER", map.id, `position ${index}`));
  });
  for (const region of REGION_ORDER) {
    const count = maps.filter((map) => map.region === region).length;
    if (count !== MAPS_PER_REGION) issues.push(issue("REGION_COUNT", region, `${count} maps`));
  }
  const { houses, fields } = totals(maps);
  if (maps.length !== EXPECTED_MAPS) issues.push(issue("TOTAL_MAPS", "all", `${maps.length}`));
  if (houses !== EXPECTED_HOUSES) issues.push(issue("TOTAL_HOUSES", "all", `${houses}`));
  if (fields !== EXPECTED_FIELDS) issues.push(issue("TOTAL_FIELDS", "all", `${fields}`));
  if (maps.length * 3 !== EXPECTED_STARS)
    issues.push(issue("TOTAL_STARS", "all", `${maps.length * 3}`));
  return issues;
}

export function validateMaps(maps: readonly CampaignMap[]): ContentIssue[] {
  return [...structureIssues(maps), ...maps.flatMap((map) => validateMap(map))];
}
