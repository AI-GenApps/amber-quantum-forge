import { FACETS, PEOPLE_PER_VALUE, VALUES_PER_FACET } from "../constants";
import { ACHIEVEMENTS } from "./achievements";
import { ALMANAC } from "./almanac";
import { CARDS } from "./cards";
import { PEOPLE } from "./cast";
import { CHAPTERS } from "./chapters";
import { CASES_ALL } from "./all-cases";
import { LEDGER } from "./ledger";
import { PLACES, STREETS } from "./places";
import { THEMES } from "./themes";
import {
  CHAPTER_UNLOCKS,
  TOTAL_ACHIEVEMENTS,
  TOTAL_ALMANAC,
  TOTAL_CARDS,
  TOTAL_CASES,
  TOTAL_CLUES,
  TOTAL_DEDUCTIONS,
  TOTAL_DIRECT,
  TOTAL_FLAVOUR_CLUES,
  TOTAL_LEAD_CLUES,
  TOTAL_LEDGER,
  TOTAL_OBJECTS,
  TOTAL_PAIR,
  TOTAL_PEOPLE,
  TOTAL_PLACES,
  TOTAL_RULE_OUT,
  TOTAL_STREETS,
  TOTAL_THEMES,
  TOTAL_TUTORIAL_STEPS,
} from "./totals";
import { TUTORIAL } from "./tutorial";
import type { ContentSet } from "./types";
import { type ContentIssue, type ContentIssueCode, validateCase } from "./validate-case";

export type { ContentIssue, ContentIssueCode } from "./validate-case";
export { expectedArtSlot, revealUsesVocabulary, validateCase } from "./validate-case";

export const SHIPPED_CONTENT: ContentSet = {
  people: PEOPLE,
  cases: CASES_ALL,
  chapters: CHAPTERS,
  places: PLACES,
  streets: STREETS,
  almanac: ALMANAC,
  ledger: LEDGER,
  achievements: ACHIEVEMENTS,
  themes: THEMES,
  cards: CARDS,
  tutorial: TUTORIAL,
};

function duplicates(values: readonly string[]): string[] {
  return values.filter((value, index) => values.indexOf(value) !== index);
}

function countIssues(
  add: (code: ContentIssueCode, subjectId: string) => void,
  expected: [string, number, number][],
) {
  for (const [subject, actual, wanted] of expected) {
    if (actual !== wanted) add("TOTAL_MISMATCH", subject);
  }
}

function castIssues(content: ContentSet, add: (code: ContentIssueCode, id: string) => void) {
  const { people, cases } = content;
  if (people.length !== TOTAL_PEOPLE) add("TOTAL_MISMATCH", "people");
  for (const id of duplicates(people.map((person) => person.id))) add("DUPLICATE_ID", id);
  for (const facet of FACETS) {
    const counts = new Map<string, number>();
    for (const person of people) {
      counts.set(person.facets[facet], (counts.get(person.facets[facet]) ?? 0) + 1);
    }
    if (counts.size !== VALUES_PER_FACET) add("VALUE_HOLDERS", facet);
    for (const [value, held] of counts) {
      if (held !== PEOPLE_PER_VALUE) add("VALUE_HOLDERS", `${facet}:${value}`);
    }
  }
  for (const person of people) {
    const owned = cases.filter((item) => item.ownerId === person.id);
    if (owned.length !== 1 || owned[0]?.id !== person.ownsCaseId) {
      add("PERSON_OWNERSHIP", person.id);
    }
    const appears = cases.filter((item) => item.candidateIds.includes(person.id)).length;
    if (appears < 2 || appears > 4) add("PERSON_APPEARANCES", person.id);
  }
}

