import { MAX_COINS, SCENES_PER_REGULAR } from "../constants";
import { DIARY, type DiaryEntry, REGULARS, SCENE_BY_ID, sceneFor, scenesOf } from "../content";
import { eligibleScenes, eveningLimit } from "../story/eligibility";
import { resolveEnding } from "../story/player";
import type { ChoiceMade, Lean, RegularProgress, SceneRef } from "../story/types";
import { coinsGained, type ProgressEvent } from "./events";
import { type Profile, type RegularRecord, regularOf } from "./profileTypes";

export interface EveningQueue {
  queue: SceneRef[];
  remainder: SceneRef[];
}

export type SceneStatus = "completed" | "replay" | "locked";

export interface SceneApplied {
  status: SceneStatus;
  profile: Profile;
  gift: number;
  ending: Lean | null;
  events: ProgressEvent[];
}

export interface JournalScene {
  id: string;
  index: number;
  title: string;
  available: boolean;
}

export interface JournalEntry {
  regularId: number;
  name: string;
  storyTitle: string;
  scenesDone: number;
  finished: boolean;
  ending: Lean | null;
  endingTitle: string | null;
  scenes: JournalScene[];
}

export function progressOf(profile: Profile): RegularProgress[] {
  return REGULARS.map((regular) => {
    const row = regularOf(profile, regular.id);
    return { regularId: regular.id, fp: row.fp, visits: row.visits, scenesDone: row.scenesDone };
  });
}

function refKey(ref: SceneRef): string {
  return `${ref.regularId}-${ref.index}`;
}

function refOfScene(sceneId: string): SceneRef | null {
  const scene = SCENE_BY_ID.get(sceneId);
  return scene === undefined ? null : { regularId: scene.regular, index: scene.index };
}

export function sceneIdOf(ref: SceneRef): string | null {
  return sceneFor(ref.regularId, ref.index)?.id ?? null;
}

export function waitingScenes(profile: Profile): SceneRef[] {
  return eligibleScenes(progressOf(profile));
}

export function queueEvening(profile: Profile, day: number): EveningQueue & { profile: Profile } {
  const eligible = waitingScenes(profile);
  const keys = new Set(eligible.map(refKey));
  const carried: SceneRef[] = [];
  for (const id of profile.pendingEvening) {
    const ref = refOfScene(id);
    if (ref !== null && keys.has(refKey(ref))) carried.push(ref);
  }
  const carriedKeys = new Set(carried.map(refKey));
  const fresh = eligible
    .filter((ref) => !carriedKeys.has(refKey(ref)))
    .sort((a, b) => a.regularId - b.regularId || a.index - b.index);
  const all = [...carried, ...fresh];
  const limit = eveningLimit(day);
  const queue = all.slice(0, limit);
  const pendingEvening = queue.flatMap((ref) => sceneIdOf(ref) ?? []);
  return { queue, remainder: all.slice(limit), profile: { ...profile, pendingEvening } };
}

export function canReplay(profile: Profile, sceneId: string): boolean {
  const scene = SCENE_BY_ID.get(sceneId);
  return scene !== undefined && regularOf(profile, scene.regular).scenesDone >= scene.index;
}

export function choicesMadeFor(profile: Profile, regularId: number): ChoiceMade[] {
  const row = regularOf(profile, regularId);
  const made: ChoiceMade[] = [];
  for (const scene of scenesOf(regularId)) {
    const choice = scene.choice;
    const option = choice === undefined ? undefined : row.choices[choice.id];
    if (choice !== undefined && option !== undefined) {
      made.push({ choice: choice.id, option, lean: choice.options[option].lean });
    }
  }
  return made;
}

export function endingFor(profile: Profile, regularId: number): Lean | null {
  const made = choicesMadeFor(profile, regularId);
  if (regularOf(profile, regularId).scenesDone < SCENES_PER_REGULAR) return null;
  return resolveEnding(made.map((entry) => entry.lean));
}

function untouched(profile: Profile, status: SceneStatus): SceneApplied {
  return { status, profile, gift: 0, ending: null, events: [] };
}

export function completeScene(
  profile: Profile,
  sceneId: string,
  choice?: ChoiceMade,
): SceneApplied {
  const scene = SCENE_BY_ID.get(sceneId);
  if (scene === undefined) return untouched(profile, "locked");
  const row = regularOf(profile, scene.regular);
  if (row.scenesDone >= scene.index) return untouched(profile, "replay");
  const eligible = waitingScenes(profile).some(
    (ref) => ref.regularId === scene.regular && ref.index === scene.index,
  );
  if (!eligible) return untouched(profile, "locked");
  const choices = { ...row.choices };
  const own = scene.choice;
  if (own !== undefined && choice !== undefined && choice.choice === own.id) {
    choices[own.id] = choice.option;
  }
  const next: RegularRecord = { ...row, scenesDone: scene.index, choices, ending: null };
  const draft: Profile = {
    ...profile,
    regulars: { ...profile.regulars, [scene.regular]: next },
  };
  const ending = scene.index === SCENES_PER_REGULAR ? endingFor(draft, scene.regular) : null;
  const regulars = { ...draft.regulars, [scene.regular]: { ...next, ending } };
  const coins = Math.min(MAX_COINS, profile.coins + scene.gift);
  const done: Profile = {
    ...draft,
    coins,
    regulars,
    pendingEvening: profile.pendingEvening.filter((id) => id !== sceneId),
    stats: { ...profile.stats, scenesRead: profile.stats.scenesRead + 1 },
  };
  return {
    status: "completed",
    profile: done,
    gift: scene.gift,
    ending,
    events: coinsGained(scene.gift, "scene"),
  };
}

export function journalEntries(profile: Profile): JournalEntry[] {
  return REGULARS.map((regular) => {
    const row = regularOf(profile, regular.id);
    const finished = row.scenesDone >= SCENES_PER_REGULAR;
    return {
      regularId: regular.id,
      name: regular.name,
      storyTitle: regular.storyTitle,
      scenesDone: row.scenesDone,
      finished,
      ending: finished ? row.ending : null,
      endingTitle: finished && row.ending !== null ? regular.endingTitles[row.ending] : null,
      scenes: scenesOf(regular.id).map((scene) => ({
        id: scene.id,
        index: scene.index,
        title: scene.title,
        available: scene.index <= row.scenesDone,
      })),
    };
  });
}

export function diaryEntries(profile: Profile): DiaryEntry[] {
  return DIARY.filter((entry) => profile.diary.includes(entry.day));
}
