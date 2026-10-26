import type { LivePreview, Piece, Slot } from "@web-games/dress-rehearsal-core";
import { t } from "../strings";
import { SLOT_LABELS } from "./model";

export function summary(preview: LivePreview): string {
  return t("announceSummary", {
    met: preview.metCount,
    total: preview.rules.length,
    harmony: preview.harmony.total,
  });
}

export function ruleChanges(before: LivePreview, after: LivePreview): string {
  const notes: string[] = [];
  after.rules.forEach((rule, index) => {
    const was = before.rules[index]?.met ?? false;
    if (rule.met && !was) notes.push(t("announceNowMet", { rule: rule.chip }));
    else if (!rule.met && was) notes.push(t("announceNoLonger", { rule: rule.chip }));
  });
  return notes.join(" ");
}

function finish(parts: readonly string[], before: LivePreview, after: LivePreview): string {
  const complete = after.complete && !before.complete ? t("announceComplete") : "";
  return [...parts, summary(after), ruleChanges(before, after), complete]
    .filter((part) => part !== "")
    .join(" ");
}

export function announcePlaced(
  piece: Piece,
  slot: Slot,
  replaced: Piece | null,
  before: LivePreview,
  after: LivePreview,
): string {
  const base = t("announcePlaced", { slot: SLOT_LABELS[slot], piece: piece.name });
  const swap = replaced ? t("announceReplaced", { piece: replaced.name }) : "";
  return finish([base, swap], before, after);
}

export function announceRemoved(
  piece: Piece,
  slot: Slot,
  before: LivePreview,
  after: LivePreview,
): string {
  return finish(
    [t("announceRemoved", { slot: SLOT_LABELS[slot], piece: piece.name })],
    before,
    after,
  );
}

export function announceHistory(
  action: "undo" | "redo" | "clear",
  before: LivePreview,
  after: LivePreview,
): string {
  const key =
    action === "undo" ? "announceUndo" : action === "redo" ? "announceRedo" : "announceClear";
  return finish([t(key)], before, after);
}

export function announceRefused(piece: Piece, slot: Slot): string {
  return t("toastWrongSlot", { piece: piece.name, slot: SLOT_LABELS[piece.category] ?? slot });
}
