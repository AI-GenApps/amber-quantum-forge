export type Lean = "a" | "b";
export type OptionKey = "a" | "b";
export type BeatMood = "neutral" | "happy" | "sad";

export interface Guard {
  choice: string;
  option: OptionKey;
}

export interface Beat {
  speaker: string;
  text: string;
  mood?: BeatMood;
  guard?: Guard;
}

export interface Option {
  label: string;
  lean: Lean;
  reaction: readonly Beat[];
}

export interface Choice {
  id: string;
  prompt: string;
  afterBeat: number;
  options: Readonly<Record<OptionKey, Option>>;
}

export interface EndingBlock {
  title: string;
  beats: readonly Beat[];
}

export interface SceneScript {
  id: string;
  regular: number;
  index: 1 | 2 | 3 | 4 | 5;
  title: string;
  beats: readonly Beat[];
  choice?: Choice;
  endings?: Readonly<Record<Lean, EndingBlock>>;
}

export interface ChoiceMade {
  choice: string;
  option: OptionKey;
  lean: Lean;
}

export interface RegularProgress {
  regularId: number;
  fp: number;
  visits: number;
  scenesDone: number;
}

export interface SceneRef {
  regularId: number;
  index: number;
}
