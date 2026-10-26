import {
  CHAPTERS,
  CLIENT_BY_ID,
  type FrameId,
  GAME_TITLE,
  type GalleryEntry,
  getChallenge,
  type Look,
  openSlots,
  SLOT_ORDER,
  type Slot,
  type Stars,
  shareText,
} from "@web-games/dress-rehearsal-core";
import { backdropSlot } from "../art/slots";
import type { Session } from "../state/session";
import { ACCENTS } from "../theme/tokens";
import type { ExportInput } from "./types";

export const DAILY_TITLE = "Daily Fitting" as const;

export interface ResultFacts {
  readonly look: Look;
  readonly stars: Stars;
  readonly harmony: number;
}

export function sessionExportInput(
  session: Session,
  facts: ResultFacts,
  frame: FrameId,
): ExportInput {
  const daily = session.kind === "daily";
  const chapter = daily ? undefined : CHAPTERS[session.challenge.chapterIndex];
  return {
    look: facts.look,
    slots: openSlots(session.challenge.slotSet),
    frame,
    title: daily ? DAILY_TITLE : `${session.chapterTitle} - ${session.challenge.name}`,
    subtitle: daily ? (session.dateKey ?? "") : (chapter?.chapterTitle ?? session.chapterTitle),
    clientName: session.client.name,
    stars: facts.stars,
    harmony: facts.harmony,
    accent: session.accent,
    gameTitle: GAME_TITLE,
    backdropSlot: session.backdrop,
  };
}

export function sessionShareText(session: Session, facts: ResultFacts, streak: number): string {
  if (session.kind === "daily") {
    return shareText("daily", {
      dateKey: session.dateKey ?? "",
      stars: facts.stars,
      harmony: facts.harmony,
      streak,
    });
  }
  return shareText("campaign", {
    challengeId: session.challenge.id,
    stars: facts.stars,
    harmony: facts.harmony,
  });
}

/** Export input for a saved board; daily boards store no client, so the headline is the date. */
export function entryExportInput(entry: GalleryEntry, frame: FrameId): ExportInput | null {
  if (entry.kind === "campaign") {
    const def = getChallenge(entry.ref);
    const chapter = def ? CHAPTERS[def.chapterIndex] : undefined;
    const client = def ? CLIENT_BY_ID.get(def.clientId) : undefined;
    if (!def || !chapter) return null;
    return {
      look: entry.look,
      slots: openSlots(def.slotSet),
      frame,
      title: `${chapter.title} - ${def.name}`,
      subtitle: chapter.chapterTitle,
      clientName: client?.name ?? null,
      stars: entry.stars,
      harmony: entry.harmony,
      accent: chapter.accent,
      gameTitle: GAME_TITLE,
      backdropSlot: backdropSlot(chapter.themeId),
    };
  }
  return {
    look: entry.look,
    slots: slotsOfLook(entry.look),
    frame,
    title: DAILY_TITLE,
    subtitle: entry.ref,
    clientName: null,
    stars: entry.stars,
    harmony: entry.harmony,
    accent: ACCENTS.studio,
    gameTitle: GAME_TITLE,
    backdropSlot: backdropSlot("studio"),
  };
}

export function entryShareText(entry: GalleryEntry, streak: number): string {
  if (entry.kind === "daily") {
    return shareText("daily", {
      dateKey: entry.ref,
      stars: entry.stars,
      harmony: entry.harmony,
      streak,
    });
  }
  return shareText("campaign", {
    challengeId: entry.ref,
    stars: entry.stars,
    harmony: entry.harmony,
  });
}

/** Slots that hold a piece, for daily boards that stored only a look. */
export function slotsOfLook(look: Look): Slot[] {
  return SLOT_ORDER.filter((slot) => look[slot] !== undefined);
}
