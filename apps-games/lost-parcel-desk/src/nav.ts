import { createRouter, type Router } from "@web-games/kit";

export type CaseTarget = { caseId: string } | { daily: true };
export type ViewerTarget = CaseTarget & { objectId: string };
export type AlmanacTab = "clues" | "townsfolk";
export interface AlmanacTarget {
  tab: AlmanacTab;
  entry?: string;
}

export type Routes = {
  boot: undefined;
  home: undefined;
  files: undefined;
  intro: CaseTarget;
  table: CaseTarget;
  viewer: ViewerTarget;
  board: CaseTarget;
  reveal: CaseTarget;
  map: undefined;
  almanac: AlmanacTarget;
  ledger: undefined;
  daily: undefined;
  achievements: undefined;
  records: undefined;
  themes: undefined;
  settings: undefined;
  howto: undefined;
  credits: undefined;
};

export type AppRouter = Router<Routes>;

export function createAppRouter(): AppRouter {
  return createRouter<Routes>("boot");
}

export function isDailyTarget(target: CaseTarget): target is { daily: true } {
  return "daily" in target;
}

export function targetKey(target: CaseTarget): string {
  return isDailyTarget(target) ? "daily" : target.caseId;
}

const CASE_SCREENS: ReadonlySet<string> = new Set(["intro", "table", "viewer", "board"]);

/** Leaves the case screens (intro, table, viewer, board) and pushes `name` on whatever lies beneath. */
export function leaveCaseTo(router: AppRouter, name: "reveal", target: CaseTarget): void {
  while (CASE_SCREENS.has(router.current.name) && router.pop()) {
    // pop until a non-case screen is on top
  }
  router.push(name, target);
}
