import { ALL_COLOURS, CATEGORIES, ERA_ORDER, FEATURES, RULE_KINDS } from "../constants";
import { hasOnePieceRule } from "../slots";
import type { Category, Piece } from "../types";
import { CHAPTERS } from "./chapters";
import { RULE_CARDS } from "./cards";
import { CHALLENGES } from "./challenges";
import { CLIENTS } from "./clients";
import { closetFor, PIECES } from "./pieces";
import {
  CLIENT_LINE_MAX_LENGTH,
  collectContentText,
  hasPlaceholderText,
  outsideFontSubset,
} from "./text";
import type { ChallengeDef, ChapterDef, ClientDef, ContentSet, RuleCard } from "./types";
import { THEME_IDS } from "./types";
import {
  type ContentIssue,
  issue,
  type ProofResult,
  type ValidateChallengeOptions,
  validateChallenge,
} from "./validate";

export const EXPECTED_CHALLENGE_COUNTS: readonly number[] = [7, 7, 7, 7, 6, 6];
export const EXPECTED_UNLOCK_STARS: readonly number[] = [0, 0, 12, 27, 45, 66];
export const EXPECTED_CLIENT_CHALLENGES: readonly number[] = [7, 7, 7, 7, 6, 6];
export const EXPECTED_CATEGORY_COUNTS: Readonly<Record<Category, number>> = {
  top: 8,
  bottom: 7,
  dress: 5,
  outer: 6,
  shoes: 6,
  bag: 6,
  hat: 4,
  accessory: 6,
};
export const PIECES_PER_THEME = 8;
export const LINES_PER_CLIENT = 8;
export const EXPECTED_STARS = 120;
export const CHALLENGE_ID_PREFIXES: readonly string[] = ["riv", "rai", "gal", "mtn", "stu", "vin"];
export const EXPECTED_RULE_CARDS = 9;

export interface ValidateContentOptions extends Partial<ContentSet> {
  readonly proofs?: ReadonlyMap<string, ProofResult>;
  readonly text?: boolean;
}

function duplicates(values: readonly string[]): string[] {
  const seen = new Set<string>();
  const dup = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) dup.add(value);
    seen.add(value);
  }
  return [...dup];
}

export function validatePieces(pieces: readonly Piece[]): ContentIssue[] {
  const out: ContentIssue[] = [];
  if (pieces.length !== THEME_IDS.length * PIECES_PER_THEME) {
    out.push(issue("PIECE_COUNT", "pieces", `${pieces.length} pieces`));
  }
  for (const id of duplicates(pieces.map((piece) => piece.id))) {
    out.push(issue("DUPLICATE_ID", id, "duplicate piece id"));
  }
  for (const name of duplicates(pieces.map((piece) => piece.name))) {
    out.push(issue("DUPLICATE_NAME", name, "duplicate piece name"));
  }
  THEME_IDS.forEach((theme, themeIndex) => {
    const own = pieces.slice(themeIndex * PIECES_PER_THEME, (themeIndex + 1) * PIECES_PER_THEME);
    const wanted = Array.from(
      { length: PIECES_PER_THEME },
      (_, n) => `item-${theme}-${n + 1}`,
    );
    if (own.length !== PIECES_PER_THEME || own.some((piece, n) => piece.id !== wanted[n])) {
      out.push(issue("THEME_PIECE_COUNT", theme, `expected ${wanted.join(", ")}`));
    }
  });
  for (const category of CATEGORIES) {
    const count = pieces.filter((piece) => piece.category === category).length;
    if (count !== EXPECTED_CATEGORY_COUNTS[category]) {
      out.push(issue("CATEGORY_COUNT", category, `${count} pieces`));
    }
  }
  for (const piece of pieces) {
    const bad: string[] = [];
    if (piece.name.trim() === "") bad.push("name");
    if (!Number.isInteger(piece.formality) || piece.formality < 1 || piece.formality > 5) {
      bad.push("formality");
    }
    if (!Number.isInteger(piece.warmth) || piece.warmth < 0 || piece.warmth > 3) bad.push("warmth");
    if (!Number.isInteger(piece.price) || piece.price <= 0) bad.push("price");
    if (!ALL_COLOURS.includes(piece.colour)) bad.push("colour");
    if (!ERA_ORDER.includes(piece.era)) bad.push("era");
    if (!CATEGORIES.includes(piece.category)) bad.push("category");
    if (piece.features.some((feature) => !FEATURES.includes(feature))) bad.push("features");
    if (bad.length > 0) out.push(issue("BAD_PIECE_TAG", piece.id, bad.join(", ")));
  }
  return out;
}

