import { analyseCase } from "../analyse";
import type { CaseIssue, CaseIssueCode, Person } from "../types";
import { STREETS } from "./places";
import {
  allTermsOfDeductionValues,
  containsPhrase,
  firstHit,
  hasBadCharset,
  hasPlaceholder,
  isBlank,
  isOneSentence,
  separatingTerms,
  tradeWordsIn,
} from "./text-rules";
import {
  CAPTION_MAX,
  CLUE_TEXT_MAX,
  CLUE_TEXT_MIN,
  HOTSPOT_GAP,
  HOTSPOT_MAX,
  HOTSPOT_MIN,
  LABEL_MAX,
  OBJECTS_IN_FINAL_CASE,
  OBJECTS_PER_CASE,
  PAIR_FIRST_CASE,
  REVEAL_MAX,
  REVEAL_MIN,
  RULE_OUT_FIRST_CASE,
  TOTAL_CASES,
} from "./totals";
import type { CaseContent, ClueContent } from "./types";
import { GLYPH_KINDS } from "./types";

export type ContentIssueCode =
  | CaseIssueCode
  | "BAD_CASE_ID"
  | "CHAPTER_MISMATCH"
  | "OWNER_MISMATCH"
  | "BAD_DIFFICULTY"
  | "BAD_PAR"
  | "OBJECT_COUNT"
  | "EMPTY_TEXT"
  | "TEXT_CHARSET"
  | "TEXT_PLACEHOLDER"
  | "CLUE_TEXT_LENGTH"
  | "CLUE_TEXT_SENTENCES"
  | "CAPTION_LENGTH"
  | "REVEAL_LENGTH"
  | "REVEAL_MISSING_OWNER"
  | "LABEL_LENGTH"
  | "LABEL_LEAK"
  | "HOTSPOT_MISSING"
  | "HOTSPOT_UNEXPECTED"
  | "HOTSPOT_BOUNDS"
  | "HOTSPOT_CLOSE"
  | "ART_SLOT"
  | "GLYPH_INVALID"
  | "FLAVOUR_KEYWORD_LEAK"
  | "OBJECT_KEYWORD_LEAK"
  | "TRADE_WORD"
  | "NAMES_PERSON"
  | "MECHANIC_GATING"
  | "TOTAL_MISMATCH"
  | "DUPLICATE_ID"
  | "DUPLICATE_TITLE"
  | "DUPLICATE_SLUG"
  | "DUPLICATE_CLUE_TEXT"
  | "DUPLICATE_CAPTION"
  | "DUPLICATE_REVEAL"
  | "CASE_ORDER"
  | "CHAPTER_CASES"
  | "CHAPTER_UNLOCK"
  | "VALUE_HOLDERS"
  | "PERSON_OWNERSHIP"
  | "PERSON_APPEARANCES"
  | "PLACE_MISMATCH"
  | "LEDGER_MISMATCH"
  | "ACHIEVEMENT_MISMATCH"
  | "THEME_MISMATCH"
  | "CARD_MISMATCH"
  | "TUTORIAL_MISMATCH"
  | "ALMANAC_MISMATCH";

export interface ContentIssue {
  code: ContentIssueCode;
  caseId: string;
  subjectId: string;
}

export function expectedArtSlot(objectId: string): string {
  return objectId === "01-1" ? "evidence-postcard" : `evidence-${objectId}`;
}

function distance(a: ClueContent, b: ClueContent): number {
  const dx = (a.hotspot?.x ?? 0) - (b.hotspot?.x ?? 0);
  const dy = (a.hotspot?.y ?? 0) - (b.hotspot?.y ?? 0);
  return Math.hypot(dx, dy);
}

function nameVariants(people: readonly Person[]): string[] {
  return people.flatMap((person) => [person.name, person.name.split(" ")[0] ?? person.name]);
}

