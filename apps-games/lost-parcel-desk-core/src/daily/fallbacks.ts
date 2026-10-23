import type { FacetId } from "../types";
import { tierFor } from "./tiers";
import type { DailyPlan } from "./types";

type Spec = readonly [
  owner: string,
  x: string,
  y: string,
  candidates: string,
  facets: string,
  sides: string,
  flavour: readonly number[],
  order: string,
  faces: string,
];

export const FALLBACK_SPECS: readonly (readonly [Spec, Spec])[] = [
  [
    ["p07", "p05", "p12", "p12 p07 p05", "look street", "01", [9], "210", "fbf"],
    ["p08", "p05", "p01", "p01 p08 p05", "pet pastime", "11", [7], "102", "ffb"],
  ],
  [
    ["p08", "p05", "p02", "p05 p08 p02", "street pastime", "00", [5], "210", "ffb"],
    ["p02", "p07", "p08", "p02 p07 p08", "street pastime", "10", [8], "102", "bff"],
  ],
  [
    ["p12", "p10", "p07", "p12 p07 p10", "look pet", "11", [0, 11], "1032", "ffbb"],
    ["p01", "p10", "p08", "p01 p08 p10", "pet look", "10", [10, 2], "3102", "bbbb"],
  ],
  [
    ["p01", "p05", "p06", "p06 p01 p05", "pastime street", "10", [4, 6], "0213", "bbfb"],
    ["p03", "p04", "p07", "p07 p03 p04", "pet look", "00", [5, 1], "1032", "bbfb"],
  ],
  [
    ["p07", "p03", "p12", "p03 p07 p12", "look pastime", "01", [0, 10], "0213", "bfff"],
    ["p08", "p07", "p11", "p07 p11 p08", "look pet", "01", [4, 5], "3021", "bffb"],
  ],
  [
    ["p07", "p10", "p12", "p10 p12 p07", "look pastime", "10", [9, 2, 11], "31204", "bfbff"],
    ["p02", "p11", "p05", "p02 p11 p05", "look pet", "10", [6, 2, 10], "21340", "bfbbb"],
  ],
  [
    ["p02", "p07", "p09", "p07 p09 p02", "look pet", "11", [6, 1, 10], "43210", "fbbbb"],
    ["p09", "p07", "p05", "p07 p09 p05", "look pastime", "10", [3, 5, 1], "03241", "fbbff"],
  ],
];

function toPlan(spec: Spec, weekday: number): DailyPlan {
  const [owner, x, y, candidates, facets, sides, flavour, order, faces] = spec;
  const kinds = tierFor(weekday).kinds;
  const [f1, f2] = facets.split(" ") as [FacetId, FacetId];
  return {
    ownerId: owner,
    xId: x,
    yId: y,
    candidateIds: candidates.split(" ") as [string, string, string],
    facets: [f1, f2],
    kinds: [kinds[0], kinds[1]],
    sides: [sides[0] === "1" ? 1 : 0, sides[1] === "1" ? 1 : 0],
    flavour: [...flavour],
    order: order.split("").map(Number),
    faces: faces.split("").map((face) => (face === "f" ? "front" : "back")),
  };
}

export function fallbackPlan(seed: number, weekday: number): DailyPlan {
  const day = ((weekday % 7) + 7) % 7;
  const pair = FALLBACK_SPECS[day];
  const spec = pair?.[(seed >>> 0) % 2];
  if (spec === undefined) throw new Error(`no fallback template for weekday ${day}`);
  return toPlan(spec, day);
}
