import { type EconomyEvent, THEMES } from "@web-games/lost-parcel-desk-core";

export interface EventSummary {
  postage: number;
  chapterBonus: { chapter: number; amount: number } | null;
  themes: string[];
  chapters: number[];
  streak: number | null;
  streakReset: boolean;
  freezeUsed: boolean;
}

/** Folds the economy events of a closed case into what the reveal screen shows. */
export function summarizeEvents(events: readonly EconomyEvent[]): EventSummary {
  const out: EventSummary = {
    postage: 0,
    chapterBonus: null,
    themes: [],
    chapters: [],
    streak: null,
    streakReset: false,
    freezeUsed: false,
  };
  for (const event of events) {
    switch (event.type) {
      case "postage-gained":
        out.postage += event.amount;
        break;
      case "chapter-bonus":
        out.chapterBonus = { chapter: event.chapter, amount: event.amount };
        break;
      case "theme-unlocked":
        out.themes.push(THEMES.find((theme) => theme.id === event.themeId)?.name ?? event.themeId);
        break;
      case "chapter-unlocked":
        out.chapters.push(event.chapter);
        break;
      case "streak-extended":
        out.streak = event.streak;
        break;
      case "streak-reset":
        out.streakReset = true;
        break;
      case "freeze-used":
        out.freezeUsed = true;
        break;
      default:
        break;
    }
  }
  return out;
}