export function validateClients(
  clients: readonly ClientDef[],
  challenges: readonly ChallengeDef[],
): ContentIssue[] {
  const out: ContentIssue[] = [];
  if (clients.length !== EXPECTED_CLIENT_CHALLENGES.length) {
    out.push(issue("CLIENT_COUNT", "clients", `${clients.length} clients`));
  }
  for (const id of duplicates(clients.map((client) => client.id))) {
    out.push(issue("DUPLICATE_ID", id, "duplicate client id"));
  }
  for (const name of duplicates(clients.map((client) => client.name))) {
    out.push(issue("DUPLICATE_NAME", name, "duplicate client name"));
  }
  clients.forEach((client, position) => {
    const lines = Object.values(client.lines);
    if (lines.length !== LINES_PER_CLIENT || lines.some((line) => line.trim() === "")) {
      out.push(issue("CLIENT_LINES", client.id, `${lines.length} lines`));
    }
    for (const line of lines) {
      if (line.length > CLIENT_LINE_MAX_LENGTH) {
        out.push(issue("CLIENT_LINE_TOO_LONG", client.id, `${line.length} characters`));
      }
    }
    const count = challenges.filter((def) => def.clientId === client.id).length;
    const wanted = EXPECTED_CLIENT_CHALLENGES[position];
    if (count !== wanted) {
      out.push(issue("CLIENT_CHALLENGE_COUNT", client.id, `${count} challenges, expected ${wanted}`));
    }
  });
  const known = new Set(clients.map((client) => client.id));
  for (const def of challenges) {
    if (!known.has(def.clientId)) out.push(issue("UNKNOWN_CLIENT", def.id, def.clientId));
  }
  return out;
}

export function validateChapters(
  chapters: readonly ChapterDef[],
  challenges: readonly ChallengeDef[],
): ContentIssue[] {
  const out: ContentIssue[] = [];
  if (chapters.length !== EXPECTED_UNLOCK_STARS.length) {
    out.push(issue("CHAPTER_COUNT", "chapters", `${chapters.length} chapters`));
  }
  chapters.forEach((chapter, position) => {
    if (chapter.unlockStars !== EXPECTED_UNLOCK_STARS[position]) {
      out.push(issue("CHAPTER_UNLOCK", chapter.themeId, `${chapter.unlockStars} stars`));
    }
    const count = challenges.filter((def) => def.chapterIndex === position).length;
    if (count !== EXPECTED_CHALLENGE_COUNTS[position]) {
      out.push(issue("CHAPTER_CHALLENGE_COUNT", chapter.themeId, `${count} challenges`));
    }
    const fields = [chapter.title, chapter.chapterTitle, chapter.intro, chapter.outro];
    const bad =
      chapter.index !== position ||
      chapter.themeId !== THEME_IDS[position] ||
      !/^#[0-9a-f]{6}$/i.test(chapter.accent) ||
      fields.some((field) => field.trim() === "");
    if (bad) out.push(issue("CHAPTER_FIELD", chapter.themeId, "bad chapter field"));
  });
  return out;
}

