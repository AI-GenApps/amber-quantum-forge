import { enumerateLooks } from "../enumerate";
import { parseRuleCode, RuleCodeError, ruleCode } from "../rules";
import { indexPieces, lookPieces, quickStars, scoreLook } from "../score";
import { missingSlots, SLOT_ORDER, SLOT_SETS } from "../slots";
import type { Look, Piece, Slot } from "../types";
import { BRIEF_MAX_LENGTH } from "./text";
import type { ChallengeDef } from "./types";

export type ContentIssueCode =
  | "UNKNOWN_SLOT_SET"
  | "SLOT_COUNT"
  | "RULE_COUNT"
  | "BAD_RULE_ARGUMENT"
  | "UNKNOWN_PIECE"
  | "BRIEF_EMPTY"
  | "BRIEF_TOO_LONG"
  | "REFERENCE_ILLEGAL"
  | "REFERENCE_INCOMPLETE"
  | "REFERENCE_NOT_THREE_STARS"
  | "EMPTY_BOARD_SCORES"
  | "TOO_FEW_THREE_STAR"
  | "THREE_STAR_SHARE"
  | "RULE_BEFORE_CARD"
  | "CARD_COUNT"
  | "CARD_UNKNOWN_CHALLENGE"
  | "CARD_KIND_COVERAGE"
  | "DUPLICATE_ID"
  | "DUPLICATE_NAME"
  | "ID_ORDER"
  | "CHALLENGE_COUNT"
  | "CHAPTER_COUNT"
  | "CHAPTER_CHALLENGE_COUNT"
  | "CHAPTER_UNLOCK"
  | "CHAPTER_FIELD"
  | "PIECE_COUNT"
  | "THEME_PIECE_COUNT"
  | "CATEGORY_COUNT"
  | "BAD_PIECE_TAG"
  | "CLIENT_COUNT"
  | "CLIENT_CHALLENGE_COUNT"
  | "CLIENT_LINES"
  | "CLIENT_LINE_TOO_LONG"
  | "UNKNOWN_CLIENT"
  | "TOTAL_STARS"
  | "TEXT_CHARSET"
  | "TEXT_PLACEHOLDER";

export interface ContentIssue {
  readonly code: ContentIssueCode;
  readonly subject: string;
  readonly message: string;
}

export interface ProofResult {
  readonly looks: number;
  readonly threeStar: number;
  readonly sharePercent: number;
}

export type SlotSetTable = Readonly<Record<string, readonly Slot[]>>;

export interface ValidateChallengeOptions {
  readonly slotSets?: SlotSetTable;
  readonly proof?: ProofResult;
}

export const MIN_SLOTS = 6;
export const MAX_SLOTS = 8;
export const MIN_RULES = 2;
export const MAX_RULES = 4;
export const MIN_THREE_STAR_LOOKS = 2;
export const THREE_STAR_SHARE_CAP_PERCENT: readonly number[] = [35, 35, 5, 2, 2, 2];

export function issue(code: ContentIssueCode, subject: string, message: string): ContentIssue {
  return { code, subject, message };
}

export function proveChallenge(def: ChallengeDef, closet: readonly Piece[]): ProofResult {
  const index = indexPieces(closet);
  let looks = 0;
  let threeStar = 0;
  for (const look of enumerateLooks(def.slotSet, closet)) {
    looks += 1;
    if (quickStars(def.rules, lookPieces(look, index)) === 3) threeStar += 1;
  }
  const sharePercent = looks === 0 ? 0 : (threeStar / looks) * 100;
  return { looks, threeStar, sharePercent };
}

function ruleIssues(def: ChallengeDef, closet: readonly Piece[]): ContentIssue[] {
  const out: ContentIssue[] = [];
  const ids = new Set(closet.map((piece) => piece.id));
  for (const rule of def.rules) {
    try {
      parseRuleCode(ruleCode(rule));
    } catch (error) {
      if (!(error instanceof RuleCodeError)) throw error;
      out.push(issue("BAD_RULE_ARGUMENT", def.id, error.message));
      continue;
    }
    if (
      (rule.kind === "include-piece" || rule.kind === "avoid-piece") &&
      !ids.has(rule.pieceId)
    ) {
      out.push(issue("UNKNOWN_PIECE", def.id, `${rule.kind} names ${rule.pieceId}`));
    }
  }
  return out;
}

