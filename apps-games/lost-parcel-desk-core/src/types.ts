import type { FACETS } from "./constants";

export type FacetId = (typeof FACETS)[number];
export type Polarity = "is" | "isnot";
export type DeductionKind = "direct" | "pair" | "rule-out";
export type ClueFace = "front" | "zoom" | "back";
export type LinkKind = "fits" | "rules-out";

export interface Person {
  id: string;
  name: string;
  trade: string;
  facets: Record<FacetId, string>;
}

export interface Clue {
  id: string;
  objectId: string;
  face: ClueFace;
  tag: string;
  text: string;
  flavour?: boolean;
}

export interface EvidenceObject {
  id: string;
  name: string;
  caption: string;
}

export interface Deduction {
  id: string;
  facet: FacetId;
  polarity: Polarity;
  value: string;
  kind: DeductionKind;
  clueIds: string[];
}

export interface CaseDef {
  id: string;
  ownerId: string;
  candidateIds: string[];
  objects: EvidenceObject[];
  clues: Clue[];
  deductions: Deduction[];
}

export interface Link {
  clueId: string;
  personId: string;
  kind: LinkKind;
}

export interface CaseState {
  caseId: string;
  candidateIds: string[];
  seenObjectIds: string[];
  foundClueIds: string[];
  pinnedClueIds: string[];
  links: Link[];
  returnedIds: string[];
  wrongAccusations: number;
  hintsUsed: number;
  elapsedMs: number;
  closed: boolean;
  deliveredId: string | null;
  stamps: number | null;
  byElimination: boolean;
}

export type ActionRejection =
  | "CASE_CLOSED"
  | "UNKNOWN_OBJECT"
  | "UNKNOWN_CLUE"
  | "NOT_A_CANDIDATE"
  | "NOT_A_ZOOM_CLUE"
  | "OBJECT_NOT_OPEN"
  | "CLUE_NOT_FOUND"
  | "CLUE_NOT_PINNED"
  | "NO_LINK"
  | "BAD_DURATION";

export type ActionResult =
  | { ok: true; state: CaseState }
  | { ok: false; state: CaseState; reason: ActionRejection };

export type AccuseRejection =
  | "CASE_CLOSED"
  | "NOT_A_CANDIDATE"
  | "ALREADY_RETURNED"
  | "NEEDS_MORE_FITS";

export type AccuseCheck =
  | { ok: true; needed: 0 }
  | { ok: false; reason: AccuseRejection; needed: number };

export type AccuseResult =
  | { ok: false; state: CaseState; reason: AccuseRejection; needed: number }
  | {
      ok: true;
      state: CaseState;
      accusedId: string;
      correct: boolean;
      stamps: number;
      closed: boolean;
      byElimination: boolean;
    };

export type HintRejection = "NOTHING_TO_HINT" | "HINT_LIMIT" | "CASE_CLOSED";

export type HintResult =
  | { ok: false; state: CaseState; reason: HintRejection }
  | {
      ok: true;
      state: CaseState;
      deductionId: string;
      clueIds: string[];
      links: Link[];
      explanation: string;
    };

export type CaseIssueCode =
  | "BAD_CANDIDATE_COUNT"
  | "DUPLICATE_CANDIDATE"
  | "UNKNOWN_PERSON"
  | "OWNER_NOT_CANDIDATE"
  | "NO_UNIQUE_OWNER"
  | "WRONG_OWNER"
  | "DEDUCTION_NOT_NECESSARY"
  | "PAIR_NEEDS_TWO_CLUES"
  | "SINGLE_NEEDS_ONE_CLUE"
  | "POLARITY_KIND_MISMATCH"
  | "UNKNOWN_CLUE"
  | "UNKNOWN_OBJECT"
  | "CLUE_IN_TWO_DEDUCTIONS"
  | "LEAD_CLUE_FLAGGED_FLAVOUR"
  | "FLAVOUR_CLUE_IN_DEDUCTION"
  | "DUPLICATE_FACE"
  | "OBJECT_WITHOUT_CLUE"
  | "TOO_FEW_DEDUCTIONS"
  | "TOO_MANY_DEDUCTIONS";

export interface CaseIssue {
  code: CaseIssueCode;
  caseId: string;
  subjectId: string;
}

export interface WrongExplanation {
  kind: "clue" | "unseen";
  personId: string;
  deductionId: string;
  clueId: string | null;
  clueIds: string[];
  facet: FacetId;
  polarity: Polarity;
  expected: string;
  actual: string;
}

export interface CandidateSummary {
  personId: string;
  fits: number;
  rulesOut: number;
  returned: boolean;
}