export function validateChallengeIds(challenges: readonly ChallengeDef[]): ContentIssue[] {
  const out: ContentIssue[] = [];
  for (const id of duplicates(challenges.map((def) => def.id))) {
    out.push(issue("DUPLICATE_ID", id, "duplicate challenge id"));
  }
  for (const name of duplicates(challenges.map((def) => def.name))) {
    out.push(issue("DUPLICATE_NAME", name, "duplicate challenge name"));
  }
  const total = EXPECTED_CHALLENGE_COUNTS.reduce((sum, count) => sum + count, 0);
  if (challenges.length !== total) {
    out.push(issue("CHALLENGE_COUNT", "challenges", `${challenges.length} challenges`));
  }
  const wanted = EXPECTED_CHALLENGE_COUNTS.flatMap((count, chapter) =>
    Array.from(
      { length: count },
      (_, n) => `${CHALLENGE_ID_PREFIXES[chapter]}-${String(n + 1).padStart(2, "0")}`,
    ),
  );
  if (challenges.length !== wanted.length || challenges.some((def, n) => def.id !== wanted[n])) {
    out.push(issue("ID_ORDER", "challenges", "ids are not riv-01..vin-06 in order"));
  }
  const stars = challenges.length * 3;
  if (stars !== EXPECTED_STARS) out.push(issue("TOTAL_STARS", "stars", `${stars} stars`));
  return out;
}

export function validateCards(
  cards: readonly RuleCard[],
  challenges: readonly ChallengeDef[],
): ContentIssue[] {
  const out: ContentIssue[] = [];
  if (cards.length !== EXPECTED_RULE_CARDS) {
    out.push(issue("CARD_COUNT", "cards", `${cards.length} cards`));
  }
  const position = (id: string): number => challenges.findIndex((def) => def.id === id);
  for (const card of cards) {
    if (position(card.shownOn) === -1) {
      out.push(issue("CARD_UNKNOWN_CHALLENGE", card.id, card.shownOn));
    }
  }
  const covered = cards.flatMap((card) => card.kinds);
  for (const kind of RULE_KINDS) {
    if (covered.filter((candidate) => candidate === kind).length !== 1) {
      out.push(issue("CARD_KIND_COVERAGE", kind, "not introduced by exactly one card"));
    }
  }
  challenges.forEach((def, at) => {
    for (const rule of def.rules) {
      const card = cards.find((candidate) => candidate.kinds.includes(rule.kind));
      const shown = card === undefined ? -1 : position(card.shownOn);
      if (card !== undefined && shown > at) {
        out.push(issue("RULE_BEFORE_CARD", def.id, `${rule.kind} before the ${card.title} card`));
      }
    }
  });
  const onePiece = cards.find((card) => card.id === "one-piece");
  const firstDressSet = challenges.findIndex((def) => hasOnePieceRule(def.slotSet));
  if (onePiece !== undefined && position(onePiece.shownOn) > firstDressSet) {
    out.push(issue("RULE_BEFORE_CARD", onePiece.shownOn, "one-piece rule card comes too late"));
  }
  return out;
}

function textIssues(set: ContentSet): ContentIssue[] {
  const out: ContentIssue[] = [];
  for (const entry of collectContentText(set)) {
    const outside = outsideFontSubset(entry.text);
    if (outside.length > 0) {
      out.push(issue("TEXT_CHARSET", entry.label, `outside the font subset: ${outside.join(" ")}`));
    }
    if (hasPlaceholderText(entry.text)) {
      out.push(issue("TEXT_PLACEHOLDER", entry.label, "empty or placeholder text"));
    }
  }
  return out;
}

export function validateContent(options: ValidateContentOptions = {}): ContentIssue[] {
  const pieces = options.pieces ?? PIECES;
  const chapters = options.chapters ?? CHAPTERS;
  const clients = options.clients ?? CLIENTS;
  const challenges = options.challenges ?? CHALLENGES;
  const cards = options.cards ?? RULE_CARDS;
  const out: ContentIssue[] = [
    ...validatePieces(pieces),
    ...validateChapters(chapters, challenges),
    ...validateClients(clients, challenges),
    ...validateChallengeIds(challenges),
    ...validateCards(cards, challenges),
  ];
  for (const def of challenges) {
    const proof = options.proofs?.get(def.id);
    const challengeOptions: ValidateChallengeOptions = proof === undefined ? {} : { proof };
    out.push(...validateChallenge(def, closetFor(def.chapterIndex), challengeOptions));
  }
  if (options.text !== false) {
    out.push(...textIssues({ pieces, chapters, clients, challenges, cards }));
  }
  return out;
}