function referenceIssues(def: ChallengeDef, closet: readonly Piece[]): ContentIssue[] {
  const index = indexPieces(closet);
  const open = SLOT_SETS[def.slotSet];
  const problems: string[] = [];
  for (const slot of SLOT_ORDER) {
    const id = def.reference[slot];
    if (id === undefined) continue;
    const piece = index.get(id);
    if (!open.includes(slot)) problems.push(`${slot} is closed`);
    else if (piece === undefined) problems.push(`${id} is not in the closet`);
    else if (piece.category !== slot) problems.push(`${id} is not a ${slot}`);
  }
  const ref: Look = def.reference;
  if (
    open.includes("dress") &&
    open.includes("top") &&
    open.includes("bottom") &&
    ref.dress !== undefined &&
    (ref.top !== undefined || ref.bottom !== undefined)
  ) {
    problems.push("dress together with top or bottom");
  }
  if (problems.length > 0) return [issue("REFERENCE_ILLEGAL", def.id, problems.join("; "))];
  const missing = missingSlots(def.slotSet, ref);
  if (missing.length > 0) {
    return [issue("REFERENCE_INCOMPLETE", def.id, `missing ${missing.join(", ")}`)];
  }
  const result = scoreLook(def, closet, ref);
  if (result.stars !== 3) {
    return [
      issue(
        "REFERENCE_NOT_THREE_STARS",
        def.id,
        `${result.stars} stars, ${result.metCount} of ${def.rules.length} rules, harmony ${result.harmony.total}`,
      ),
    ];
  }
  return [];
}

function proofIssues(def: ChallengeDef, proof: ProofResult): ContentIssue[] {
  const out: ContentIssue[] = [];
  if (proof.threeStar < MIN_THREE_STAR_LOOKS) {
    out.push(issue("TOO_FEW_THREE_STAR", def.id, `${proof.threeStar} three-star looks`));
  }
  const cap =
    THREE_STAR_SHARE_CAP_PERCENT[Math.min(def.chapterIndex, THREE_STAR_SHARE_CAP_PERCENT.length - 1)];
  if (cap !== undefined && proof.sharePercent > cap) {
    out.push(
      issue("THREE_STAR_SHARE", def.id, `${proof.sharePercent.toFixed(2)} percent, cap ${cap}`),
    );
  }
  return out;
}

export function validateChallenge(
  def: ChallengeDef,
  closet: readonly Piece[],
  options: ValidateChallengeOptions = {},
): ContentIssue[] {
  const out: ContentIssue[] = [];
  const slots = (options.slotSets ?? SLOT_SETS)[def.slotSet];
  if (slots === undefined) {
    return [issue("UNKNOWN_SLOT_SET", def.id, `slot set ${def.slotSet}`)];
  }
  if (slots.length < MIN_SLOTS || slots.length > MAX_SLOTS) {
    out.push(issue("SLOT_COUNT", def.id, `${slots.length} slots`));
  }
  if (def.rules.length < MIN_RULES || def.rules.length > MAX_RULES) {
    out.push(issue("RULE_COUNT", def.id, `${def.rules.length} rules`));
  }
  out.push(...ruleIssues(def, closet));
  if (def.brief.trim() === "") out.push(issue("BRIEF_EMPTY", def.id, "empty brief"));
  else if (def.brief.length > BRIEF_MAX_LENGTH) {
    out.push(issue("BRIEF_TOO_LONG", def.id, `${def.brief.length} characters`));
  }
  if (!(def.slotSet in SLOT_SETS)) return out;
  out.push(...referenceIssues(def, closet));
  if (scoreLook(def, closet, {}).stars !== 0) {
    out.push(issue("EMPTY_BOARD_SCORES", def.id, "the empty board earns stars"));
  }
  if (options.proof !== undefined) out.push(...proofIssues(def, options.proof));
  return out;
}
