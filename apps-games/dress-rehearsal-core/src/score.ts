import { THREE_STAR_HARMONY } from "./constants";
import { harmony, harmonyTotal } from "./harmony";
import { checkRule, ruleChipText, ruleCode, ruleDetail } from "./rules";
import { isComplete, missingSlots, SLOT_ORDER, SLOT_SETS } from "./slots";
import type {
  ChallengeShape,
  LivePreview,
  Look,
  Piece,
  Rule,
  RuleResult,
  ScoreResult,
  SlotSetId,
  Stars,
} from "./types";

export type PieceSource = readonly Piece[] | ReadonlyMap<string, Piece>;

export function indexPieces(source: PieceSource): ReadonlyMap<string, Piece> {
  if (source instanceof Map) return source;
  const index = new Map<string, Piece>();
  for (const piece of source as readonly Piece[]) {
    if (!index.has(piece.id)) index.set(piece.id, piece);
  }
  return index;
}

export function sanitizeLook(set: SlotSetId, source: PieceSource, look: Look): Look {
  const index = indexPieces(source);
  const open = SLOT_SETS[set];
  const clean: Look = {};
  for (const slot of SLOT_ORDER) {
    const id = look[slot];
    if (id === undefined || !open.includes(slot)) continue;
    const piece = index.get(id);
    if (piece !== undefined && piece.category === slot) clean[slot] = id;
  }
  return clean;
}

export function lookPieces(look: Look, source: PieceSource): Piece[] {
  const index = indexPieces(source);
  const out: Piece[] = [];
  for (const slot of SLOT_ORDER) {
    const id = look[slot];
    const piece = id === undefined ? undefined : index.get(id);
    if (piece !== undefined) out.push(piece);
  }
  return out;
}

export function requiredMet(ruleCount: number): number {
  return Math.ceil(ruleCount / 2);
}

export function starsFor(
  ruleCount: number,
  metCount: number,
  harmonyPoints: number,
  complete: boolean,
): Stars {
  if (!complete || metCount < requiredMet(ruleCount)) return 0;
  if (metCount < ruleCount) return 1;
  return harmonyPoints >= THREE_STAR_HARMONY ? 3 : 2;
}

export function countMet(rules: readonly Rule[], pieces: readonly Piece[]): number {
  let met = 0;
  for (const rule of rules) if (checkRule(rule, pieces)) met += 1;
  return met;
}

export function quickStars(rules: readonly Rule[], pieces: readonly Piece[]): Stars {
  const met = countMet(rules, pieces);
  const points =
    met >= requiredMet(rules.length) && met === rules.length ? harmonyTotal(pieces) : 0;
  return starsFor(rules.length, met, points, true);
}

function ruleResults(
  rules: readonly Rule[],
  pieces: readonly Piece[],
  index: ReadonlyMap<string, Piece>,
): RuleResult[] {
  return rules.map((rule) => {
    const name =
      rule.kind === "include-piece" || rule.kind === "avoid-piece"
        ? index.get(rule.pieceId)?.name
        : undefined;
    return {
      rule,
      code: ruleCode(rule),
      met: checkRule(rule, pieces),
      chip: ruleChipText(rule, name),
      detail: ruleDetail(rule, pieces, name),
    };
  });
}

export function livePreview(
  challenge: ChallengeShape,
  source: PieceSource,
  look: Look,
): LivePreview {
  const index = indexPieces(source);
  const clean = sanitizeLook(challenge.slotSet, index, look);
  const pieces = lookPieces(clean, index);
  const rules = ruleResults(challenge.rules, pieces, index);
  return {
    complete: isComplete(challenge.slotSet, clean),
    missing: missingSlots(challenge.slotSet, clean),
    rules,
    metCount: rules.filter((result) => result.met).length,
    harmony: harmony(pieces),
  };
}

export function scoreLook(challenge: ChallengeShape, source: PieceSource, look: Look): ScoreResult {
  const preview = livePreview(challenge, source, look);
  const stars = starsFor(
    challenge.rules.length,
    preview.metCount,
    preview.harmony.total,
    preview.complete,
  );
  return { ...preview, stars };
}
