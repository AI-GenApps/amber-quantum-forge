import { FINALE_DAY } from "../constants";
import { DAYS } from "./days";
import { REGULARS } from "./regulars";
import { SCENES } from "./scenes";
import type { DayDef, RegularDef, SceneDef } from "./types";

export * from "./artSlots";
export * from "./calendar";
export * from "./dayCards";
export * from "./days";
export * from "./diary";
export * from "./finale";
export * from "./itemText";
export * from "./readability";
export * from "./regulars";
export { SCENES } from "./scenes";
export * from "./strings";
export * from "./tutorial";
export * from "./types";
export * from "./validate";

export const SCENE_BY_ID: ReadonlyMap<string, SceneDef> = new Map(
  SCENES.map((scene) => [scene.id, scene]),
);

export const ENDING_TITLES: Readonly<Record<number, { a: string; b: string }>> = Object.fromEntries(
  REGULARS.map((regular) => [regular.id, regular.endingTitles]),
);

export function getDay(day: number): DayDef {
  const entry = DAYS.find((candidate) => candidate.day === day);
  if (entry === undefined) throw new RangeError(`no campaign day ${day}`);
  return entry;
}

export function isFinaleDay(day: number): boolean {
  return day === FINALE_DAY;
}

export function getRegular(id: number): RegularDef {
  const entry = REGULARS.find((candidate) => candidate.id === id);
  if (entry === undefined) throw new RangeError(`no regular ${id}`);
  return entry;
}

export function regularsDue(day: number): readonly RegularDef[] {
  return getDay(day).regularsDue.map(getRegular);
}

export function scenesOf(regularId: number): SceneDef[] {
  return SCENES.filter((scene) => scene.regular === regularId);
}

export function sceneFor(regularId: number, index: number): SceneDef | null {
  return SCENES.find((scene) => scene.regular === regularId && scene.index === index) ?? null;
}