export function validateCase(def: CaseContent, people: readonly Person[]): ContentIssue[] {
  const issues: ContentIssue[] = analyseCase(def, people).map((item: CaseIssue) => ({
    code: item.code,
    caseId: item.caseId,
    subjectId: item.subjectId,
  }));
  const add = (code: ContentIssueCode, subjectId: string) =>
    issues.push({ code, caseId: def.id, subjectId });
  const number = Number(def.id);
  const owner = people.find((person) => person.id === def.ownerId);
  const names = nameVariants(people);

  if (!/^\d\d$/.test(def.id) || number < 1 || number > TOTAL_CASES) add("BAD_CASE_ID", def.id);
  if (def.chapter !== Math.ceil(number / 4)) add("CHAPTER_MISMATCH", def.id);
  if (def.ownerId !== `p${def.id}`) add("OWNER_MISMATCH", def.ownerId);
  if (!Number.isInteger(def.difficulty) || def.difficulty < 1 || def.difficulty > 5) {
    add("BAD_DIFFICULTY", def.id);
  }
  if (!Number.isInteger(def.parMinutes) || def.parMinutes < 1) add("BAD_PAR", def.id);

  const expectedObjects = number === TOTAL_CASES ? OBJECTS_IN_FINAL_CASE : OBJECTS_PER_CASE;
  if (def.objects.length !== expectedObjects) add("OBJECT_COUNT", def.id);

  const strings: [string, string][] = [
    [def.id, def.title],
    [def.id, def.slug],
    [def.id, def.foundAt],
    [def.id, def.labelText],
    [def.id, def.place],
    [def.id, def.reveal],
    [def.id, def.ledgerTitle],
    ...def.objects.flatMap((item): [string, string][] => [
      [item.id, item.name],
      [item.id, item.caption],
    ]),
    ...def.clues.flatMap((item): [string, string][] => [
      [item.id, item.tag],
      [item.id, item.text],
    ]),
  ];
  for (const [subjectId, text] of strings) {
    if (isBlank(text)) add("EMPTY_TEXT", subjectId);
    else if (hasBadCharset(text)) add("TEXT_CHARSET", subjectId);
    if (hasPlaceholder(text)) add("TEXT_PLACEHOLDER", subjectId);
  }

  if (def.labelText.length > LABEL_MAX) add("LABEL_LENGTH", def.id);
  const streetNames = STREETS.map((street) => street.name);
  if (firstHit(def.labelText, [...streetNames, ...names]) !== undefined) add("LABEL_LEAK", def.id);
  if (def.reveal.length < REVEAL_MIN || def.reveal.length > REVEAL_MAX) {
    add("REVEAL_LENGTH", def.id);
  }
  if (owner === undefined || !def.reveal.includes(owner.name)) {
    add("REVEAL_MISSING_OWNER", def.id);
  }

  const hygiene = separatingTerms(def, people);
  const leadClueIds = def.deductions.flatMap((item) => item.clueIds);
  const leadObjectIds = def.clues
    .filter((item) => leadClueIds.includes(item.id))
    .map((item) => item.objectId);

  for (const item of def.objects) {
    if (item.artSlot !== expectedArtSlot(item.id)) add("ART_SLOT", item.id);
    if (!GLYPH_KINDS.includes(item.glyph)) add("GLYPH_INVALID", item.id);
    if (item.caption.length > CAPTION_MAX) add("CAPTION_LENGTH", item.id);
    if (tradeWordsIn(item.caption).length > 0) add("TRADE_WORD", item.id);
    if (firstHit(`${item.name} ${item.caption}`, names) !== undefined) {
      add("NAMES_PERSON", item.id);
    }
    if (
      !leadObjectIds.includes(item.id) &&
      firstHit(`${item.name} ${item.caption}`, hygiene) !== undefined
    ) {
      add("OBJECT_KEYWORD_LEAK", item.id);
    }
  }

  for (const item of def.clues) {
    if (item.text.length < CLUE_TEXT_MIN || item.text.length > CLUE_TEXT_MAX) {
      add("CLUE_TEXT_LENGTH", item.id);
    }
    if (!isOneSentence(item.text)) add("CLUE_TEXT_SENTENCES", item.id);
    if (tradeWordsIn(`${item.tag} ${item.text}`).length > 0) add("TRADE_WORD", item.id);
    if (firstHit(`${item.tag} ${item.text}`, names) !== undefined) add("NAMES_PERSON", item.id);
    if (item.flavour === true && firstHit(`${item.tag} ${item.text}`, hygiene) !== undefined) {
      add("FLAVOUR_KEYWORD_LEAK", item.id);
    }
    if (item.face === "zoom") {
      const spot = item.hotspot;
      if (spot === undefined) add("HOTSPOT_MISSING", item.id);
      else if (
        spot.x < HOTSPOT_MIN ||
        spot.x > HOTSPOT_MAX ||
        spot.y < HOTSPOT_MIN ||
        spot.y > HOTSPOT_MAX
      ) {
        add("HOTSPOT_BOUNDS", item.id);
      }
    } else if (item.hotspot !== undefined) {
      add("HOTSPOT_UNEXPECTED", item.id);
    }
  }

  const zooms = def.clues.filter((item) => item.face === "zoom" && item.hotspot !== undefined);
  for (const item of zooms) {
    const near = zooms.find(
      (other) =>
        other.id > item.id && other.objectId === item.objectId && distance(item, other) < HOTSPOT_GAP,
    );
    if (near !== undefined) add("HOTSPOT_CLOSE", near.id);
  }

  for (const item of def.deductions) {
    if (item.kind === "pair" && number < PAIR_FIRST_CASE) add("MECHANIC_GATING", item.id);
    if (item.kind === "rule-out" && number < RULE_OUT_FIRST_CASE) add("MECHANIC_GATING", item.id);
  }
  return issues;
}

export function revealUsesVocabulary(def: CaseContent): boolean {
  const terms = allTermsOfDeductionValues(def);
  return terms.some((term) => containsPhrase(def.reveal, term));
}
