import { MAX_STAMPS } from "../constants";
import { PEOPLE } from "./cast";
import { CHAPTERS } from "./chapters";
import { CASES_ALL } from "./all-cases";
import type { CaseContent, ChapterContent, PersonContent } from "./types";

export { ACHIEVEMENTS } from "./achievements";
export { ALMANAC, almanacFor, FACET_LABELS } from "./almanac";
export { CARDS } from "./cards";
export { PEOPLE } from "./cast";
export { CHAPTERS, SETTING } from "./chapters";
export { HEADLINES, headlineFor, RETURN_TO_SENDER, SUBTITLE, TAGLINE, TITLE } from "./headlines";
export { LEDGER } from "./ledger";
export { PLACES, POST_OFFICE, STREETS } from "./places";
export { THEMES } from "./themes";
export * from "./totals";
export { TUTORIAL, TUTORIAL_CASE_ID } from "./tutorial";
export * from "./types";
export {
  type ContentIssue,
  type ContentIssueCode,
  expectedArtSlot,
  revealUsesVocabulary,
  SHIPPED_CONTENT,
  validateCase,
  validateContent,
} from "./validate";

export const CASES: readonly CaseContent[] = CASES_ALL;
export const PEOPLE_BY_ID: Readonly<Record<string, PersonContent>> = Object.fromEntries(
  PEOPLE.map((person) => [person.id, person]),
);
export const CASE_BY_ID: Readonly<Record<string, CaseContent>> = Object.fromEntries(
  CASES.map((item) => [item.id, item]),
);
export const TOTAL_STAMPS = CASES.length * MAX_STAMPS;

export function getCase(id: string): CaseContent | undefined {
  return CASE_BY_ID[id];
}

export function nextCaseId(id: string): string | null {
  const index = CASES.findIndex((item) => item.id === id);
  return CASES[index + 1]?.id ?? null;
}

export function chapterOf(caseId: string): ChapterContent | undefined {
  return CHAPTERS.find((chapter) => chapter.caseIds.includes(caseId));
}
