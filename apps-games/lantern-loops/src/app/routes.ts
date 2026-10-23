import type { ChapterId } from "@web-games/lantern-loops-core";

export const HOWTO_PAGES = ["basics", "stones", "mirrors", "gates", "daily", "hints"] as const;
export type HowToPage = (typeof HOWTO_PAGES)[number];

export type Routes = {
  boot: undefined;
  onboarding: undefined;
  home: undefined;
  chapters: undefined;
  puzzleList: { chapter: ChapterId };
  /** A campaign id, a tutorial id or a daily key (`daily-YYYY-MM-DD`). */
  puzzle: { id: string };
  daily: undefined;
  archive: undefined;
  stats: undefined;
  settings: undefined;
  howto: { page: HowToPage };
  about: undefined;
};

export type RouteName = keyof Routes & string;
