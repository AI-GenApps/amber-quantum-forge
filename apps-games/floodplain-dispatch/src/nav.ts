import type { RegionId } from "@web-games/floodplain-dispatch-core";
import { createRouter, type Router } from "@web-games/kit";

export type BoardTarget = { mapId: string } | { daily: true };

export type Routes = {
  boot: undefined;
  home: undefined;
  regions: undefined;
  levels: { region: RegionId };
  board: BoardTarget;
  daily: undefined;
  themes: undefined;
  records: undefined;
  settings: undefined;
  howto: undefined;
  credits: undefined;
};

export type AppRouter = Router<Routes>;

export function createAppRouter(): AppRouter {
  return createRouter<Routes>("boot");
}

export function isDailyTarget(target: BoardTarget): target is { daily: true } {
  return "daily" in target;
}
