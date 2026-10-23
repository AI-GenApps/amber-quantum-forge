import { parseLayout } from "../layout";
import { DELTA_MAPS } from "./delta";
import { ESTUARY_MAPS } from "./estuary";
import { HIGHLAND_MAPS } from "./highland";
import type { CampaignMap, RegionDef, RegionId } from "./types";
import { VALLEY_MAPS } from "./valley";
import { validateMaps, type ContentIssue } from "./validate";

export const MAPS: readonly CampaignMap[] = [
  ...VALLEY_MAPS,
  ...DELTA_MAPS,
  ...HIGHLAND_MAPS,
  ...ESTUARY_MAPS,
];

export const MAP_BY_ID: ReadonlyMap<string, CampaignMap> = new Map(
  MAPS.map((map) => [map.id, map]),
);

const idsOf = (maps: readonly CampaignMap[]): string[] => maps.map((map) => map.id);

export const REGIONS: readonly RegionDef[] = [
  {
    id: "valley",
    name: "Valley",
    chapterTitle: "Chapter 1 - The Valley Season",
    mechanic: "Rain surges",
    unlockStars: 0,
    mapIds: idsOf(VALLEY_MAPS),
  },
  {
    id: "delta",
    name: "Delta",
    chapterTitle: "Chapter 2 - The Delta Gates",
    mechanic: "Sluice timing",
    unlockStars: 12,
    mapIds: idsOf(DELTA_MAPS),
  },
  {
    id: "highland",
    name: "Highland",
    chapterTitle: "Chapter 3 - The Highland Cisterns",
    mechanic: "Reservoirs and droughts",
    unlockStars: 33,
    mapIds: idsOf(HIGHLAND_MAPS),
  },
  {
    id: "estuary",
    name: "Estuary",
    chapterTitle: "Chapter 4 - The Estuary Tides",
    mechanic: "Tides and storm tides",
    unlockStars: 60,
    mapIds: idsOf(ESTUARY_MAPS),
  },
];

function countCells(kind: string): number {
  let total = 0;
  for (const map of MAPS) {
    const parsed = parseLayout(map.layout);
    if (parsed.ok) total += parsed.layout.kinds.filter((entry) => entry === kind).length;
  }
  return total;
}

export const TOTAL_STARS = MAPS.length * 3;
export const TOTAL_HOUSES = countCells("house");
export const TOTAL_FIELDS = countCells("field");

export function findMap(id: string): CampaignMap | undefined {
  return MAP_BY_ID.get(id);
}

export function getMap(id: string): CampaignMap {
  const map = MAP_BY_ID.get(id);
  if (!map) throw new Error(`Unknown map id: ${id}`);
  return map;
}

export function nextMapId(id: string): string | null {
  const index = MAPS.findIndex((map) => map.id === id);
  if (index < 0) throw new Error(`Unknown map id: ${id}`);
  const next = MAPS[index + 1];
  return next ? next.id : null;
}

export function regionOf(id: string): RegionDef {
  const region: RegionId = getMap(id).region;
  const found = REGIONS.find((entry) => entry.id === region);
  if (!found) throw new Error(`Unknown region: ${region}`);
  return found;
}

export function validateContent(): ContentIssue[] {
  return validateMaps(MAPS);
}
