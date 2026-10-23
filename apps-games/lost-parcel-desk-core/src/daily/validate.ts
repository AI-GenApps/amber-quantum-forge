import { analyseCase } from "../analyse";
import { PEOPLE } from "../content";
import { firstHit, separatingTerms } from "../content/text-rules";
import type { CaseDef, CaseIssue } from "../types";

export type DailyIssueCode =
  | CaseIssue["code"]
  | "FLAVOUR_KEYWORD_LEAK"
  | "OBJECT_KEYWORD_LEAK"
  | "DUPLICATE_CLUE_TEXT";

export interface DailyIssue {
  code: DailyIssueCode;
  subjectId: string;
}

export function dailyIssues(def: CaseDef): DailyIssue[] {
  const structural = analyseCase(def, PEOPLE).map((item) => ({
    code: item.code,
    subjectId: item.subjectId,
  }));
  if (structural.length > 0) return structural;
  const issues: DailyIssue[] = [];
  const terms = separatingTerms(def, PEOPLE);
  const leadClueIds = def.deductions.flatMap((item) => item.clueIds);
  const leadObjectIds = def.clues
    .filter((clue) => leadClueIds.includes(clue.id))
    .map((clue) => clue.objectId);
  for (const clue of def.clues) {
    if (clue.flavour === true && firstHit(`${clue.tag} ${clue.text}`, terms) !== undefined) {
      issues.push({ code: "FLAVOUR_KEYWORD_LEAK", subjectId: clue.id });
    }
  }
  for (const object of def.objects) {
    if (
      !leadObjectIds.includes(object.id) &&
      firstHit(`${object.name} ${object.caption}`, terms) !== undefined
    ) {
      issues.push({ code: "OBJECT_KEYWORD_LEAK", subjectId: object.id });
    }
  }
  const seen = new Set<string>();
  for (const clue of def.clues) {
    if (seen.has(clue.text)) issues.push({ code: "DUPLICATE_CLUE_TEXT", subjectId: clue.id });
    seen.add(clue.text);
  }
  return issues;
}
