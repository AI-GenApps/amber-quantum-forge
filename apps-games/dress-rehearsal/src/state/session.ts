import {
  CHAPTERS,
  type ChallengeDef,
  CLIENT_BY_ID,
  type ClientDef,
  type DailyChallenge,
  generateDaily,
  getChallenge,
  type Piece,
  type Profile,
  type ThemeId,
  unlockedPieces,
  weekdayOfKey,
} from "@web-games/dress-rehearsal-core";
import { dailySeed } from "@web-games/kit";
import { backdropSlot } from "../art/slots";
import type { StylingTarget } from "../nav";
import { isDailyTarget } from "../nav";
import { ACCENTS } from "../theme/tokens";
import { GAME_ID } from "./saveStores";

export interface Session {
  readonly kind: "campaign" | "daily";
  readonly challenge: ChallengeDef;
  readonly closet: readonly Piece[];
  readonly client: ClientDef;
  readonly dateKey: string | null;
  readonly accent: string;
  readonly backdrop: string;
  readonly themeId: ThemeId;
  readonly chapterTitle: string;
}

const dailyCache = new Map<string, DailyChallenge>();

/** Today's generated challenge for a closet; memoised because generation samples many looks. */
export function dailyChallenge(dateKey: string, closet: readonly Piece[]): DailyChallenge {
  const key = `${dateKey}:${closet.length}`;
  const cached = dailyCache.get(key);
  if (cached) return cached;
  const made = generateDaily({
    seed: dailySeed(GAME_ID, dateKey),
    weekday: weekdayOfKey(dateKey),
    closet,
    dateKey,
  });
  dailyCache.set(key, made);
  return made;
}

export function clearDailyCache(): void {
  dailyCache.clear();
}

export function resolveSession(
  target: StylingTarget,
  profile: Profile,
  dateKey: string,
): Session | null {
  const closet = unlockedPieces(profile);
  if (isDailyTarget(target)) {
    const challenge = dailyChallenge(dateKey, closet);
    const client = CLIENT_BY_ID.get(challenge.clientId);
    if (!client) return null;
    return {
      kind: "daily",
      challenge,
      closet,
      client,
      dateKey,
      accent: ACCENTS.studio,
      backdrop: backdropSlot("studio"),
      themeId: "studio",
      chapterTitle: challenge.name,
    };
  }
  const challenge = getChallenge(target.challengeId);
  const chapter = challenge ? CHAPTERS[challenge.chapterIndex] : undefined;
  const client = challenge ? CLIENT_BY_ID.get(challenge.clientId) : undefined;
  if (!challenge || !chapter || !client) return null;
  return {
    kind: "campaign",
    challenge,
    closet,
    client,
    dateKey: null,
    accent: chapter.accent,
    backdrop: backdropSlot(chapter.themeId),
    themeId: chapter.themeId,
    chapterTitle: chapter.title,
  };
}
