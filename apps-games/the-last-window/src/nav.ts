import { createRouter, type Router } from "@web-games/kit";
import type { ResultSummary } from "./screens/resultSummary";

export type ShiftTarget = { kind: "day"; day: number } | { kind: "late" };

export type SceneAfter = "home" | "finale" | "pop";

export interface SceneParams {
  ids: readonly string[];
  index: number;
  after: SceneAfter;
  replay: boolean;
}

export interface ResultParams {
  target: ShiftTarget;
  /** Serialised summary built by the shift screen; null for the finale cards. */
  summary: ResultSummary | null;
  finale: boolean;
}

export type Routes = {
  title: undefined;
  home: undefined;
  day: { day: number };
  prep: ShiftTarget;
  shift: ShiftTarget;
  result: ResultParams;
  scene: SceneParams;
  shop: undefined;
  journal: undefined;
  recipes: undefined;
  late: undefined;
  settings: undefined;
  howto: undefined;
  credits: undefined;
};

export type RouteName = keyof Routes;

export const ROUTE_NAMES: readonly RouteName[] = [
  "title",
  "home",
  "day",
  "prep",
  "shift",
  "result",
  "scene",
  "shop",
  "journal",
  "recipes",
  "late",
  "settings",
  "howto",
  "credits",
];

export type AppRouter = Router<Routes>;

export function createAppRouter(): AppRouter {
  return createRouter<Routes>("title");
}

export function targetKey(target: ShiftTarget): string {
  return target.kind === "late" ? "late" : `day-${target.day}`;
}
