import type { Beat, SceneScript } from "../../src";

export function beat(text: string, extra: Partial<Beat> = {}): Beat {
  return { speaker: "narration", text, ...extra };
}

export const CHOICE_SCENE: SceneScript = {
  id: "test-2-2",
  regular: 2,
  index: 2,
  title: "The Letter",
  beats: [
    beat("one"),
    beat("two"),
    beat("three"),
    beat("after-a", { guard: { choice: "c1", option: "a" } }),
    beat("after-b", { guard: { choice: "c1", option: "b" } }),
    beat("closing"),
  ],
  choice: {
    id: "c1",
    prompt: "What do you say?",
    afterBeat: 3,
    options: {
      a: { label: "Stay", lean: "a", reaction: [beat("react-a1"), beat("react-a2")] },
      b: { label: "Go", lean: "b", reaction: [beat("react-b1"), beat("react-b2")] },
    },
  },
};

export const PLAIN_SCENE: SceneScript = {
  id: "test-2-1",
  regular: 2,
  index: 1,
  title: "Plain",
  beats: [beat("p1"), beat("p2", { guard: { choice: "c0", option: "a" } }), beat("p3")],
};

export const FINAL_SCENE: SceneScript = {
  id: "test-2-5",
  regular: 2,
  index: 5,
  title: "The Ending",
  beats: [beat("f1"), beat("f2", { guard: { choice: "c1", option: "b" } }), beat("f3")],
  endings: {
    a: { title: "Ending A", beats: [beat("end-a1"), beat("end-a2")] },
    b: { title: "Ending B", beats: [beat("end-b1"), beat("end-b2"), beat("end-b3")] },
  },
};

export const FINAL_WITH_CHOICE: SceneScript = {
  ...FINAL_SCENE,
  id: "test-3-5",
  choice: {
    id: "c9",
    prompt: "Last choice?",
    afterBeat: 1,
    options: {
      a: { label: "A", lean: "a", reaction: [beat("r9a")] },
      b: { label: "B", lean: "b", reaction: [beat("r9b")] },
    },
  },
};
