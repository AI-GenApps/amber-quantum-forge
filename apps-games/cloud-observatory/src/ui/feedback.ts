export type SfxId =
  | "gather"
  | "buy"
  | "upgrade"
  | "star-ok"
  | "star-miss"
  | "chart-done"
  | "lore"
  | "achievement"
  | "eclipse"
  | "comet"
  | "click"
  | "back"
  | "welcome";

export type HapticKind = "light" | "warning" | "success" | "medium";

/** Sound and haptic hooks. `src/audio/feedback.ts` is the real implementation; the null one is for tests. */
export interface Feedback {
  sfx(id: SfxId): void;
  haptic(kind: HapticKind): void;
}

export const nullFeedback: Feedback = {
  sfx: () => undefined,
  haptic: () => undefined,
};
