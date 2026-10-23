import { CHAPTERS } from "./chapters";
import { CHALLENGES } from "./challenges";
import { CLIENTS } from "./clients";
import { PIECES } from "./pieces";
import type { ChallengeDef, ChapterDef, ClientDef } from "./types";

export * from "./cards";
export * from "./challenges";
export * from "./challenges-gala";
export * from "./challenges-mountain";
export * from "./challenges-rainy-city";
export * from "./challenges-riviera";
export * from "./challenges-studio";
export * from "./challenges-vintage";
export * from "./chapters";
export * from "./clients";
export * from "./define";
export * from "./pieces";
export * from "./strings";
export * from "./types";
export * from "./text";
export * from "./validate";
export * from "./validate-set";

export const CHALLENGE_BY_ID: ReadonlyMap<string, ChallengeDef> = new Map(
  CHALLENGES.map((def) => [def.id, def]),
);

export const CLIENT_BY_ID: ReadonlyMap<string, ClientDef> = new Map(
  CLIENTS.map((client) => [client.id, client]),
);

export const MAX_STARS_PER_CHALLENGE = 3;

export const TOTAL_STARS = CHALLENGES.length * MAX_STARS_PER_CHALLENGE;

export const TOTAL_PIECES = PIECES.length;

export function getChallenge(id: string): ChallengeDef | undefined {
  return CHALLENGE_BY_ID.get(id);
}

export function nextChallengeId(id: string): string | null {
  const index = CHALLENGES.findIndex((def) => def.id === id);
  if (index === -1) return null;
  return CHALLENGES[index + 1]?.id ?? null;
}

export function challengesOfChapter(chapterIndex: number): readonly ChallengeDef[] {
  return CHALLENGES.filter((def) => def.chapterIndex === chapterIndex);
}

export function chapterOf(id: string): ChapterDef | undefined {
  const def = CHALLENGE_BY_ID.get(id);
  return def === undefined ? undefined : CHAPTERS[def.chapterIndex];
}

export function clientOf(id: string): ClientDef | undefined {
  const def = CHALLENGE_BY_ID.get(id);
  return def === undefined ? undefined : CLIENT_BY_ID.get(def.clientId);
}
