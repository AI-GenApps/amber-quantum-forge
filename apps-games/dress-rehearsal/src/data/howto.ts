import { HOW_TO_PAGES } from "@web-games/dress-rehearsal-core";

export interface HowToContent {
  readonly id: string;
  readonly title: string;
  /** Paragraphs of the page; the onboarding task fills them in. */
  readonly paragraphs: readonly string[];
}

export const HOW_TO_PARAGRAPHS: Readonly<Record<string, readonly string[]>> = {};

export const HOW_TO: readonly HowToContent[] = HOW_TO_PAGES.map((page) => ({
  id: page.id,
  title: page.title,
  paragraphs: HOW_TO_PARAGRAPHS[page.id] ?? [],
}));
