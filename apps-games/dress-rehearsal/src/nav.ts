import { createRouter, type Router } from "@web-games/kit";

export type StylingTarget = { challengeId: string } | { daily: true };

export type Routes = {
  boot: undefined;
  home: undefined;
  chapters: undefined;
  challenges: { chapter: number };
  styling: StylingTarget;
  daily: undefined;
  closet: undefined;
  clients: undefined;
  gallery: undefined;
  settings: undefined;
  howto: undefined;
  credits: undefined;
};

export type AppRouter = Router<Routes>;

export function createAppRouter(): AppRouter {
  return createRouter<Routes>("boot");
}

export function isDailyTarget(target: StylingTarget): target is { daily: true } {
  return "daily" in target;
}
