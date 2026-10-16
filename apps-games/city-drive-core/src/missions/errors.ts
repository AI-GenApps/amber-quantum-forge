export type MissionIssueCode =
  | "schema"
  | "unknown-edge"
  | "bad-distance"
  | "stars-not-monotonic"
  | "rewards-not-monotonic"
  | "stars-out-of-range"
  | "bay-geometry"
  | "bad-id"
  | "duplicate-id"
  | "unreachable";

export interface MissionIssue {
  code: MissionIssueCode;
  message: string;
}

export class MissionError extends Error {
  readonly issues: readonly MissionIssue[];

  constructor(missionId: string, issues: readonly MissionIssue[]) {
    const lines = issues.map((i) => `  - [${i.code}] ${i.message}`);
    super(`mission "${missionId}" has ${issues.length} problem(s)\n${lines.join("\n")}`);
    this.name = "MissionError";
    this.issues = issues;
  }
}
