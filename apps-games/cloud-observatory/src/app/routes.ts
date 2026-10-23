import { createRouter, type Router } from "@web-games/kit";

export type TabId = "observe" | "build" | "atlas" | "eclipse" | "journal";

export const TAB_IDS: readonly TabId[] = ["observe", "build", "atlas", "eclipse", "journal"];

export type Routes = {
  title: undefined;
  shell: undefined;
  chart: { readonly id: string };
  comet: undefined;
  achievements: undefined;
  statistics: undefined;
  settings: undefined;
  howto: undefined;
};

export type AppRouter = Router<Routes>;

export function createAppRouter(): AppRouter {
  return createRouter<Routes>("title");
}
