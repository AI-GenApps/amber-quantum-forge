import { FINAL_SCENE_GIFT, SCENE_GIFT } from "../../constants";
import type { Beat, BeatMood, Choice, EndingBlock, Guard, OptionKey } from "../../story/types";
import type { SceneDef } from "../types";

function make(speaker: string, text: string, mood?: BeatMood, guard?: Guard): Beat {
  return {
    speaker,
    text,
    ...(mood === undefined ? {} : { mood }),
    ...(guard === undefined ? {} : { guard }),
  };
}

export function when(choice: string, option: OptionKey): Guard {
  return { choice, option };
}

export interface Voice {
  say: (text: string, mood?: BeatMood, guard?: Guard) => Beat;
  you: (text: string, guard?: Guard) => Beat;
  note: (text: string, guard?: Guard) => Beat;
}

export function voice(regularId: number): Voice {
  const speaker = `regular-${regularId}`;
  return {
    say: (text, mood, guard) => make(speaker, text, mood, guard),
    you: (text, guard) => make("you", text, undefined, guard),
    note: (text, guard) => make("narration", text, undefined, guard),
  };
}

export interface OptionDraft {
  label: string;
  reaction: readonly Beat[];
}

export function choice(
  id: string,
  prompt: string,
  afterBeat: number,
  a: OptionDraft,
  b: OptionDraft,
): Choice {
  return {
    id,
    prompt,
    afterBeat,
    options: {
      a: { label: a.label, lean: "a", reaction: a.reaction },
      b: { label: b.label, lean: "b", reaction: b.reaction },
    },
  };
}

export function ending(title: string, beats: readonly Beat[]): EndingBlock {
  return { title, beats };
}

export interface SceneDraft {
  regular: number;
  index: 1 | 2 | 3 | 4 | 5;
  title: string;
  beats: readonly Beat[];
  choice?: Choice;
  endings?: { a: EndingBlock; b: EndingBlock };
}

export function scene(draft: SceneDraft): SceneDef {
  return {
    id: `scene-${draft.regular}-${draft.index}`,
    regular: draft.regular,
    index: draft.index,
    title: draft.title,
    beats: draft.beats,
    gift: draft.index === 5 ? FINAL_SCENE_GIFT : SCENE_GIFT,
    next: draft.index === 5 ? null : `scene-${draft.regular}-${draft.index + 1}`,
    ...(draft.choice === undefined ? {} : { choice: draft.choice }),
    ...(draft.endings === undefined ? {} : { endings: draft.endings }),
  };
}
