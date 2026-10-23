import { HOWTO_PAGES, type HowToPage } from "../app/routes";
import { t } from "../strings";

export interface HowToCopy {
  title: () => string;
  body: () => string;
  diagram: () => string;
}

/** The six pages. Each body stays at 60 words or fewer (a test counts them). */
export const HOWTO_COPY: Readonly<Record<HowToPage, HowToCopy>> = {
  basics: {
    title: () => t("howto.basics"),
    body: () => t("howto.basicsBody"),
    diagram: () => t("howto.basicsDiagram"),
  },
  stones: {
    title: () => t("howto.stones"),
    body: () => t("howto.stonesBody"),
    diagram: () => t("howto.stonesDiagram"),
  },
  mirrors: {
    title: () => t("howto.mirrors"),
    body: () => t("howto.mirrorsBody"),
    diagram: () => t("howto.mirrorsDiagram"),
  },
  gates: {
    title: () => t("howto.gates"),
    body: () => t("howto.gatesBody"),
    diagram: () => t("howto.gatesDiagram"),
  },
  daily: {
    title: () => t("howto.daily"),
    body: () => t("howto.dailyBody"),
    diagram: () => t("howto.dailyDiagram"),
  },
  hints: {
    title: () => t("howto.hints"),
    body: () => t("howto.hintsBody"),
    diagram: () => t("howto.hintsDiagram"),
  },
};

export const MAX_HOWTO_WORDS = 60;

export function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function pageIndex(page: HowToPage): number {
  return Math.max(0, HOWTO_PAGES.indexOf(page));
}
