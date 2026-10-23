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

/** Sound and haptic hooks. Task 05 supplies the real implementation; here it does nothing. */
export interface Feedback {
  sfx(id: SfxId): void;
  haptic(kind: HapticKind): void;
}

export const nullFeedback: Feedback = {
  sfx: () => undefined,
  haptic: () => undefined,
};
