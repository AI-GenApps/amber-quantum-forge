import {
  DRESS_CODE_POINTS,
  ERA_POINTS,
  HARMONY_PART_NAMES,
  HARMONY_WEIGHTS,
  HUE_WHEEL,
  SCHEME_POINTS,
  SEASON_POINTS,
} from "./constants";
import { chromaticColours, eraIndex, hueIndex, isChromatic } from "./rules";
import type {
  ChromaticColour,
  HarmonyPart,
  HarmonyPartId,
  HarmonyResult,
  Piece,
  SchemeName,
} from "./types";

const WHEEL_SIZE = HUE_WHEEL.length;

export function hueDistance(a: ChromaticColour, b: ChromaticColour): number {
  const gap = Math.abs(hueIndex(a) - hueIndex(b));
  return Math.min(gap, WHEEL_SIZE - gap);
}

function stepWord(steps: number): string {
  return steps === 1 ? "1 step" : `${steps} steps`;
}

function schemeNameOf(hues: readonly ChromaticColour[]): SchemeName {
  const [first, second, third] = hues;
  if (first === undefined) return "Neutral";
  if (second === undefined) return "Tonal";
  if (third === undefined) {
    const gap = hueDistance(first, second);
    if (gap <= 2) return "Analogous";
    if (gap === 6) return "Complementary";
    if (gap === 4) return "Triad pair";
    return "Awkward pair";
  }
  if (hues.length === 3) {
    const gaps = [
      hueDistance(first, second),
      hueDistance(first, third),
      hueDistance(second, third),
    ];
    if (gaps.every((gap) => gap === 4)) return "Triadic";
    if (Math.max(...gaps) <= 3) return "Analogous trio";
    return "Busy";
  }
  return "Too many colours";
}

function schemeReason(name: SchemeName, hues: readonly ChromaticColour[]): string {
  const [first, second] = hues;
  if (first === undefined) return "Neutral: no colours to clash";
  if (second === undefined) return `Tonal: one colour (${first})`;
  if (hues.length === 2) {
    return `${name}: ${first} and ${second} are ${stepWord(hueDistance(first, second))} apart`;
  }
  if (name === "Too many colours") return `${name}: ${hues.length} in one look`;
  if (name === "Busy") return `${name}: ${hues.join(", ")} do not sit together`;
  return `${name}: ${hues.join(", ")}`;
}

function spread(values: readonly number[]): number {
  return Math.max(...values) - Math.min(...values);
}

function tableLookup(table: readonly number[], index: number): number {
  return table[index] ?? 0;
}

function part(id: HarmonyPartId, points: number, reason: string): HarmonyPart {
  return { id, name: HARMONY_PART_NAMES[id], points, max: HARMONY_WEIGHTS[id], reason };
}

function emptyHarmony(): HarmonyResult {
  const ids: readonly HarmonyPartId[] = ["scheme", "anchor", "dressCode", "era", "season"];
  return {
    total: 0,
    scheme: null,
    parts: ids.map((id) => part(id, 0, "No pieces yet")),
  };
}

export function harmony(pieces: readonly Piece[]): HarmonyResult {
  if (pieces.length === 0) return emptyHarmony();
  const hues = chromaticColours(pieces);
  const scheme = schemeNameOf(hues);
  const hasNeutral = pieces.some((piece) => !isChromatic(piece.colour));
  const formalities = pieces.map((piece) => piece.formality);
  const eras = pieces.map((piece) => eraIndex(piece.era));
  const warmths = pieces.map((piece) => piece.warmth);
  const formalitySpread = spread(formalities);
  const eraSpread = spread(eras);
  const warmthSpread = spread(warmths);
  const parts: HarmonyPart[] = [
    part("scheme", SCHEME_POINTS[scheme], schemeReason(scheme, hues)),
    part(
      "anchor",
      hasNeutral ? HARMONY_WEIGHTS.anchor : 0,
      hasNeutral ? "A neutral piece anchors the look" : "No neutral piece to anchor the look",
    ),
    part(
      "dressCode",
      tableLookup(DRESS_CODE_POINTS, formalitySpread),
      `Formality runs from ${Math.min(...formalities)} to ${Math.max(...formalities)} (spread ${formalitySpread})`,
    ),
    part(
      "era",
      tableLookup(ERA_POINTS, eraSpread),
      `Eras span ${eraSpread} ${eraSpread === 1 ? "step" : "steps"}`,
    ),
    part(
      "season",
      tableLookup(SEASON_POINTS, warmthSpread),
      `Warmth runs from ${Math.min(...warmths)} to ${Math.max(...warmths)} (spread ${warmthSpread})`,
    ),
  ];
  let total = 0;
  for (const entry of parts) total += entry.points;
  return { total, scheme, parts };
}

export function harmonyTotal(pieces: readonly Piece[]): number {
  if (pieces.length === 0) return 0;
  let total = SCHEME_POINTS[schemeNameOf(chromaticColours(pieces))];
  let hasNeutral = false;
  let formalityLow = Number.POSITIVE_INFINITY;
  let formalityHigh = Number.NEGATIVE_INFINITY;
  let eraLow = Number.POSITIVE_INFINITY;
  let eraHigh = Number.NEGATIVE_INFINITY;
  let warmthLow = Number.POSITIVE_INFINITY;
  let warmthHigh = Number.NEGATIVE_INFINITY;
  for (const piece of pieces) {
    if (!isChromatic(piece.colour)) hasNeutral = true;
    formalityLow = Math.min(formalityLow, piece.formality);
    formalityHigh = Math.max(formalityHigh, piece.formality);
    const era = eraIndex(piece.era);
    eraLow = Math.min(eraLow, era);
    eraHigh = Math.max(eraHigh, era);
    warmthLow = Math.min(warmthLow, piece.warmth);
    warmthHigh = Math.max(warmthHigh, piece.warmth);
  }
  if (hasNeutral) total += HARMONY_WEIGHTS.anchor;
  total += tableLookup(DRESS_CODE_POINTS, formalityHigh - formalityLow);
  total += tableLookup(ERA_POINTS, eraHigh - eraLow);
  total += tableLookup(SEASON_POINTS, warmthHigh - warmthLow);
  return total;
}