function caseSetIssues(content: ContentSet, add: (code: ContentIssueCode, id: string) => void) {
  const { cases, chapters } = content;
  countIssues(add, [
    ["cases", cases.length, TOTAL_CASES],
    ["objects", cases.reduce((sum, item) => sum + item.objects.length, 0), TOTAL_OBJECTS],
    ["clues", cases.reduce((sum, item) => sum + item.clues.length, 0), TOTAL_CLUES],
    [
      "lead",
      cases.reduce((sum, item) => sum + item.clues.filter((c) => c.flavour !== true).length, 0),
      TOTAL_LEAD_CLUES,
    ],
    [
      "flavour",
      cases.reduce((sum, item) => sum + item.clues.filter((c) => c.flavour === true).length, 0),
      TOTAL_FLAVOUR_CLUES,
    ],
    ["deductions", cases.reduce((sum, item) => sum + item.deductions.length, 0), TOTAL_DEDUCTIONS],
  ]);
  const kinds = cases.flatMap((item) => item.deductions.map((entry) => entry.kind));
  countIssues(add, [
    ["direct", kinds.filter((kind) => kind === "direct").length, TOTAL_DIRECT],
    ["pair", kinds.filter((kind) => kind === "pair").length, TOTAL_PAIR],
    ["rule-out", kinds.filter((kind) => kind === "rule-out").length, TOTAL_RULE_OUT],
  ]);
  cases.forEach((item, index) => {
    if (item.id !== String(index + 1).padStart(2, "0")) add("CASE_ORDER", item.id);
  });
  for (const id of duplicates(cases.map((item) => item.id))) add("DUPLICATE_ID", id);
  for (const title of duplicates(cases.map((item) => item.title))) add("DUPLICATE_TITLE", title);
  for (const slug of duplicates(cases.map((item) => item.slug))) add("DUPLICATE_SLUG", slug);
  for (const text of duplicates(cases.flatMap((item) => item.clues.map((c) => c.text)))) {
    add("DUPLICATE_CLUE_TEXT", text);
  }
  for (const text of duplicates(cases.flatMap((item) => item.objects.map((o) => o.caption)))) {
    add("DUPLICATE_CAPTION", text);
  }
  for (const text of duplicates(cases.map((item) => item.reveal))) add("DUPLICATE_REVEAL", text);

  if (chapters.length !== CHAPTER_UNLOCKS.length) add("CHAPTER_CASES", "chapters");
  chapters.forEach((chapter, index) => {
    const inChapter = cases.filter((item) => item.chapter === chapter.id).map((item) => item.id);
    if (inChapter.length !== 4 || inChapter.join() !== chapter.caseIds.join()) {
      add("CHAPTER_CASES", String(chapter.id));
    }
    if (chapter.unlockStamps !== CHAPTER_UNLOCKS[index]) add("CHAPTER_UNLOCK", String(chapter.id));
  });
}

function extrasIssues(content: ContentSet, add: (code: ContentIssueCode, id: string) => void) {
  const { cases, people, places, ledger, achievements, themes, cards, tutorial } = content;
  if (content.almanac.length !== TOTAL_ALMANAC) add("ALMANAC_MISMATCH", "count");
  for (const person of people) {
    for (const facet of FACETS) {
      const known = content.almanac.some(
        (entry) => entry.facet === facet && entry.value === person.facets[facet],
      );
      if (!known) add("ALMANAC_MISMATCH", `${facet}:${person.facets[facet]}`);
    }
  }
  if (places.length !== TOTAL_PLACES || content.streets.length !== TOTAL_STREETS) {
    add("PLACE_MISMATCH", "count");
  }
  for (const item of cases) {
    const place = places.find((entry) => entry.caseId === item.id);
    const owner = people.find((person) => person.id === item.ownerId);
    if (place === undefined || place.name !== item.place || place.street !== owner?.facets.street) {
      add("PLACE_MISMATCH", item.id);
    }
  }
  if (ledger.length !== TOTAL_LEDGER) add("LEDGER_MISMATCH", "count");
  ledger.forEach((fragment, index) => {
    const matching = cases[index];
    if (
      fragment.id !== index + 1 ||
      matching === undefined ||
      fragment.caseId !== matching.id ||
      fragment.title !== matching.ledgerTitle
    ) {
      add("LEDGER_MISMATCH", String(fragment.id));
    }
  });
  if (achievements.length !== TOTAL_ACHIEVEMENTS) add("ACHIEVEMENT_MISMATCH", "count");
  for (const id of duplicates(achievements.map((item) => item.id))) {
    add("ACHIEVEMENT_MISMATCH", id);
  }
  if (themes.length !== TOTAL_THEMES) add("THEME_MISMATCH", "count");
  themes.forEach((theme, index) => {
    const previous = themes[index - 1];
    if (previous !== undefined && theme.stampsNeeded <= previous.stampsNeeded) {
      add("THEME_MISMATCH", theme.id);
    }
  });
  if (cards.length !== TOTAL_CARDS) add("CARD_MISMATCH", "count");
  for (const card of cards) {
    if (!cases.some((item) => item.id === card.caseId)) add("CARD_MISMATCH", card.id);
  }
  if (tutorial.length !== TOTAL_TUTORIAL_STEPS) add("TUTORIAL_MISMATCH", "count");
  tutorial.forEach((step, index) => {
    if (step.step !== index + 1) add("TUTORIAL_MISMATCH", String(step.step));
  });
}

export function validateContent(content: ContentSet = SHIPPED_CONTENT): ContentIssue[] {
  const issues: ContentIssue[] = [];
  const add = (code: ContentIssueCode, subjectId: string) =>
    issues.push({ code, caseId: "", subjectId });
  castIssues(content, add);
  caseSetIssues(content, add);
  extrasIssues(content, add);
  for (const item of content.cases) issues.push(...validateCase(item, content.people));
  return issues;
}
